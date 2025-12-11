# Deployment Guide

## Deploy to Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Deploy backend:
```bash
cd backend
railway up
```

4. Set environment variables:
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set DB_TYPE=postgres
# Add your API keys
railway variables set OPENAI_API_KEY=your_key
railway variables set RESEND_API_KEY=your_key
```

## Deploy to Render

1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node 18+

4. Add environment variables in dashboard

## Deploy to Fly.io

1. Install Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Create fly.toml in backend directory:
```toml
app = "cloudhire-nexus"

[build]
  builder = "heroku/buildpacks:20"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

3. Deploy:
```bash
cd backend
fly launch
fly deploy
```

## Deploy to Vercel

Create `vercel.json` in root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/index.js"
    }
  ]
}
```

Deploy:
```bash
vercel
```

## Database Setup

### SQLite (Default)
- Automatically created on first run
- Suitable for single-server deployments

### PostgreSQL (Recommended for Production)

1. Create PostgreSQL database (Railway, Supabase, etc.)

2. Update .env:
```env
DB_TYPE=postgres
DB_HOST=your-host
DB_PORT=5432
DB_NAME=cloudhire
DB_USER=postgres
DB_PASSWORD=your-password
```

## Environment Configuration

Required environment variables:
```env
NODE_ENV=production
PORT=3000
DB_TYPE=sqlite or postgres

# At least one email provider
RESEND_API_KEY=
# OR
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Optional but recommended
OPENAI_API_KEY=
```

## Mobile App Configuration

Update API base URL:
```javascript
// mobile-app/src/services/api.js
const API_BASE_URL = 'https://your-backend-url.com/api';
```

Or configure in app settings UI.

## Health Check

All deployments expose `/health` endpoint:
```bash
curl https://your-app.com/health
```

## Monitoring

- Check logs: `railway logs` or platform dashboard
- Monitor `/api/analytics/dashboard` for system health
- Set up alerts for failed applications

## Scaling

- **Vertical**: Increase server resources
- **Horizontal**: Use Redis for queue management
- **Database**: Migrate to PostgreSQL for better performance

## Troubleshooting

1. **Port already in use**: Change PORT in .env
2. **Database connection failed**: Verify DB credentials
3. **API keys not working**: Check provider-specific setup
4. **Mobile app can't connect**: Verify API_BASE_URL and CORS settings
