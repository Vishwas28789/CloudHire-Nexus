# Getting Started with CloudHire Nexus

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- For mobile development: React Native environment setup
- For Android APK: Android Studio or Android SDK

## Step 1: Clone the Repository

```bash
git clone https://github.com/Vishwas28789/CloudHire-Nexus.git
cd CloudHire-Nexus
```

## Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your API keys
# At minimum, add one email provider API key
nano .env
```

### Minimal Configuration

For a quick start, configure these in `.env`:

```env
# Database (default SQLite, no setup needed)
DB_TYPE=sqlite

# Email (choose one)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Add AI for better results
OPENAI_API_KEY=sk-...
```

### Start the Backend

```bash
# Terminal 1: Start API server
npm start

# Terminal 2: Start background worker
npm run worker
```

The backend will be running at `http://localhost:3000`

## Step 3: Mobile App Setup

```bash
# Navigate to mobile app
cd mobile-app

# Install dependencies
npm install

# Update API URL (if backend is on a different machine)
# Edit: src/services/api.js
# Change: const API_BASE_URL = 'http://YOUR_IP:3000/api';
```

### For Android

```bash
# Start Metro bundler
npm start

# In another terminal, run Android app
npx react-native run-android
```

### For iOS (macOS only)

```bash
# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Run iOS app
npx react-native run-ios
```

## Step 4: First Time Setup in App

1. Open the app on your device/emulator
2. Navigate to **Profile** tab
3. Fill in your master profile information
4. Save profile

## Step 5: Start Job Hunting

### Option 1: Company Targeter
1. Go to **Settings** → **Company Targeter**
2. Paste company names (one per line):
   ```
   Amazon
   Google
   Microsoft
   Netflix
   ```
3. Tap "Target Companies"
4. System will find career pages and scrape jobs

### Option 2: Manual Job Scraping
1. From Dashboard, tap "Browse Jobs"
2. Tap the + button to trigger scraping
3. Jobs will appear in the list

### Option 3: Automated Scraping
The background worker automatically scrapes jobs every 6 hours based on your cron schedule.

## Step 6: Review and Apply

1. Browse jobs in **Jobs** tab
2. View job details and scores
3. Tap "Apply Now" for auto-application
4. Monitor progress in **Applications** tab

## Troubleshooting

### Backend won't start
- Check if port 3000 is available
- Verify Node.js version: `node --version` (should be 18+)
- Check logs in `backend/logs/`

### Mobile app can't connect to backend
- Verify backend is running: `curl http://localhost:3000/health`
- Update API URL in app to use your computer's IP (not localhost) if testing on physical device
- Check firewall settings

### Database errors
- Delete `backend/database/cloudhire.db` to reset
- Or switch to PostgreSQL in `.env`

### No jobs being scraped
- Check worker logs
- Verify internet connection
- Some sites may require API keys (ScraperAPI, SerpAPI)

## Next Steps

- **Configure API Providers**: Go to Settings → API Control Center
- **Set Up Notifications**: Add WhatsApp/Firebase tokens for alerts
- **Customize Filters**: Use Feature Builder with natural language
- **Extract Profile**: Import your LinkedIn/GitHub profile
- **Monitor Analytics**: Check Dashboard for success metrics

## Advanced Usage

### Custom Cron Schedules

Edit `.env` to change scheduling:
```env
JOB_SCRAPE_SCHEDULE=0 */6 * * *    # Every 6 hours
AUTO_APPLY_SCHEDULE=0 */2 * * *    # Every 2 hours
FOLLOWUP_SCHEDULE=0 9 * * *        # Daily at 9 AM
```

### Multiple Resume Templates

Generate different resume variants:
```bash
curl -X POST http://localhost:3000/api/resumes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "profileId": 1,
    "templateName": "modern",
    "countryVariant": "US"
  }'
```

### API Testing

Test individual endpoints:
```bash
# Health check
curl http://localhost:3000/health

# Get dashboard analytics
curl http://localhost:3000/api/analytics/dashboard

# List jobs
curl http://localhost:3000/api/jobs?minScore=70
```

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deploying to:
- Railway
- Render
- Fly.io
- Vercel
- And more

## Getting Help

- Check the [API Documentation](API.md)
- Review backend logs: `tail -f backend/logs/combined.log`
- Verify configuration: Check `.env` file
- Test components individually using API endpoints

## Tips for Best Results

1. **Complete your profile thoroughly** - Better profiles = better resumes
2. **Start with Safe Mode enabled** - Review before mass applications
3. **Set realistic job scores** - 60+ is a good threshold
4. **Monitor early results** - Adjust filters based on performance
5. **Use company targeter** - More focused, higher success rate
6. **Keep API keys secure** - Never commit .env to git
7. **Regular backups** - Export your applications data periodically

---

**You're now ready to automate your cloud job hunt!** 🚀
