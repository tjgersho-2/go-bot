# main.py - FastAPI Backend for Go Bot
import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv


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

import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional
import secrets
import string

import stripe
import secrets
import string
from datetime import datetime, timedelta



load_dotenv()

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

JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 30  # 30 days

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
    title="Go Bot API",
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
    install: Optional[str] = Field(default=None, description="Organization ID for auth")
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

class FeedbackInput(BaseModel):
    ticketData: Dict[str, Any]
    clarifiedOutput: Dict[str, Any]
    feedbackType: str = Field(..., description="'upvote' or 'downvote'")
    install: str
    comment: Optional[str] = None

class AccessKeyInput(BaseModel):
    accessKey: str = Field(..., description="License key to validate")
    install: str | None = None

class AccessKeyResponse(BaseModel):
    valid: bool
    install: Optional[str] = None
    plan: Optional[str] = None
    message: Optional[str] = None
    clarificationsRemaining: Optional[int] = None
 
class InstallData(BaseModel):
    install: str
 
class CreatePaymentIntentInput(BaseModel):
    planId: str = Field(..., description="Plan ID (pro or team)")

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
                
        # Tickets table for analytics
        cur.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id SERIAL PRIMARY KEY,
                install VARCHAR(255),
                ticket_title TEXT,
                ticket_description TEXT,
                issue_type VARCHAR(50),
                priority VARCHAR(50),
                clarified_output JSONB,
                processing_time FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
 
        """Add these table creations to your init_database() function"""
        
        # Feedback table for fine-tuning
        cur.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id SERIAL PRIMARY KEY,
                install VARCHAR(255),
                ticket_title TEXT,
                ticket_description TEXT,
                clarified_output JSONB,
                feedback_type VARCHAR(20) CHECK (feedback_type IN ('upvote', 'downvote')),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Update license_keys table for subscriptions
        cur.execute("""
            CREATE TABLE IF NOT EXISTS license_keys (
                id SERIAL PRIMARY KEY,
                key_code VARCHAR(255) UNIQUE NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                plan VARCHAR(50) NOT NULL,
                
                -- Subscription fields
                stripe_subscription_id VARCHAR(255),
                stripe_customer_id VARCHAR(255),
                stripe_session_id VARCHAR(255),
                
                -- Usage tracking
                clarifications_limit INTEGER NOT NULL,
                clarifications_used INTEGER DEFAULT 0,
                usage_resets_at TIMESTAMP,
                
                -- Status
                is_active BOOLEAN DEFAULT true,
                subscription_status VARCHAR(50) DEFAULT 'active',
                activated_at TIMESTAMP,
                expires_at TIMESTAMP,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_key_code ON license_keys(key_code)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_email ON license_keys(customer_email)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_subscription ON license_keys(stripe_subscription_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_customer ON license_keys(stripe_customer_id)")

    
        # Indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_key_code ON license_keys(key_code)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_email ON license_keys(customer_email)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_session ON license_keys(stripe_session_id)")

        
        # Create indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_feedback_org ON feedback(install)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_keys ON license_keys(key_code)")

        # Create indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_install ON organizations(install)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets(install)")
        
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

def increment_usage(install: str):
    """Increment clarification usage counter"""
    if not DATABASE_URL or not install:
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
            WHERE install = %s
        """, (install,))
        conn.commit()
    except Exception as e:
        print(f"Error incrementing usage: {e}")
    finally:
        conn.close()


def validate_access_key(key_code: str) -> Optional[Dict]:
    """Validate an access key and return org info"""
    if not DATABASE_URL:
        return None
    
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        
        # Check if key exists and is active
        cur.execute("""
            SELECT lk.*, o.plan, o.clarifications_used, o.clarifications_limit
            FROM license_keys lk
            LEFT JOIN organizations o ON lk.install = o.install
            WHERE lk.key_code = %s 
            AND lk.is_active = true
            AND (lk.expires_at IS NULL OR lk.expires_at > NOW())
        """, (key_code,))
        
        key_data = cur.fetchone()
        
        if not key_data:
            return None
        
        # If key hasn't been activated yet, create/update org
        if not key_data['activated_at']:
            install = key_data['install'] or f"org_{key_code[:8]}"
            
            # Create or update organization
            cur.execute("""
                INSERT INTO organizations (install, plan, clarifications_limit, clarifications_used)
                VALUES (%s, %s, %s, 0)
                ON CONFLICT (install) 
                DO UPDATE SET 
                    plan = EXCLUDED.plan,
                    clarifications_limit = EXCLUDED.clarifications_limit,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            """, (install, key_data['plan'], RATE_LIMIT_PRO))
            
            # Update license key with install and activation time
            cur.execute("""
                UPDATE license_keys 
                SET install = %s, activated_at = NOW()
                WHERE key_code = %s
            """, (install, key_code))
            
            conn.commit()
            
            # Fetch updated org data
            cur.execute("SELECT * FROM organizations WHERE install = %s", (install,))
            org_data = cur.fetchone()
        else:
            # Fetch existing org data
            cur.execute("SELECT * FROM organizations WHERE install = %s", (key_data['install'],))
            org_data = cur.fetchone()
        
        return dict(org_data) if org_data else None
        
    except Exception as e:
        print(f"Error validating access key: {e}")
        return None
    finally:
        conn.close()


def store_feedback(feedback: FeedbackInput):
    """Store user feedback for model fine-tuning"""
    if not DATABASE_URL:
        return
    
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO feedback 
            (install, ticket_title, ticket_description, clarified_output, feedback_type, comment)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            feedback.install,
            feedback.ticketData.get('title'),
            feedback.ticketData.get('description'),
            json.dumps(feedback.clarifiedOutput),
            feedback.feedbackType,
            feedback.comment
        ))
        conn.commit()
        print(f"✅ Stored {feedback.feedbackType} feedback from {feedback.install}")
    except Exception as e:
        print(f"Error storing feedback: {e}")
    finally:
        conn.close()

def get_plan_limits(plan_id: str) -> int:
    """Get clarification limit based on plan"""
    limits = {
        'free': 5,
        'pro': 100,
        'team': 1000
    }
    return limits.get(plan_id, 5)

def reset_monthly_usage():
    """
    Reset usage counters for all active subscriptions
    This should be run as a cron job on the 1st of each month
    """
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cur = conn.cursor()
        
        # Reset usage for active subscriptions where reset date has passed
        cur.execute("""
            UPDATE license_keys
            SET clarifications_used = 0,
                usage_resets_at = usage_resets_at + INTERVAL '1 month',
                updated_at = NOW()
            WHERE is_active = true
            AND subscription_status = 'active'
            AND usage_resets_at <= NOW()
        """)
        
        rows_updated = cur.rowcount
        conn.commit()
        
        print(f"✅ Reset usage for {rows_updated} subscriptions")
        
    except Exception as e:
        print(f"Error resetting usage: {e}")
    finally:
        conn.close()

def generate_license_key() -> str:
    """Generate a unique license key in format JIRA-XXXX-XXXX-XXXX"""
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    segments = 3
    segment_length = 4
    
    parts = []
    for _ in range(segments):
        segment = ''.join(secrets.choice(characters) for _ in range(segment_length))
        parts.append(segment)
    
    return f"JIRA-{'-'.join(parts)}"

def send_license_key_email(email: str, license_key: str, plan_name: str, clarifications_limit: int):
    """
    Send license key via email
    """
    print(f"""
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    📧 SEND EMAIL
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    To: {email}
    Subject: Your Go Bot {plan_name} License Key 🎉
    
    Hi there!
    
    Welcome to Go Bot {plan_name}!
    
    ╔══════════════════════════════════════╗
    ║  Your License Key:                   ║
    ║  {license_key}              ║
    ╚══════════════════════════════════════╝
    
    📊 Your Plan:
    • {plan_name} Subscription
    • {clarifications_limit} clarifications per month
    • Renews automatically
    • Cancel anytime
    
    🚀 How to Activate (3 easy steps):
    
    1. Install Go Bot in your Jira workspace
    2. Open any Jira ticket
    3. Enter your license key in the panel
    
    That's it! Start clarifying vague tickets into crystal-clear requirements.
    
    💡 Pro Tip: Your usage resets on the 1st of each month.
    
    Need help? Just reply to this email.
    
    Happy clarifying! ✨
    The Go Bot Team
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    """)

# ============================================================================
# AI Processing
# ============================================================================

async def get_similar_tickets(description: str, install: str) -> List[Dict]:
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
    similar_tickets = await get_similar_tickets(ticket.description, ticket.install or "unknown")
    
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
            (install, ticket_title, ticket_description, issue_type, priority, clarified_output, processing_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            ticket.install or 'unknown',
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
        "service": "Go Bot API",
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
    Clarify ticket and increment usage counter
    """
    license_key = ticket.install or "free_user"
    
    # For paid users, check and increment usage
    if license_key != "free_user":
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                
                # Increment usage counter
                cur.execute("""
                    UPDATE license_keys
                    SET clarifications_used = clarifications_used + 1,
                        updated_at = NOW()
                    WHERE key_code = %s
                    AND is_active = true
                    RETURNING clarifications_used, clarifications_limit
                """, (license_key,))
                
                result = cur.fetchone()
                conn.commit()
                
                if result:
                    print(f"📊 Usage: {result['clarifications_used']}/{result['clarifications_limit']} for {license_key}")
                
            except Exception as e:
                print(f"Error tracking usage: {e}")
            finally:
                conn.close()
    
    # Generate clarification (existing logic)
    try:
        output = await generate_clarification(ticket)
        
        # Store for analytics
        if ENABLE_ANALYTICS:
            store_ticket(ticket, output)
        
        return output
        
    except Exception as e:
        print(f"Clarification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to clarify ticket")


@app.post("/webhook/stripe")
async def stripe_webhook_handler(request: Request):
    """
    Handle Stripe webhook events for embedded payment flow
    """
    if not ENABLE_PAYMENTS or not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=404, detail="Payments not enabled")
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature header")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        print(f"❌ Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    print(f"🔔 Received event: {event['type']}")
    
    conn = get_db_connection()
    if not conn:
        return {"status": "error", "message": "Database unavailable"}
    
    try:
        cur = conn.cursor()
        
        # ============================================
        # charge.succeeded - First payment and renewals
        # ============================================
        if event['type'] == 'charge.succeeded':
            charge = event['data']['object']
            
            # Extract data from charge object (different structure than invoice!)
            subscription_id = charge.get('metadata', {}).get('subscription_id')
            customer_id = charge.get('customer')
            customer_email = charge.get('billing_details', {}).get('email') or charge.get('receipt_email')
            payment_intent_id = charge.get('payment_intent')
            
            print(f"💳 Charge succeeded:")
            print(f"   Customer: {customer_id}")
            print(f"   Email: {customer_email}")
            print(f"   Subscription: {subscription_id}")
            print(f"   Payment Intent: {payment_intent_id}")
            
            if not subscription_id:
                print("ℹ️  Not a subscription charge, skipping")
                return {"status": "success", "message": "Not a subscription charge"}
            
            # Get subscription details to find the plan and billing reason
            subscription = stripe.Subscription.retrieve(subscription_id)
            plan_id = subscription.metadata.get('planId', 'pro')
            
            # Get the invoice to check billing_reason
            invoice_id = charge.get('metadata', {}).get('invoice_id')
            if invoice_id:
                invoice = stripe.Invoice.retrieve(invoice_id)
                billing_reason = invoice.get('billing_reason')
            else:
                billing_reason = None
            
            print(f"   Plan: {plan_id}")
            print(f"   Billing reason: {billing_reason}")
            
            # Check if this is the first payment
            if billing_reason == 'subscription_create':
                # Generate license key for new subscription
                print(f"✅ New subscription payment successful!")
                
                # Check if key already exists (idempotency)
                cur.execute("""
                    SELECT key_code FROM license_keys 
                    WHERE stripe_subscription_id = %s
                """, (subscription_id,))
                
                existing = cur.fetchone()
                if existing:
                    print(f"ℹ️  Key already exists: {existing['key_code']}")
                    return {"status": "success", "keyCode": existing['key_code']}
                
                # Generate license key
                license_key = generate_license_key()
                clarifications_limit = get_plan_limits(plan_id)
                
                # Insert license key
                cur.execute("""
                    INSERT INTO license_keys 
                    (key_code, customer_email, plan, stripe_subscription_id, 
                     stripe_customer_id, stripe_payment_intent_id, clarifications_limit,
                     clarifications_used, usage_resets_at, subscription_status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 0, NOW() + INTERVAL '1 month', 'active')
                    RETURNING id
                """, (
                    license_key,
                    customer_email,
                    plan_id,
                    subscription_id,
                    customer_id,
                    payment_intent_id,
                    clarifications_limit
                ))
                
                conn.commit()
                print(f"🔑 License key generated: {license_key}")
                print(f"📊 Limit: {clarifications_limit} clarifications/month")
                
                # Send email
                send_license_key_email(customer_email, license_key, plan_id.capitalize(), clarifications_limit)
                print(f"📧 Email sent to {customer_email}")
                
                return {"status": "success", "keyCode": license_key}
            
            else:
                # Renewal payment - reset usage counter
                print(f"🔄 Renewal payment for subscription: {subscription_id}")
                cur.execute("""
                    UPDATE license_keys
                    SET clarifications_used = 0,
                        usage_resets_at = NOW() + INTERVAL '1 month',
                        updated_at = NOW()
                    WHERE stripe_subscription_id = %s
                    AND subscription_status = 'active'
                """, (subscription_id,))
                
                conn.commit()
                print(f"✅ Usage reset for subscription: {subscription_id}")
        
        # ============================================
        # invoice.payment_failed - Handle failed payments
        # ============================================
        elif event['type'] == 'invoice.payment_failed':
            invoice = event['data']['object']
            subscription_id = invoice.get('subscription')
            customer_email = invoice.get('customer_email')
            
            if subscription_id:
                # Mark subscription as having payment issues
                cur.execute("""
                    UPDATE license_keys
                    SET subscription_status = 'past_due',
                        updated_at = NOW()
                    WHERE stripe_subscription_id = %s
                """, (subscription_id,))
                
                conn.commit()
                print(f"⚠️  Payment failed for subscription: {subscription_id}")
                
                # TODO: Send payment failed email to customer
                # send_payment_failed_email(customer_email, subscription_id)
        
        # ============================================
        # customer.subscription.updated - Status changes
        # ============================================
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            subscription_id = subscription.get('id')
            status = subscription.get('status')
            
            # Update subscription status
            cur.execute("""
                UPDATE license_keys
                SET subscription_status = %s,
                    is_active = CASE 
                        WHEN %s IN ('active', 'trialing') THEN true 
                        ELSE false 
                    END,
                    updated_at = NOW()
                WHERE stripe_subscription_id = %s
            """, (status, status, subscription_id))
            
            conn.commit()
            print(f"📝 Subscription {subscription_id} status updated to: {status}")
        
        # ============================================
        # customer.subscription.deleted - Cancellation
        # ============================================
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            subscription_id = subscription.get('id')
            
            # Deactivate license key
            cur.execute("""
                UPDATE license_keys
                SET is_active = false,
                    subscription_status = 'canceled',
                    updated_at = NOW()
                WHERE stripe_subscription_id = %s
            """, (subscription_id,))
            
            conn.commit()
            print(f"🔒 Subscription canceled: {subscription_id}")
        
        # ============================================
        # customer.subscription.created - Log only
        # ============================================
        elif event['type'] == 'customer.subscription.created':
            subscription = event['data']['object']
            print(f"📝 Subscription created: {subscription.get('id')}")
            # Don't generate key here - wait for charge.succeeded
        
        # ============================================
        # payment_intent.succeeded - Log only
        # ============================================
        elif event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            print(f"✅ PaymentIntent succeeded: {payment_intent.get('id')}")
            # Don't generate key here - wait for charge.succeeded
        
        # ============================================
        # Informational events - Log only
        # ============================================
        elif event['type'] in [
            'customer.created',
            'customer.updated', 
            'invoice.created',
            'invoice.finalized',
            'payment_method.attached',
            'charge.updated',
            'payment_intent.created'
        ]:
            print(f"ℹ️  {event['type']} - no action needed")
        
        else:
            print(f"⚠️  Unhandled event type: {event['type']}")
        
        return {"status": "success"}
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Webhook error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()



@app.get("/license-key/payment-intent/{payment_intent_id}")
async def get_license_key_by_payment_intent(payment_intent_id: str):
    """
    Get license key by Stripe payment intent ID
    Used by success page after embedded checkout
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                key_code,
                customer_email,
                plan,
                clarifications_limit,
                created_at,
                usage_resets_at
            FROM license_keys
            WHERE stripe_payment_intent_id = %s
        """, (payment_intent_id,))
        
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(
                status_code=404, 
                detail="License key not found. It may still be processing."
            )
        
        return {
            "keyCode": result['key_code'],
            "email": result['customer_email'],
            "plan": result['plan'],
            "clarificationsLimit": result['clarifications_limit'],
            "createdAt": result['created_at'].isoformat() if result['created_at'] else None,
            "usageResetsAt": result['usage_resets_at'].isoformat() if result['usage_resets_at'] else None
        }
    except Exception as e:
        print("Error getting licence key.")
    finally:
        conn.close()
        

@app.get("/analytics/{install}")
async def get_analytics(install: str):
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
            WHERE install = %s
            AND created_at > NOW() - INTERVAL '30 days'
        """, (install,))
        stats = cur.fetchone()
        
        # Get ticket types breakdown
        cur.execute("""
            SELECT issue_type, COUNT(*) as count
            FROM tickets
            WHERE install = %s
            AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY issue_type
        """, (install,))
        types = cur.fetchall()
        
        return {
            "totalTickets": stats['total_tickets'] if stats else 0,
            "avgProcessingTime": float(stats['avg_processing_time']) if stats and stats['avg_processing_time'] else 0,
            "activeDays": stats['active_days'] if stats else 0,
            "ticketTypes": [dict(t) for t in types] if types else []
        }
        
    finally:
        conn.close()


@app.post("/feedback")
async def submit_feedback(feedback: FeedbackInput):
    """
    Submit feedback (upvote/downvote) for model fine-tuning
    
    This helps improve the AI model by collecting user feedback on clarifications.
    """
    if feedback.feedbackType not in ['upvote', 'downvote']:
        raise HTTPException(status_code=400, detail="Invalid feedback type. Must be 'upvote' or 'downvote'")
    
    try:
        store_feedback(feedback)
        return {
            "status": "success",
            "message": "Thank you for your feedback! This helps us improve."
        }
    except Exception as e:
        print(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail="Failed to store feedback")


@app.post("/validate-key", response_model=AccessKeyResponse)
async def validate_license_key(request: Request, key_input: AccessKeyInput):
    """
    Validate a license key and check usage limits
    """
    client_host = request.client.host
    print(f"Request received from host: {client_host}")

    key_code = key_input.accessKey.strip().upper()
    install = client_host
    
    conn = get_db_connection()
    if not conn:
        return AccessKeyResponse(
            valid=False,
            message="Service temporarily unavailable"
        )
    
    try:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                key_code,
                customer_email,
                plan,
                is_active,
                subscription_status,
                clarifications_limit,
                clarifications_used,
                usage_resets_at,
                activated_at
            FROM license_keys
            WHERE key_code = %s
        """, (key_code,))
        
        key_data = cur.fetchone()
        
        if not key_data:
            return AccessKeyResponse(
                valid=False,
                message="Invalid license key. Please check and try again."
            )
        
        # Check if active
        if not key_data['is_active']:
            return AccessKeyResponse(
                valid=False,
                message="This license key has been deactivated. Please contact support."
            )
        
        # Check subscription status
        if key_data['subscription_status'] not in ['active', 'trialing']:
            return AccessKeyResponse(
                valid=False,
                message=f"Subscription is {key_data['subscription_status']}. Please update your payment method."
            )
        
        # Check if usage limit exceeded
        if key_data['clarifications_used'] >= key_data['clarifications_limit']:
            resets_at = key_data['usage_resets_at'].strftime('%B %d') if key_data['usage_resets_at'] else 'soon'
            return AccessKeyResponse(
                valid=False,
                message=f"Monthly limit of {key_data['clarifications_limit']} clarifications reached. Resets on {resets_at}."
            )
        
        # Mark as activated if first use
        if not key_data['activated_at']:
            cur.execute("""
                UPDATE license_keys 
                SET activated_at = NOW(), updated_at = NOW(), install = %s
                WHERE key_code = %s
            """, (install, key_code,))
            conn.commit()
            print(f"🎉 License key activated: {key_code, install}")
        
        # Calculate remaining
        remaining = key_data['clarifications_limit'] - key_data['clarifications_used']
        
        return AccessKeyResponse(
            valid=True,
            install=install,
            plan=key_data['plan'],
            message="License key validated successfully!",
            clarificationsRemaining=remaining
        )
        
    except Exception as e:
        print(f"Error validating key: {e}")
        return AccessKeyResponse(
            valid=False,
            message="Error validating key. Please try again."
        )
    finally:
        conn.close()


@app.get("/license-key/session/{session_id}")
async def get_license_key_by_session(session_id: str):
    """
    Get license key by Stripe session ID
    Used by success page to display the key
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                key_code,
                customer_email,
                plan,
                amount_paid,
                created_at,
                expires_at
            FROM license_keys
            WHERE stripe_session_id = %s
        """, (session_id,))
        
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(
                status_code=404, 
                detail="License key not found. It may still be processing."
            )
        
        return {
            "keyCode": result['key_code'],
            "email": result['customer_email'],
            "plan": result['plan'],
            "amountPaid": float(result['amount_paid']) if result['amount_paid'] else 0,
            "createdAt": result['created_at'].isoformat() if result['created_at'] else None,
            "expiresAt": result['expires_at'].isoformat() if result['expires_at'] else None
        }
        
    finally:
        conn.close()


@app.get("/usage/{key_code}")
async def get_key_usage(key_code: str):
    """
    Get usage statistics for a license key
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                key_code,
                plan,
                customer_email,
                clarifications_limit,
                clarifications_used,
                usage_resets_at,
                subscription_status,
                is_active,
                activated_at
            FROM license_keys
            WHERE key_code = %s
        """, (key_code,))
        
        key = cur.fetchone()
        
        if not key:
            raise HTTPException(status_code=404, detail="License key not found")
        
        return {
            "keyCode": key_code,
            "plan": key['plan'],
            "email": key['customer_email'],
            "clarificationsUsed": key['clarifications_used'],
            "clarificationsLimit": key['clarifications_limit'],
            "clarificationsRemaining": max(0, key['clarifications_limit'] - key['clarifications_used']),
            "usageResets": key['usage_resets_at'].isoformat() if key['usage_resets_at'] else None,
            "subscriptionStatus": key['subscription_status'],
            "isActive": key['is_active'],
            "activatedAt": key['activated_at'].isoformat() if key['activated_at'] else None
        }
        
    finally:
        conn.close()


@app.get("/find-key-by-install")
async def get_key_by_install(install: InstallData):
    """
    Get license key by Stripe payment intent ID
    Used by success page to display key
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT key_code, plan, created_at, expires_at, is_active
            FROM license_keys
            WHERE install = %s
        """, (install.install,))
        
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="License key not found")
        
        return {
            "keyCode": result['key_code'],
            "plan": result['plan'],
            "createdAt": result['created_at'].isoformat() if result['created_at'] else None,
            "expiresAt": result['expires_at'].isoformat() if result['expires_at'] else None,
            "isActive": result['is_active']
        }
        
    finally:
        conn.close()


@app.get("/license-key/{payment_intent_id}")
async def get_license_key_by_payment(payment_intent_id: str):
    """
    Get license key by Stripe payment intent ID
    Used by success page to display key
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT key_code, plan, created_at, expires_at, is_active
            FROM license_keys
            WHERE stripe_payment_intent_id = %s
        """, (payment_intent_id,))
        
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="License key not found")
        
        return {
            "keyCode": result['key_code'],
            "plan": result['plan'],
            "createdAt": result['created_at'].isoformat() if result['created_at'] else None,
            "expiresAt": result['expires_at'].isoformat() if result['expires_at'] else None,
            "isActive": result['is_active']
        }
        
    finally:
        conn.close()
 
@app.get("/feedback/stats")
async def get_feedback_stats():
    """Get feedback statistics for monitoring model performance"""
    if not DATABASE_URL:
        raise HTTPException(status_code=404, detail="Database not configured")
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                feedback_type,
                COUNT(*) as count,
                COUNT(DISTINCT install) as unique_orgs
            FROM feedback
            WHERE created_at > NOW() - INTERVAL '30 days'
            GROUP BY feedback_type
        """)
        
        stats = cur.fetchall()
        
        return {
            "period": "Last 30 days",
            "feedback": [dict(s) for s in stats]
        }
        
    finally:
        conn.close()

@app.post("/create-payment-intent")
async def create_payment_intent(input: CreatePaymentIntentInput):
    """
    Create a Stripe subscription with PaymentIntent for embedded checkout
    
    This replaces the Next.js API route - keeps all Stripe logic centralized
    """
    if not ENABLE_PAYMENTS or not stripe.api_key:
        raise HTTPException(status_code=503, detail="Payments not available")
    
    try:
        plan_id = input.planId.lower()
        
        # Get price ID from environment
        price_ids = {
            'pro': os.getenv('STRIPE_PRO_PRICE_ID'),
            'team': os.getenv('STRIPE_TEAM_PRICE_ID')
        }
        
        price_id = price_ids.get(plan_id)
        if not price_id:
            raise HTTPException(status_code=400, detail=f"Invalid plan: {plan_id}")
        
        print(f"📝 Creating subscription for plan: {plan_id}")
        print(f"💰 Using price ID: {price_id}")
        
        # Create a customer
        customer = stripe.Customer.create(
            metadata={
                'planId': plan_id,
            }
        )
        
        print(f"✅ Created Stripe customer: {customer.id}")
        
        # Create a subscription with payment
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[
                {
                    'price': price_id,
                }
            ],
            payment_behavior='default_incomplete',
            payment_settings={
                'payment_method_types': ['card'],
                'save_default_payment_method': 'on_subscription',
            },
            expand=['latest_invoice.payment_intent'],
            metadata={
                'planId': plan_id,
            }
        )
        
        print(f"✅ Created subscription: {subscription.id}")
        
        # Access the invoice
        latest_invoice = subscription.latest_invoice
        
        # If it's a string ID, retrieve the full invoice object
        if isinstance(latest_invoice, str):
            invoice = stripe.Invoice.retrieve(
                latest_invoice,
                expand=['payment_intent']
            )
        else:
            invoice = latest_invoice
        
        print(f"📄 Invoice ID: {invoice.id}")
        print(f"📊 Invoice status: {invoice.status}")
        
        # Check if payment_intent exists on the invoice
        payment_intent = getattr(invoice, 'payment_intent', None)
        
        if not payment_intent:
            print("⚠️ No payment_intent on invoice, creating one manually...")
            
            # Create a PaymentIntent manually
            payment_intent = stripe.PaymentIntent.create(
                amount=invoice.amount_due,
                currency=invoice.currency or 'usd',
                customer=customer.id,
                metadata={
                    'subscription_id': subscription.id,
                    'invoice_id': invoice.id,
                    'planId': plan_id,
                },
                setup_future_usage='off_session',
            )
            
            print(f"✅ Manually created PaymentIntent: {payment_intent.id}")
            
        else:
            # If payment_intent is a string ID, retrieve the full object
            if isinstance(payment_intent, str):
                payment_intent = stripe.PaymentIntent.retrieve(payment_intent)
            
            print(f"✅ Retrieved PaymentIntent from invoice: {payment_intent.id}")
        
        print(f"💳 Client secret ready for frontend")
        
        return {
            "clientSecret": payment_intent.client_secret,
            "subscriptionId": subscription.id,
            "customerId": customer.id,
            "invoiceId": invoice.id
        }
        
    except Exception as e:
        print(f"❌ Error creating payment intent: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create payment intent: {str(e)}")
    

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
    