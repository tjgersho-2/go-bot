# Railway Deployment Guide

Complete guide to deploy your FastAPI backend to Railway in 5 minutes.

## 🚂 What is Railway?

Railway is a modern platform for deploying apps with zero configuration. It automatically:
- Detects your Python app
- Installs dependencies
- Provides PostgreSQL and Redis (optional)
- Gives you a public URL
- Auto-deploys on git push

## 📋 Prerequisites

- [ ] Railway account (free tier available)
- [ ] Anthropic API key
- [ ] Code pushed to GitHub (optional but recommended)

## 🚀 Deployment Options

### Option 1: Deploy from GitHub (Recommended)

#### Step 1: Push to GitHub

```bash
cd fastapi-backend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/go-bot-backend.git
git push -u origin main
```

#### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository
6. Railway will auto-detect Python and start deploying!

#### Step 3: Add Environment Variables

1. In Railway dashboard, click your service
2. Go to **"Variables"** tab
3. Click **"Add Variable"**
4. Add:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

5. Click **"Add"** - Railway will auto-redeploy

#### Step 4: Get Your URL

1. Go to **"Settings"** tab
2. Under **"Domains"**, click **"Generate Domain"**
3. Copy your URL (e.g., `https://go-bot.up.railway.app`)

#### Step 5: Test Your API

```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{"status": "healthy", ...}
```

---

### Option 2: Deploy from CLI

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Login

```bash
railway login
```

Browser will open - login with GitHub

#### Step 3: Initialize Project

```bash
cd fastapi-backend
railway init
```

Choose:
- **"Create a new project"**
- Give it a name: `go-bot`

#### Step 4: Add Environment Variable

```bash
railway variables set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

#### Step 5: Deploy

```bash
railway up
```

Railway will:
1. Upload your code
2. Install dependencies from `requirements.txt`
3. Start your app using `Procfile`
4. Give you a public URL

#### Step 6: Open Your App

```bash
railway open
```

---

## 🗄️ Add PostgreSQL (Optional)

For rate limiting and analytics:

### Via Dashboard:

1. In Railway project dashboard
2. Click **"New"** → **"Database"** → **"PostgreSQL"**
3. Railway auto-creates and links it
4. `DATABASE_URL` is automatically added to your variables
5. Your app auto-restarts and creates tables

### Via CLI:

```bash
railway add postgresql
```

Done! Your app now has a database.

---

## 💾 Add Redis (Optional)

For rate limiting:

### Via Dashboard:

1. Click **"New"** → **"Database"** → **"Redis"**
2. Railway auto-links it
3. `REDIS_URL` is automatically set

### Via CLI:

```bash
railway add redis
```

---

## ⚙️ Configuration

### Enable Features

Go to **Variables** tab and add:

```bash
# Enable rate limiting
ENABLE_RATE_LIMITING=true

# Enable analytics (requires PostgreSQL)
ENABLE_ANALYTICS=true

# Enable RAG (requires Pinecone)
ENABLE_RAG=true
PINECONE_API_KEY=your-key-here

# Enable payments (requires Stripe)
ENABLE_PAYMENTS=true
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Railway auto-redeploys when you add variables.

---

## 📊 Monitoring

### View Logs

**Dashboard**: Click service → **"Logs"** tab

**CLI**:
```bash
railway logs
```

### View Metrics

Dashboard shows:
- CPU usage
- Memory usage
- Network traffic
- Request count

### Set Up Alerts

1. Go to project settings
2. Add notification channels (Email, Slack, Discord)
3. Configure alert rules

---

## 🔄 Update Your App

### From GitHub:

Just push to your repo:
```bash
git add .
git commit -m "Update feature"
git push
```

Railway auto-deploys! ✨

### From CLI:

```bash
railway up
```

---

## 💰 Pricing

### Free Tier ($5 credit/month)
- Good for: Testing, small teams
- Includes: 500 hours of runtime
- Databases: PostgreSQL + Redis included
- No credit card required

### Pro Tier ($20/month)
- Good for: Production use
- Includes: Unlimited runtime
- Priority support
- Better performance

---

## 🔗 Connect to Forge App

After deployment:

1. Copy your Railway URL
2. Update Forge app's `manifest.yml`:

```yaml
external:
  fetch:
    backend:
      - 'https://your-app.up.railway.app'
```

3. Redeploy Forge app:
```bash
forge deploy
```

Done! Your Forge app can now talk to your Railway backend.

---

## 🐛 Troubleshooting

### Build Fails

**Check requirements.txt**:
- All dependencies listed?
- Correct versions?

**Check logs**:
```bash
railway logs --build
```

### App Crashes on Start

**Check environment variables**:
- Is `ANTHROPIC_API_KEY` set?
- Correct format?

**Check logs**:
```bash
railway logs
```

### Database Connection Fails

**Ensure DATABASE_URL is set**:
```bash
railway variables
```

**Check PostgreSQL is added**:
- Dashboard should show PostgreSQL service

### App is Slow

**Check plan**:
- Free tier has resource limits
- Consider upgrading to Pro

**Add caching**:
- Use Redis for frequently accessed data

---

## 🚀 Advanced Configuration

### Custom Domain

1. Go to **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Add your domain: `api.yourdomain.com`
4. Update DNS records as shown
5. SSL is automatic!

### Environment-Specific Variables

Railway supports multiple environments:

```bash
# Production
railway variables set ENVIRONMENT=production

# Staging
railway environment staging
railway variables set ENVIRONMENT=staging
```

### Scheduled Tasks

Add a cron job:

1. Create `cron.py`:
```python
# Reset monthly usage counters
```

2. Add to Railway:
```bash
railway run python cron.py
```

---

## 📈 Scaling

### Vertical Scaling

Railway auto-scales resources based on usage.

For more control:
1. Go to **Settings** → **Resources**
2. Adjust CPU/Memory

### Horizontal Scaling

Deploy multiple instances:
1. Create new service
2. Point to same database
3. Add load balancer

---

## 🔒 Security Best Practices

### API Keys
- Never commit to git
- Use Railway variables
- Rotate regularly

### Database
- Railway uses SSL by default
- Backup automatically enabled
- Access restricted to your services

### Rate Limiting
- Enable `ENABLE_RATE_LIMITING=true`
- Add Redis for burst protection
- Monitor usage patterns

---

## 📚 Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- [Railway Templates](https://railway.app/templates)
- [Community Discord](https://discord.gg/railway)

---

## ✅ Deployment Checklist

Before going to production:

- [ ] API key set in Railway variables
- [ ] Database added (if using analytics)
- [ ] Redis added (if using rate limiting)
- [ ] Custom domain configured (optional)
- [ ] Monitoring/alerts set up
- [ ] Tested health endpoint
- [ ] Tested clarify endpoint
- [ ] Updated Forge app manifest
- [ ] Forge app redeployed
- [ ] End-to-end test in Jira

---

**Questions?** Check Railway docs or open an issue!

**Ready to deploy?** Run: `railway up` 🚀