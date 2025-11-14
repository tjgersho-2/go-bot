# main.py - FastAPI Backend for Jira Clarifier
import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, HTTPException, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import anthropic
from pinecone import Pinecone
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import stripe
from contextlib import asynccontextmanager

# ============================================================================
# Configuration
# ============================================================================

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Feature flags
ENABLE_RAG = os.getenv("ENABLE_RAG", "false").lower() == "true"
ENABLE_RATE_LIMITING = os.getenv("ENABLE_RATE_LIMITING", "true").lower() == "true"
ENABLE_PAYMENTS = os.getenv("ENABLE_PAYMENTS", "false").lower() == "true"
ENABLE_ANALYTICS = os.getenv("ENABLE_ANALYTICS", "true").lower() == "true"

# Rate limiting config
RATE_LIMIT_FREE = int(os.getenv("RATE_LIMIT_FREE", "5"))  # per month
RATE_LIMIT_PRO = int(os.getenv("RATE_LIMIT_PRO", "999999"))  # unlimited
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds

# ============================================================================
# Initialize Services
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    # Startup
    print("🚀 Initializing services...")
    
    # Initialize Claude
    app.state.claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
    
    # Initialize Pinecone (optional)
    if ENABLE_RAG and PINECONE_API_KEY:
        app.state.pc = Pinecone(api_key=PINECONE_API_KEY)
        app.state.index = app.state.pc.Index("jira-vectors")
        print("✅ Pinecone initialized")
    
    # Initialize Redis (optional)
    if ENABLE_RATE_LIMITING and REDIS_URL:
        try:
            app.state.redis = redis.from_url(REDIS_URL, decode_responses=True)
            app.state.redis.ping()
            print("✅ Redis initialized")
        except Exception as e:
            print(f"⚠️  Redis unavailable: {e}")
            app.state.redis = None
    
    # Initialize Stripe (optional)
    if ENABLE_PAYMENTS and STRIPE_SECRET_KEY:
        stripe.api_key = STRIPE_SECRET_KEY
        print("✅ Stripe initialized")
    
    print("✅ All services ready")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    if hasattr(app.state, 'redis') and app.state.redis:
        app.state.redis.close()

app = FastAPI(
    title="Jira Clarifier API",
    description="AI-powered Jira ticket clarification with Claude",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Models
# ============================================================================

class TicketInput(BaseModel):
    title: str = Field(..., description="Jira ticket title")
    description: str = Field(default="", description="Jira ticket description")
    issueType: Optional[str] = Field(default="Task", description="Issue type (Bug, Task, Story)")
    priority: Optional[str] = Field(default="Medium", description="Priority level")
    orgId: Optional[str] = Field(default=None, description="Organization ID for auth")
    userId: Optional[str] = Field(default=None, description="User ID for rate limiting")

class ClarifiedOutput(BaseModel):
    acceptanceCriteria: List[str] = Field(default_factory=list)
    edgeCases: List[str] = Field(default_factory=list)
    successMetrics: List[str] = Field(default_factory=list)
    testScenarios: List[str] = Field(default_factory=list)
    confidence: Optional[float] = Field(default=None, description="AI confidence score")
    processingTime: Optional[float] = Field(default=None, description="Processing time in seconds")

class UsageStats(BaseModel):
    clarificationsUsed: int
    clarificationsRemaining: int
    plan: str
    resetDate: Optional[str]

# ============================================================================
# Database Helpers
# ============================================================================

def get_db_connection():
    """Get PostgreSQL connection"""
    if not DATABASE_URL:
        return None
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def init_database():
    """Initialize database schema"""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cur = conn.cursor()
        
        # Organizations table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id SERIAL PRIMARY KEY,
                org_id VARCHAR(255) UNIQUE NOT NULL,
                plan VARCHAR(50) DEFAULT 'free',
                stripe_customer_id VARCHAR(255),
                clarifications_used INTEGER DEFAULT 0,
                clarifications_limit INTEGER DEFAULT 5,
                reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Tickets table for analytics
        cur.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id SERIAL PRIMARY KEY,
                org_id VARCHAR(255),
                ticket_title TEXT,
                ticket_description TEXT,
                issue_type VARCHAR(50),
                priority VARCHAR(50),
                clarified_output JSONB,
                processing_time FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_org_id ON organizations(org_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets(org_id)")
        
        conn.commit()
        print("✅ Database initialized")
    except Exception as e:
        print(f"Database init error: {e}")
    finally:
        conn.close()

# Initialize on startup
if DATABASE_URL:
    init_database()

# ============================================================================
# User & Auth Helpers
# ============================================================================

def get_org_data(org_id: str) -> Optional[Dict]:
    """Get organization data from database"""
    if not DATABASE_URL or not org_id:
        return None
    
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM organizations WHERE org_id = %s
        """, (org_id,))
        org = cur.fetchone()
        
        if not org:
            # Create new org with free plan
            cur.execute("""
                INSERT INTO organizations (org_id, plan, clarifications_limit)
                VALUES (%s, 'free', %s)
                RETURNING *
            """, (org_id, RATE_LIMIT_FREE))
            conn.commit()
            org = cur.fetchone()
        
        return dict(org) if org else None
    except Exception as e:
        print(f"Error getting org data: {e}")
        return None
    finally:
        conn.close()

def check_rate_limit(org_id: str, redis_client) -> bool:
    """Check if organization is within rate limits"""
    if not ENABLE_RATE_LIMITING:
        return True
    
    org = get_org_data(org_id)
    if not org:
        return True  # Allow if no DB
    
    # Check monthly limit
    if org['clarifications_used'] >= org['clarifications_limit']:
        return False
    
    # Redis-based rate limiting for burst protection (optional)
    if redis_client:
        key = f"rate:{org_id}"
        count = redis_client.incr(key)
        if count == 1:
            redis_client.expire(key, RATE_LIMIT_WINDOW)
        if count > 10:  # Max 10 requests per minute
            return False
    
    return True

def increment_usage(org_id: str):
    """Increment clarification usage counter"""
    if not DATABASE_URL or not org_id:
        return
    
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE organizations 
            SET clarifications_used = clarifications_used + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE org_id = %s
        """, (org_id,))
        conn.commit()
    except Exception as e:
        print(f"Error incrementing usage: {e}")
    finally:
        conn.close()

# ============================================================================
# AI Processing
# ============================================================================

async def get_similar_tickets(description: str, org_id: str) -> List[Dict]:
    """Get similar tickets using RAG (Pinecone)"""
    if not ENABLE_RAG or not hasattr(app.state, 'index'):
        return []
    
    try:
        # Get embedding from Claude (or use OpenAI if preferred)
        # For now, return empty - you'd implement actual embedding here
        # This would require an embedding model
        return []
    except Exception as e:
        print(f"RAG error: {e}")
        return []

async def generate_clarification(ticket: TicketInput) -> ClarifiedOutput:
    """Generate clarification using Claude AI"""
    start_time = datetime.now()
    
    if not app.state.claude:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    # Get similar tickets for context (optional)
    similar_tickets = await get_similar_tickets(ticket.description, ticket.orgId or "unknown")
    
    # Build prompt
    prompt = f"""You are a senior software engineer helping to clarify Jira tickets. Given the following ticket information, provide clear, actionable acceptance criteria and additional details.

Ticket Title: {ticket.title}
Description: {ticket.description or 'No description provided'}
Issue Type: {ticket.issueType}
Priority: {ticket.priority}

{"Similar past tickets for context:" + json.dumps(similar_tickets, indent=2) if similar_tickets else ""}

Please provide a structured response with:
1. Acceptance Criteria (specific, testable conditions using Given-When-Then format where appropriate)
2. Edge Cases to Consider (potential issues, boundary conditions)
3. Success Metrics (measurable outcomes, KPIs)
4. Test Scenarios (specific test cases for QA)

Format your response as valid JSON with these exact keys:
{{
  "acceptanceCriteria": ["criterion 1", "criterion 2", ...],
  "edgeCases": ["edge case 1", "edge case 2", ...],
  "successMetrics": ["metric 1", "metric 2", ...],
  "testScenarios": ["scenario 1", "scenario 2", ...]
}}

Focus on being practical and actionable. Provide at least 3-5 items for each category."""

    try:
        # Call Claude API
        message = app.state.claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        # Parse response
        content = message.content[0].text
        
        # Handle potential markdown code blocks
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0].strip()
        elif '```' in content:
            content = content.split('```')[1].split('```')[0].strip()
        
        parsed = json.loads(content)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Build output
        output = ClarifiedOutput(
            acceptanceCriteria=parsed.get('acceptanceCriteria', []),
            edgeCases=parsed.get('edgeCases', []),
            successMetrics=parsed.get('successMetrics', []),
            testScenarios=parsed.get('testScenarios', []),
            processingTime=processing_time
        )
        
        return output
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Content: {content}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        print(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

def store_ticket(ticket: TicketInput, output: ClarifiedOutput):
    """Store ticket for analytics and future training"""
    if not ENABLE_ANALYTICS or not DATABASE_URL:
        return
    
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO tickets 
            (org_id, ticket_title, ticket_description, issue_type, priority, clarified_output, processing_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            ticket.orgId or 'unknown',
            ticket.title,
            ticket.description,
            ticket.issueType,
            ticket.priority,
            json.dumps(output.dict()),
            output.processingTime
        ))
        conn.commit()
    except Exception as e:
        print(f"Error storing ticket: {e}")
    finally:
        conn.close()

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Jira Clarifier API",
        "version": "1.0.0",
        "status": "operational",
        "features": {
            "rag": ENABLE_RAG,
            "rateLimiting": ENABLE_RATE_LIMITING,
            "payments": ENABLE_PAYMENTS,
            "analytics": ENABLE_ANALYTICS
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "claude": app.state.claude is not None,
            "redis": hasattr(app.state, 'redis') and app.state.redis is not None,
            "database": DATABASE_URL is not None,
            "pinecone": hasattr(app.state, 'index')
        }
    }
    return health

@app.post("/clarify", response_model=ClarifiedOutput)
async def clarify_ticket(ticket: TicketInput):
    """
    Main endpoint: Clarify a Jira ticket using AI
    
    This endpoint accepts a ticket and returns structured clarification including
    acceptance criteria, edge cases, success metrics, and test scenarios.
    """
    org_id = ticket.orgId or "default"
    
    # Rate limiting check
    if ENABLE_RATE_LIMITING:
        redis_client = getattr(app.state, 'redis', None)
        if not check_rate_limit(org_id, redis_client):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please upgrade your plan or try again later."
            )
    
    # Generate clarification
    try:
        output = await generate_clarification(ticket)
        
        # Increment usage counter
        increment_usage(org_id)
        
        # Store for analytics
        store_ticket(ticket, output)
        
        return output
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Clarification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to clarify ticket")

@app.get("/usage/{org_id}", response_model=UsageStats)
async def get_usage(org_id: str):
    """Get usage statistics for an organization"""
    org = get_org_data(org_id)
    
    if not org:
        return UsageStats(
            clarificationsUsed=0,
            clarificationsRemaining=RATE_LIMIT_FREE,
            plan="free",
            resetDate=None
        )
    
    return UsageStats(
        clarificationsUsed=org['clarifications_used'],
        clarificationsRemaining=max(0, org['clarifications_limit'] - org['clarifications_used']),
        plan=org['plan'],
        resetDate=org['reset_date'].isoformat() if org['reset_date'] else None
    )

@app.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhooks for payment processing"""
    if not ENABLE_PAYMENTS:
        raise HTTPException(status_code=404, detail="Payments not enabled")
    
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle different event types
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        org_id = session.get('client_reference_id')
        
        # Upgrade organization to Pro
        conn = get_db_connection()
        if conn and org_id:
            try:
                cur = conn.cursor()
                cur.execute("""
                    UPDATE organizations 
                    SET plan = 'pro',
                        clarifications_limit = %s,
                        stripe_customer_id = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE org_id = %s
                """, (RATE_LIMIT_PRO, session.get('customer'), org_id))
                conn.commit()
            finally:
                conn.close()
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        customer_id = subscription['customer']
        
        # Downgrade to free plan
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                cur.execute("""
                    UPDATE organizations 
                    SET plan = 'free',
                        clarifications_limit = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_customer_id = %s
                """, (RATE_LIMIT_FREE, customer_id))
                conn.commit()
            finally:
                conn.close()
    
    return {"status": "success"}

@app.get("/analytics/{org_id}")
async def get_analytics(org_id: str):
    """Get analytics for an organization"""
    if not ENABLE_ANALYTICS or not DATABASE_URL:
        raise HTTPException(status_code=404, detail="Analytics not enabled")
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        cur = conn.cursor()
        
        # Get ticket stats
        cur.execute("""
            SELECT 
                COUNT(*) as total_tickets,
                AVG(processing_time) as avg_processing_time,
                COUNT(DISTINCT DATE(created_at)) as active_days
            FROM tickets
            WHERE org_id = %s
            AND created_at > NOW() - INTERVAL '30 days'
        """, (org_id,))
        stats = cur.fetchone()
        
        # Get ticket types breakdown
        cur.execute("""
            SELECT issue_type, COUNT(*) as count
            FROM tickets
            WHERE org_id = %s
            AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY issue_type
        """, (org_id,))
        types = cur.fetchall()
        
        return {
            "totalTickets": stats['total_tickets'] if stats else 0,
            "avgProcessingTime": float(stats['avg_processing_time']) if stats and stats['avg_processing_time'] else 0,
            "activeDays": stats['active_days'] if stats else 0,
            "ticketTypes": [dict(t) for t in types] if types else []
        }
        
    finally:
        conn.close()

# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

# ============================================================================
# Development
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
    