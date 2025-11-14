# Jira Clarifier Backend API

This is the backend API service for the Jira Clarifier Forge app. It handles AI-powered ticket clarification using Claude.

## 🚀 Quick Deploy

### Railway (Recommended)

1. **Create Railway Account**: Go to [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository
   - Railway will auto-detect the Node.js app

3. **Add Environment Variables**:
   - Go to your project settings
   - Add: `ANTHROPIC_API_KEY` with your Claude API key
   - Railway auto-configures `PORT`

4. **Get Your URL**:
   - Go to Settings → Domains
   - Copy your Railway URL (e.g., `https://your-app.up.railway.app`)
   - Update this URL in your Forge app's `manifest.yml`

### Heroku

1. **Install Heroku CLI**:
```bash
npm install -g heroku
```

2. **Login and Create App**:
```bash
heroku login
heroku create jira-clarifier-api
```

3. **Set Environment Variables**:
```bash
heroku config:set ANTHROPIC_API_KEY=your_api_key_here
```

4. **Deploy**:
```bash
git push heroku main
```

5. **Get Your URL**:
```bash
heroku open
# Copy the URL and update manifest.yml
```

### Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: jira-clarifier-api
   - **Environment**: Node
   - **Build Command**: `cd backend-api && npm install`
   - **Start Command**: `cd backend-api && npm start`
5. Add environment variable: `ANTHROPIC_API_KEY`
6. Deploy and copy the URL

## 🧪 Local Development

### Setup

```bash
cd backend-api
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Run

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### Test

```bash
# Health check
curl http://localhost:3001/health

# Test clarification
curl -X POST http://localhost:3001/clarify \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "description": "Users cant log in sometimes",
    "issueType": "Bug",
    "priority": "High"
  }'
```

## 📡 API Endpoints

### GET /health

Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

### POST /clarify

Clarify a Jira ticket using AI.

**Request**:
```json
{
  "title": "Fix login bug",
  "description": "Users can't log in sometimes",
  "issueType": "Bug",
  "priority": "High"
}
```

**Response**:
```json
{
  "acceptanceCriteria": [
    "Given valid credentials → login in <3s",
    "Given invalid password → show clear error"
  ],
  "edgeCases": [
    "Network timeout",
    "Special characters in password"
  ],
  "successMetrics": [
    "Login success rate >99.5%"
  ],
  "testScenarios": [
    "Test with various network conditions"
  ]
}
```

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Claude API key from console.anthropic.com |
| `PORT` | No | Server port (default: 3001) |
| `ALLOWED_ORIGINS` | No | CORS allowed origins (comma-separated) |

## 🛡️ Security Considerations

1. **API Key**: Never commit your `ANTHROPIC_API_KEY` to version control
2. **Rate Limiting**: Consider adding rate limiting for production
3. **CORS**: Configure `ALLOWED_ORIGINS` to restrict access
4. **Monitoring**: Set up error logging and monitoring

## 📊 Costs

Claude API pricing (as of 2025):
- **Input**: ~$3 per million tokens
- **Output**: ~$15 per million tokens

Typical ticket clarification:
- **Input**: ~200 tokens ($0.0006)
- **Output**: ~500 tokens ($0.0075)
- **Per request**: ~$0.008 (less than 1 cent)

Railway/Heroku free tiers are sufficient for most use cases.

## 🐛 Troubleshooting

### "API key not found" error
- Make sure `ANTHROPIC_API_KEY` is set in your environment
- Verify the key is valid at console.anthropic.com

### "Failed to clarify ticket" error
- Check Claude API status
- Review server logs for detailed error messages
- Ensure your API key has sufficient credits

### CORS errors
- Add your Jira site URL to `ALLOWED_ORIGINS`
- Restart the server after environment changes

## 📚 Additional Resources

- [Claude API Documentation](https://docs.anthropic.com)
- [Railway Documentation](https://docs.railway.app)
- [Express.js Guide](https://expressjs.com)

---

Need help? Open an issue or check the main README.