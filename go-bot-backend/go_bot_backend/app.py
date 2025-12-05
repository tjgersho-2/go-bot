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
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import anthropic
from pinecone import Pinecone
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import requests
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
DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY")
MAILGUN_DOMAIN = os.getenv("MAILGUN_DOMAIN")
MAILGUN_FROM_EMAIL = os.getenv("MAILGUN_FROM_EMAIL", "GoBot <gobot@gobot.ai>")
 
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

app.mount("/files", StaticFiles(directory="static"), "static")

# ============================================================================
# Models
# ============================================================================

class CodeGenInput(BaseModel):
    """Input for code generation endpoint"""
    # Clarified ticket description from Step 1 (already applied to Jira)
    jiraDescription: str = Field(..., description="Full clarified ticket description from Jira")

    # Custom prompt for guidance
    customPrompt: str = Field(default="", description="Custom prompt for code generation (e.g., 'Use Python', 'Include TypeScript types')")
    
    # Auth
    install: Optional[str] = Field(default=None, description="Organization ID for auth")
    accessKey: Optional[str] = Field(default=None, description="License Key")

class CodeGenOutput(BaseModel):
    """Output from code generation"""
    implementation: str = Field(..., description="Full implementation as markdown-formatted text")
    summary: str = Field(default="", description="Brief summary of what was built")
    processingTime: Optional[float] = Field(default=None, description="Processing time in seconds")


class TicketInput(BaseModel):
    title: str = Field(..., description="Jira ticket title")
    description: str = Field(default="", description="Jira ticket description")
    customPrompt: str = Field(default="", description="Custom Prompt for the ticket clarification step.")
    issueType: Optional[str] = Field(default="Task", description="Issue type (Bug, Task, Story)")
    priority: Optional[str] = Field(default="Medium", description="Priority level")
    install: Optional[str] = Field(default=None, description="Organization ID for auth")
    accessKey: Optional[str] = Field(default=None, description="Licence Key")

class ClarifiedOutput(BaseModel):
    acceptanceCriteria: List[str] = Field(default_factory=list)
    edgeCases: List[str] = Field(default_factory=list)
    successMetrics: List[str] = Field(default_factory=list)
    testScenarios: List[str] = Field(default_factory=list)
    confidence: Optional[float] = Field(default=None, description="AI confidence score")
    processingTime: Optional[float] = Field(default=None, description="Processing time in seconds")

class CreateFreeKeyInput(BaseModel):
    email: str = Field(..., description="Customer email address")
 
class AccessKeyInput(BaseModel):
    accessKey: str = Field(..., description="License key to validate")
    install: str = Field(..., description="Install ID")

class AccessKeyResponse(BaseModel):
    valid: bool
    install: Optional[str] = None
    plan: Optional[str] = None
    message: Optional[str] = None
    gobotsRemaining: Optional[int] = None
 
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
 
        """Add these table creations to your init_database() function"""
        
        # Update license_keys table for subscriptions
        cur.execute("""
            CREATE TABLE IF NOT EXISTS license_keys (
                id SERIAL PRIMARY KEY,
                key_code VARCHAR(255) UNIQUE NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                plan VARCHAR(50) NOT NULL,
                install VARCHAR(255),
                
                -- Subscription fields
                stripe_subscription_id VARCHAR(255),
                stripe_customer_id VARCHAR(255),
                stripe_session_id VARCHAR(255),
                stripe_payment_intent_id VARCHAR(255),
                    
                -- Usage tracking
                gobot_limit INTEGER NOT NULL,
                gobot_used INTEGER DEFAULT 0,
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
        
        # Create indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_key_code ON license_keys(key_code)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_email ON license_keys(customer_email)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_subscription ON license_keys(stripe_subscription_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_customer ON license_keys(stripe_customer_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_license_session ON license_keys(stripe_session_id)")
        
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
 

def get_plan_limits(plan_id: str) -> int:
    """Get clarification limit based on plan"""
    limits = {
        'free': 5,
        'pro': 50,
        'team': 200
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
            SET gobot_used = 0,
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
    """Generate a unique license key in format GOBOT-XXXX-XXXX-XXXX"""
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    segments = 3
    segment_length = 4
    
    parts = []
    for _ in range(segments):
        segment = ''.join(secrets.choice(characters) for _ in range(segment_length))
        parts.append(segment)
    
    return f"GOBOT-{'-'.join(parts)}"

def send_license_key_email(email: str, license_key: str, plan_name: str, gobot_limit: int) -> bool:
    """
    Send license key via Mailgun email
    Returns True if sent successfully, False otherwise
    """
    
    # Check if Mailgun is configured
    if not MAILGUN_API_KEY or not MAILGUN_DOMAIN:
        print("⚠️ Mailgun not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN env vars.")
        _print_email_fallback(email, license_key, plan_name, gobot_limit)
        return False
    
    subject = f"Your GoBot {plan_name} License Key 🎉"
    
    # Plain text version
    text_body = f"""
Hi there!

Welcome to GoBot {plan_name}!

Your License Key: {license_key}

📊 Your Plan:
- {plan_name} Subscription
- {gobot_limit} clarifications per month
- Renews automatically
- Cancel anytime

🚀 How to Activate (3 easy steps):

1. Install GoBot in your Jira workspace <a href="https://developer.atlassian.com/console/install/9eb6c48c-0089-4802-ac61-aea3a449560f?signature=AYABeOg40uqC6UYcofhxrvJNm6cAAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4IOp8r3eKNYw8z2v%2FEq3%2FfvrZguoGsXpNSaDveR%2FF%2Fo0BXCohExkzjSPPgCVMh8HihQAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDO%2FIPQWIR2%2B85US6ZQIBEIA7ms9qr1AuOnDjx8Gzap%2Bk0W%2FNLmhUY4LNp5StGaWhBehhJM8gavG4qOEN5yrzPZVxOJUKtDRWcDN5hzsAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHijmwVTMt6Oj3F%2B0%2B0cVrojrS8yZ9ktpdfDxqPMSIkvHAHrFvY6ClvsefAtxT3TBNSPAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMAHBw7KzxgkjJxPYgAgEQgDve8Fmp5ylYZP1hOw%2BctC%2FWexQWPkV2kMrLonShs1ChxFkI46t%2BYv5rIG%2F%2FYNbchvvZ8Hylb37%2FHUeIuQAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeLKa7Dfn9BgbXaQmJGrkKztjV4vrreTkqr7wGwhqIYs5AaPkP%2F15wcKa1vZhbNXytakAAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAxfvwddkOH7ANVUhnECARCAOyFZyw37viPuJfWxorHvbPFOJHrx4iUs7ESsvAb%2BaMicAdsVGMZboWfcOsQjCNNNyM8sz1%2BxfURrAabtAgAAAAAMAAAQAAAAAAAAAAAAAAAAAMmcsmZL1qX0rjA%2BHbmOll3%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADKhfFiJAHjrOsP6IXKzypA8upYMwSZ4Ii85HM3oi77j%2FK7I59VhL82THhTSmlDwvUDDl3aSvoVEgXKXCOgBOxPbUgA%3D&product=jira">GoBot</a>
2. Open any Jira ticket
3. Enter your license key in the GoBot panel

That's it! Start clarifying vague tickets into crystal-clear requirements.

💡 Pro Tip: Your usage resets on the 1st of each month.

Need help? Just reply to this email.

Happy clarifying! ✨
The GoBot Team
"""

    # HTML version
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10b981; margin: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8V4H8"></path>
                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                <path d="M2 14h2"></path>
                <path d="M20 14h2"></path>
                <path d="M15 13v2"></path>
                <path d="M9 13v2"></path>
          </svg> GoBot</h1>
    </div>
    
    <h2 style="color: #1e293b;">Welcome to GoBot {plan_name}!</h2>
    
    <p>Hi there!</p>
    
    <p>Thank you for subscribing! Here's your license key:</p>
    
    <div style="background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="color: rgba(255,255,255,0.9); margin: 0 0 8px 0; font-size: 14px;">Your License Key</p>
        <code style="background: rgba(0,0,0,0.2); color: white; font-size: 20px; font-weight: bold; padding: 12px 20px; border-radius: 8px; display: inline-block; letter-spacing: 1px;">
            {license_key}
        </code>
    </div>
    
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; color: #1e293b;">📊 Your Plan</h3>
        <ul style="margin: 0; padding-left: 20px; color: #64748b;">
            <li><strong>{plan_name}</strong> Subscription</li>
            <li><strong>{gobot_limit}</strong> clarifications per month</li>
            <li>Renews automatically</li>
            <li>Cancel anytime</li>
        </ul>
    </div>
    
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; color: #1e293b;">🚀 How to Activate</h3>
        <ol style="margin: 0; padding-left: 20px; color: #64748b;">
            <li>Install GoBot in your Jira workspace</li> <a href="https://developer.atlassian.com/console/install/9eb6c48c-0089-4802-ac61-aea3a449560f?signature=AYABeOg40uqC6UYcofhxrvJNm6cAAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4IOp8r3eKNYw8z2v%2FEq3%2FfvrZguoGsXpNSaDveR%2FF%2Fo0BXCohExkzjSPPgCVMh8HihQAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDO%2FIPQWIR2%2B85US6ZQIBEIA7ms9qr1AuOnDjx8Gzap%2Bk0W%2FNLmhUY4LNp5StGaWhBehhJM8gavG4qOEN5yrzPZVxOJUKtDRWcDN5hzsAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHijmwVTMt6Oj3F%2B0%2B0cVrojrS8yZ9ktpdfDxqPMSIkvHAHrFvY6ClvsefAtxT3TBNSPAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMAHBw7KzxgkjJxPYgAgEQgDve8Fmp5ylYZP1hOw%2BctC%2FWexQWPkV2kMrLonShs1ChxFkI46t%2BYv5rIG%2F%2FYNbchvvZ8Hylb37%2FHUeIuQAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeLKa7Dfn9BgbXaQmJGrkKztjV4vrreTkqr7wGwhqIYs5AaPkP%2F15wcKa1vZhbNXytakAAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAxfvwddkOH7ANVUhnECARCAOyFZyw37viPuJfWxorHvbPFOJHrx4iUs7ESsvAb%2BaMicAdsVGMZboWfcOsQjCNNNyM8sz1%2BxfURrAabtAgAAAAAMAAAQAAAAAAAAAAAAAAAAAMmcsmZL1qX0rjA%2BHbmOll3%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADKhfFiJAHjrOsP6IXKzypA8upYMwSZ4Ii85HM3oi77j%2FK7I59VhL82THhTSmlDwvUDDl3aSvoVEgXKXCOgBOxPbUgA%3D&product=jira">GoBot</a>
   
            <li>Open any Jira ticket</li>
            <li>Enter your license key in the GoBot panel</li>
        </ol>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
        <p style="margin: 0; color: #92400e;">
            💡 <strong>Pro Tip:</strong> Your usage resets on the 1st of each month.
        </p>
    </div>
    
    <p>Need help? Just reply to this email.</p>
    
    <p>Happy clarifying! ✨<br>
    <strong>The GoBot Team</strong></p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        © 2025 GoBot. All rights reserved.<br>
        <a href="https://gobot.dev" style="color: #10b981;">gobot.dev</a>
    </p>
    
</body>
</html>
"""

    try:
        response = requests.post(
            f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
            auth=("api", MAILGUN_API_KEY),
            data={
                "from": MAILGUN_FROM_EMAIL,
                "to": email,
                "subject": subject,
                "text": text_body,
                "html": html_body
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ License key email sent to {email}")
            return True
        else:
            print(f"❌ Mailgun error: {response.status_code} - {response.text}")
            _print_email_fallback(email, license_key, plan_name, gobot_limit)
            return False
            
    except requests.RequestException as e:
        print(f"❌ Failed to send email: {e}")
        _print_email_fallback(email, license_key, plan_name, gobot_limit)
        return False


def _print_email_fallback(email: str, license_key: str, plan_name: str, gobot_limit: int):
    """Fallback: print email to console when Mailgun is not available"""
    print(f"""
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    📧 EMAIL (FALLBACK - NOT SENT)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    To: {email}
    Subject: Your GoBot {plan_name} License Key 🎉
    
    License Key: {license_key}
    Plan: {plan_name}
    Limit: {gobot_limit} clarifications/month
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    """)

# ============================================================================
# AI Processing
# ============================================================================

async def generate_code(input: CodeGenInput) -> CodeGenOutput:
    """Generate MVP code implementation using Claude AI with continuation support"""
    start_time = datetime.now()
    
    if not app.state.claude:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    prompt = f"""You are a senior software engineer. Generate a clean, well-documented MVP implementation based on this Jira ticket.

## Jira Ticket

{input.jiraDescription}

{f"## Extra important context to take into account{chr(10)}{input.customPrompt}" if input.customPrompt else ""}

## Your Task

Generate a complete, working implementation that satisfies the requirements.

## Response Format

Structure your response EXACTLY like this (use markdown formatting):

## 📋 Summary

[2-3 sentences describing what you built and the approach taken]

## 🛠️ Tech Stack

- [Technology 1]
- [Technology 2]

## 💻 Implementation

### [filename.ext]

[Brief description of this file]
```[language]
[Complete, well-commented code here]
```

[Repeat for each file needed]

## 🚀 Setup & Run

1. [Step 1]
2. [Step 2]

## 📌 Next Steps

- [Suggested improvement 1]
- [Suggested improvement 2]

## Guidelines

- Write complete, runnable code (not pseudocode)
- Include extensive comments explaining the logic
- Handle edge cases mentioned in the ticket
- Use clear variable/function names

Generate the implementation now:"""

    try:
        # Initial request
        messages = [{"role": "user", "content": prompt}]
        full_response = ""
        max_continuations = 5  # Safety limit to prevent infinite loops
        continuation_count = 0
        
        while continuation_count < max_continuations:
            message = app.state.claude.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                messages=messages
            )
            
            # Get the response text
            response_text = message.content[0].text
            full_response += response_text
            
            print(f"📝 Response chunk {continuation_count + 1}: {len(response_text)} chars, stop_reason: {message.stop_reason}")
            
            # Check if Claude finished naturally
            if message.stop_reason == "end_turn":
                print("✅ Claude finished naturally")
                break
            
            # If stopped due to max_tokens, continue the conversation
            if message.stop_reason == "max_tokens":
                print("⏳ Response truncated, requesting continuation...")
                continuation_count += 1
                
                # Add assistant's partial response and ask to continue
                messages.append({"role": "assistant", "content": response_text})
                messages.append({"role": "user", "content": "Please continue exactly where you left off. Do not repeat any content, just continue from the exact point you stopped."})
            else:
                # Unknown stop reason, break to be safe
                print(f"⚠️ Unknown stop_reason: {message.stop_reason}")
                break
        
        if continuation_count >= max_continuations:
            print(f"⚠️ Reached max continuations ({max_continuations})")
        
        implementation = full_response.strip()
        
        # Extract summary
        summary = "Implementation generated successfully."
        if "## 📋 Summary" in implementation:
            try:
                summary_section = implementation.split("## 📋 Summary")[1]
                summary_end = summary_section.find("##")
                if summary_end > 0:
                    summary = summary_section[:summary_end].strip()
                else:
                    summary = summary_section.strip()
                summary = summary.split("\n\n")[0].strip()
            except:
                pass
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return CodeGenOutput(
            implementation=implementation,
            summary=summary,
            processingTime=processing_time
        )
        
    except Exception as e:
        print(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")


async def generate_clarification(ticket: TicketInput) -> ClarifiedOutput:
    """Generate clarification using Claude AI with continuation support"""
    start_time = datetime.now()
    
    if not app.state.claude:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    prompt = f"""You are a senior software engineer helping to clarify Jira tickets. Given the following ticket information, provide clear, actionable acceptance criteria and additional details.

Ticket Title: {ticket.title}
Description: {ticket.description or 'No description provided'}
Issue Type: {ticket.issueType}
Priority: {ticket.priority}

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

Focus on being practical and actionable. Provide at least 3-5 items for each category.

{f"For more important context please take this into account: {ticket.customPrompt}" if ticket.customPrompt else ""}
"""

    try:
        messages = [{"role": "user", "content": prompt}]
        full_response = ""
        max_continuations = 3
        continuation_count = 0
        
        while continuation_count < max_continuations:
            message = app.state.claude.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=messages
            )
            
            response_text = message.content[0].text
            full_response += response_text
            
            print(f"📝 Clarify chunk {continuation_count + 1}: {len(response_text)} chars, stop_reason: {message.stop_reason}")
            
            if message.stop_reason == "end_turn":
                print("✅ Claude finished naturally")
                break
            
            if message.stop_reason == "max_tokens":
                print("⏳ Response truncated, requesting continuation...")
                continuation_count += 1
                messages.append({"role": "assistant", "content": response_text})
                messages.append({"role": "user", "content": "Continue the JSON exactly where you left off. Do not restart or repeat content."})
            else:
                break
        
        content = full_response.strip()
        
        # Handle potential markdown code blocks
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0].strip()
        elif '```' in content:
            content = content.split('```')[1].split('```')[0].strip()
        
        parsed = json.loads(content)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
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
        }
    }
    return health

@app.post("/clarify", response_model=ClarifiedOutput)
async def clarify_ticket(ticket: TicketInput):
    """
    Clarify ticket and increment usage counter
    """
    license_key = ticket.accessKey or "free_user"
    
    # For paid users, check and increment usage
    if license_key != "free_user":
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                
                # Increment usage counter
                cur.execute("""
                    UPDATE license_keys
                    SET gobot_used = gobot_used + 1,
                        updated_at = NOW()
                    WHERE key_code = %s
                    AND is_active = true
                    RETURNING gobot_used, gobot_limit
                """, (license_key,))
                
                result = cur.fetchone()
                conn.commit()
                
                if result:
                    print(f"📊 Usage: {result['gobot_used']}/{result['gobot_limit']} for {license_key}")
                
            except Exception as e:
                print(f"Error tracking usage: {e}")
            finally:
                conn.close()
    
    # Generate clarification (existing logic)
    try:
        output = await generate_clarification(ticket)        
        return output
        
    except Exception as e:
        print(f"Clarification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to clarify ticket")


@app.post("/gen-code", response_model=CodeGenOutput)
async def generate_code_endpoint(input: CodeGenInput):
    """
    Generate MVP code implementation from clarified Jira ticket.
    
    This is Step 2 of the GoBot workflow:
    1. First, use /clarify to get acceptance criteria, edge cases, etc.
    2. Apply the clarified output to the Jira ticket description
    3. Then, use /gen-code with the full description to generate code
    
    The generated code includes:
    - Well-commented source files
    - Setup instructions
    - Suggested next steps
    """
    license_key = input.accessKey or "free_user"
    print("LICENCE KEY: ")
    print(license_key)

    # For paid users, check and increment usage
    if license_key != "free_user":
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                
                # Check usage limit before generating
                cur.execute("""
                    SELECT gobot_used, gobot_limit, plan
                    FROM license_keys
                    WHERE key_code = %s
                    AND is_active = true
                """, (license_key,))
                
                result = cur.fetchone()
                
                if result:
                    if result['gobot_used'] >= result['gobot_limit']:
                        raise HTTPException(
                            status_code=429,
                            detail=f"Monthly limit of {result['gobot_limit']} reached. Please upgrade or wait for reset."
                        )
                    
                    # Increment usage counter
                    cur.execute("""
                        UPDATE license_keys
                        SET gobot_used = gobot_used + 1,
                            updated_at = NOW()
                        WHERE key_code = %s
                        AND is_active = true
                        RETURNING gobot_used, gobot_limit
                    """, (license_key,))
                    
                    updated = cur.fetchone()
                    conn.commit()
                    
                    if updated:
                        print(f"📊 Code Gen Usage: {updated['gobot_used']}/{updated['gobot_limit']} for {license_key}")
                
            except HTTPException:
                raise
            except Exception as e:
                print(f"Error tracking usage: {e}")
            finally:
                conn.close()
    
    # Generate code
    try:
        output = await generate_code(input)
        return output
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Code generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate code")



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
                gobot_limit = get_plan_limits(plan_id)
                
                # Insert license key
                cur.execute("""
                    INSERT INTO license_keys 
                    (key_code, customer_email, plan, stripe_subscription_id, 
                     stripe_customer_id, stripe_payment_intent_id, gobot_limit,
                     gobot_used, usage_resets_at, subscription_status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 0, NOW() + INTERVAL '1 month', 'active')
                    RETURNING id
                """, (
                    license_key,
                    customer_email,
                    plan_id,
                    subscription_id,
                    customer_id,
                    payment_intent_id,
                    gobot_limit
                ))
                
                conn.commit()
                print(f"🔑 License key generated: {license_key}")
                print(f"📊 Limit: {gobot_limit} clarifications/month")
                
                # Send email
                send_license_key_email(customer_email, license_key, plan_id.capitalize(), gobot_limit)
                print(f"📧 Email sent to {customer_email}")
                
                return {"status": "success", "keyCode": license_key}
            
            else:
                # Renewal payment - reset usage counter
                print(f"🔄 Renewal payment for subscription: {subscription_id}")
                cur.execute("""
                    UPDATE license_keys
                    SET gobot_used = 0,
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


@app.post("/create-free-key")
async def create_free_key(input: CreateFreeKeyInput):
    """
    Create a free license key for a new user
    """
    email = input.email.strip().lower()
    
    if not email or '@' not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        cur = conn.cursor()
        
        # Check if email already has a free key
        cur.execute("""
            SELECT key_code, is_active, plan
            FROM license_keys
            WHERE customer_email = %s AND plan = 'free'
        """, (email,))
        
        existing = cur.fetchone()
        
        if existing:
            if existing['is_active']:
                # Return existing key
                return {
                    "keyCode": existing['key_code'],
                    "email": email,
                    "plan": "free",
                    "isExisting": True,
                    "message": "You already have a free license key. Check your email or use the key below."
                }
            else:
                # Reactivate existing key
                cur.execute("""
                    UPDATE license_keys
                    SET is_active = true,
                        gobot_used = 0,
                        usage_resets_at = NOW() + INTERVAL '1 month',
                        updated_at = NOW()
                    WHERE key_code = %s
                    RETURNING key_code
                """, (existing['key_code'],))
                conn.commit()
                
                # Send email with existing key
                send_license_key_email(email, existing['key_code'], "Free", 5)
                
                return {
                    "keyCode": existing['key_code'],
                    "email": email,
                    "plan": "free",
                    "isExisting": True,
                    "message": "Your free license key has been reactivated."
                }
        
        # Generate new license key
        license_key = generate_license_key()
        gobot_limit = get_plan_limits('free')
        
        # Insert new license key
        cur.execute("""
            INSERT INTO license_keys 
            (key_code, customer_email, plan, gobot_limit, gobot_used, 
             usage_resets_at, subscription_status, is_active)
            VALUES (%s, %s, 'free', %s, 0, NOW() + INTERVAL '1 month', 'active', true)
            RETURNING id
        """, (license_key, email, gobot_limit))
        
        conn.commit()
        
        print(f"🆓 Free license key created: {license_key} for {email}")
        
        # Send email
        send_license_key_email(email, license_key, "Free", gobot_limit)
        
        return {
            "keyCode": license_key,
            "email": email,
            "plan": "free",
            "gobotLimit": gobot_limit,
            "isExisting": False,
            "message": "Your free license key has been created!"
        }
        
    except Exception as e:
        conn.rollback()
        print(f"Error creating free key: {e}")
        raise HTTPException(status_code=500, detail="Failed to create license key")
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
                gobot_limit,
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
            "gobotLimit": result['gobot_limit'],
            "createdAt": result['created_at'].isoformat() if result['created_at'] else None,
            "usageResetsAt": result['usage_resets_at'].isoformat() if result['usage_resets_at'] else None
        }
    except Exception as e:
        print("Error getting licence key.")
    finally:
        conn.close()
  
 
@app.post("/validate-key", response_model=AccessKeyResponse)
async def validate_license_key(request: Request, key_input: AccessKeyInput):
    """
    Validate a license key and check usage limits
    """
    key_code = key_input.accessKey.strip().upper()
    install = key_input.install
    
    conn = get_db_connection()
    if not conn:
        return AccessKeyResponse(
            valid=False,
            message="Service temporarily unavailable"
        )
    
    try:
        cur = conn.cursor()
        
        # Get the key being validated
        cur.execute("""
            SELECT 
                key_code,
                customer_email,
                plan,
                is_active,
                subscription_status,
                gobot_limit,
                gobot_used,
                usage_resets_at,
                activated_at,
                install
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
        
        # Check if this key is already activated on a different install
        if key_data['activated_at'] and key_data['install'] and key_data['install'] != install:
            return AccessKeyResponse(
                valid=False,
                message="This license key is already activated on another workspace."
            )
        
        # Check if usage limit exceeded
        if key_data['gobot_used'] >= key_data['gobot_limit']:
            resets_at = key_data['usage_resets_at'].strftime('%B %d') if key_data['usage_resets_at'] else 'soon'
            return AccessKeyResponse(
                valid=False,
                message=f"Monthly limit of {key_data['gobot_limit']} reached. Resets on {resets_at}."
            )
        
        # Deactivate any OLD keys for this install (user is switching to new key)
        cur.execute("""
            UPDATE license_keys
            SET is_active = false,
                updated_at = NOW(),
                activated_at = NULL
            WHERE install = %s 
            AND key_code != %s
            AND activated_at IS NOT NULL
        """, (install, key_code))
        
        deactivated_count = cur.rowcount
        if deactivated_count > 0:
            print(f"🔒 Deactivated {deactivated_count} old key(s) for install {install}")
        
        # Mark as activated if first use
        if not key_data['activated_at']:
            cur.execute("""
                UPDATE license_keys 
                SET activated_at = NOW(), 
                    updated_at = NOW(), 
                    install = %s
                WHERE key_code = %s
            """, (install, key_code))
            print(f"🎉 License key activated: {key_code} for {install}")
        
        conn.commit()
        
        # Calculate remaining
        remaining = key_data['gobot_limit'] - key_data['gobot_used']
        
        return AccessKeyResponse(
            valid=True,
            install=install,
            plan=key_data['plan'],
            message="License key validated successfully!",
            clarificationsRemaining=remaining
        )
        
    except Exception as e:
        print(f"Error validating key: {e}")
        conn.rollback()
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
                gobot_limit,
                gobot_used,
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
            "gotbotsUsed": key['gobot_used'],
            "gobotLimit": key['gobot_limit'],
            "gobotsRemaining": max(0, key['gobot_limit'] - key['gobot_used']),
            "usageResetsAt": key['usage_resets_at'].isoformat() if key['usage_resets_at'] else None,
            "subscriptionStatus": key['subscription_status'],
            "isActive": key['is_active'],
            "activatedAt": key['activated_at'].isoformat() if key['activated_at'] else None
        }
        
    finally:
        conn.close()


@app.post("/find-key-by-install")
async def get_key_by_install(install: InstallData):
    """
    Get active license key by install ID
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
                created_at, 
                expires_at, 
                is_active, 
                gobot_limit, 
                gobot_used, 
                usage_resets_at
            FROM license_keys
            WHERE install = %s 
            AND is_active = true
            ORDER BY created_at DESC
            LIMIT 1
        """, (install.install,))
        
        result = cur.fetchone()
        
        if not result:
            return {
                "isActive": False,
                "message": "No active license key found for this install."
            }
        
        return {
            "keyCode": result['key_code'],
            "plan": result['plan'],
            "createdAt": result['created_at'].isoformat() if result['created_at'] else None,
            "expiresAt": result['expires_at'].isoformat() if result['expires_at'] else None,
            "isActive": result['is_active'],
            "gobotLimit": result['gobot_limit'],
            "gobotUsed": result['gobot_used'],
            "usageResetsAt": result['usage_resets_at'].isoformat() if result['usage_resets_at'] else None
        }
        
    except Exception as e:
        print(f"Error finding key by install: {e}")
        raise HTTPException(status_code=500, detail="Failed to find license key")
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

 