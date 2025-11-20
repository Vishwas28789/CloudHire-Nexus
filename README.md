# CloudHire Nexus

**Enterprise-grade automatic cloud job hunting system**

CloudHire Nexus is a complete, production-ready platform for automating your cloud job search. It includes job discovery, filtering, resume tailoring, auto-application, recruiter outreach, and comprehensive analytics.

## 🚀 Features

### Backend (Node.js)
- **Job Scraping Engine**: LinkedIn, Indeed, Naukri, Glassdoor, custom URLs
- **Company Targeter**: Auto-discover and apply to jobs at target companies
- **AI-Powered Filtering**: Score and filter jobs based on cloud relevance
- **Resume Engine**: Auto-generate and tailor resumes per job
- **Recruiter Finder**: Extract and verify recruiter contacts
- **Auto-Apply**: Automated application submission (email & form)
- **Profile Extractor**: Extract profiles from LinkedIn, GitHub, etc.
- **Email Engine**: Multi-provider support (Resend, Brevo, MailJet, SMTP)
- **Notifications**: WhatsApp, Firebase, OneSignal integration
- **Analytics Dashboard**: Track applications, callbacks, offers
- **API Control Center**: Switch providers without rebuild
- **Feature Builder**: AI-powered rule modification

### Mobile App (React Native)
- **Dashboard**: Overview of applications, jobs, and success rates
- **Job Browser**: Search, filter, and view job details
- **Application Tracker**: Monitor application status
- **Profile Manager**: Master profile with multiple resume templates
- **Company Targeter**: Paste company names for automated scraping
- **API Control**: Switch between API providers on-the-fly
- **Feature Builder**: Modify filters and rules with natural language
- **Resume Viewer**: Preview and manage generated resumes
- **Notifications**: Real-time updates on applications
- **Clean UI**: Minimal white theme, fast and professional

## 📁 Project Structure

```
CloudHire-Nexus/
├── backend/                 # Node.js Backend
│   ├── src/
│   │   ├── config/         # Configuration management
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── workers/        # Background jobs
│   │   └── utils/          # Utilities
│   └── package.json
│
├── mobile-app/             # React Native App
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── navigation/     # Navigation setup
│   │   ├── services/       # API services
│   │   ├── context/        # State management
│   │   └── utils/          # Utilities
│   └── package.json
│
└── docs/                   # Documentation
```

## 🛠️ Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm start

# In another terminal, start worker
npm run worker
```

### Mobile App Setup

```bash
cd mobile-app
npm install

# For Android
npx react-native run-android

# For iOS (macOS only)
npx react-native run-ios
```

## 📱 Building Android APK

```bash
cd mobile-app
npm run build:apk
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## 🚢 Deployment

Easily deployable to:
- **Railway** - `railway up`
- **Render** - Connect GitHub repo
- **Fly.io** - `fly deploy`
- **Cyclic**, **Google Cloud Run**, **Supabase Edge Functions**

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## 📊 API Endpoints

- Jobs: `/api/jobs`, `/api/jobs/scrape`
- Applications: `/api/applications`
- Profile: `/api/profile`, `/api/profile/extract`
- Companies: `/api/companies/target`
- Analytics: `/api/analytics/dashboard`
- API Control: `/api/control/config`

Full API documentation: [API.md](docs/API.md)

## ⚙️ Configuration

Key environment variables:

```env
# Database
DB_TYPE=sqlite

# Email Provider (choose one)
RESEND_API_KEY=your_key

# AI Provider (choose one)
OPENAI_API_KEY=your_key

# Job Filters
TARGET_JOB_TYPES=cloud,devops,sre,platform
MIN_JOB_SCORE=60

# Auto-Apply
AUTO_APPLY_ENABLED=true
SAFE_MODE_ENABLED=true
```

## 🎯 Key Features

- **Company Targeter**: Paste company names → auto-scrape → auto-apply
- **Profile Extractor**: Extract from LinkedIn/GitHub URLs
- **Feature Builder**: Modify rules with natural language
- **Multi-Provider**: Switch APIs without app rebuild
- **Safe Mode**: Fill forms, pause before submit

## 📄 License

MIT License

---

**Built for cloud professionals, by automation enthusiasts.**