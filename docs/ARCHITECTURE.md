# CloudHire Nexus - System Architecture

## Overview

CloudHire Nexus is a full-stack enterprise job hunting automation platform built with:
- **Backend**: Node.js + Express
- **Mobile**: React Native
- **Database**: SQLite (default) / PostgreSQL (production)
- **Deployment**: Cloud-native, free-tier friendly

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │Dashboard │  │  Jobs    │  │  Profile │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Apply   │  │ Settings │  │Analytics │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
                        ↓
┌─────────────────────────────────────────────────────────┐
│              Backend API Server (Express)                │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              API Routes Layer                     │   │
│  │  /jobs  /applications  /profile  /analytics      │   │
│  │  /companies  /recruiters  /control  /features    │   │
│  └──────────────────────────────────────────────────┘   │
│                        ↓                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Business Logic Layer                   │   │
│  │                                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │ Job Scraper  │  │Resume Engine │             │   │
│  │  └──────────────┘  └──────────────┘             │   │
│  │  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │ Auto Apply   │  │  AI Service  │             │   │
│  │  └──────────────┘  └──────────────┘             │   │
│  │  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │Email Engine  │  │Notifications │             │   │
│  │  └──────────────┘  └──────────────┘             │   │
│  └──────────────────────────────────────────────────┘   │
│                        ↓                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Data Access Layer                    │   │
│  │         (SQLite / PostgreSQL)                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│               Background Worker                          │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Job Scrape  │  │  Auto Apply  │  │  Follow-ups  │  │
│  │   (6 hours)  │  │   (2 hours)  │  │   (Daily)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              External Services                           │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Job Boards  │  │ Email APIs   │  │   AI APIs    │  │
│  │  (LinkedIn,  │  │ (Resend,     │  │  (OpenAI,    │  │
│  │   Indeed)    │  │  Brevo)      │  │   Claude)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Mobile Application

**Technology**: React Native
**Key Features**:
- Native Android/iOS support
- Offline-first with AsyncStorage
- Real-time updates
- Clean, professional UI

**Screens**:
- Dashboard: Analytics overview
- Jobs: Browse and search
- Applications: Track status
- Profile: Master profile editor
- Settings: Configuration hub

### 2. API Server

**Technology**: Node.js + Express
**Port**: 3000 (configurable)

**Middleware**:
- CORS for cross-origin requests
- Helmet for security headers
- JSON body parser
- Request logging

**Routes** (10 modules):
- Jobs API
- Applications API
- Profile API
- Resumes API
- Companies API
- Recruiters API
- Analytics API
- API Control API
- Notifications API
- Feature Builder API

### 3. Service Layer

**Job Scraper** (`jobScraper.js`):
- Multi-source scraping (LinkedIn, Indeed, Naukri, Glassdoor)
- Custom URL parsing
- Duplicate detection
- Rate limiting
- User-agent rotation

**Job Filter** (`jobFilter.js`):
- AI-powered scoring (0-100)
- Cloud keyword detection
- Role exclusion logic
- Priority ranking

**Resume Generator** (`resumeGenerator.js`):
- Multi-template support
- Job-specific tailoring
- ATS-friendly formatting
- PDF generation
- Version history

**Auto Apply** (`autoApply.js`):
- Email application
- Form filling (Puppeteer)
- Safe mode support
- Manual override
- Application tracking

**Recruiter Finder** (`recruiterFinder.js`):
- Email extraction from job posts
- Hunter.io / Apollo.io integration
- Email pattern guessing
- Confidence scoring
- Contact validation

**Email Engine** (`email.js`):
- Multi-provider support
- Fallback logic
- Rate limiting
- Delivery tracking
- Template system

**AI Service** (`ai.js`):
- Resume tailoring
- Q&A generation
- Job description parsing
- Callback prediction
- Profile optimization

**Company Scraper** (`companyScraper.js`):
- Career page discovery
- Bulk company targeting
- Job extraction
- Auto-filtering

**Profile Extractor** (`profileExtractor.js`):
- LinkedIn parsing
- GitHub API integration
- Generic web scraping
- Data normalization

**Notifications** (`notifications.js`):
- WhatsApp Business API
- Firebase Cloud Messaging
- OneSignal push
- In-app notifications

### 4. Database Layer

**Supported Databases**:
- SQLite (development/small scale)
- PostgreSQL (production)

**Schema**:
```sql
- profiles: User master profile
- jobs: Scraped job listings
- companies: Target companies
- resumes: Generated resumes
- applications: Application tracking
- recruiter_contacts: HR contacts
- email_logs: Email history
- api_providers: Provider config
- feature_rules: AI rules
- notifications: User notifications
- analytics_events: Event tracking
- scrape_queue: Scraping queue
```

### 5. Background Worker

**Cron Jobs**:
- Job scraping: Every 6 hours
- Auto-apply: Every 2 hours
- Follow-ups: Daily at 9 AM

**Process**:
1. Scrape new jobs from sources
2. Filter and score jobs
3. Generate resumes for top jobs
4. Find recruiter contacts
5. Auto-apply to qualifying jobs
6. Send follow-ups for old applications

## Data Flow

### Job Application Flow

```
1. Job Scraping
   ↓
2. Job Filtering & Scoring
   ↓
3. High-Score Jobs Selected
   ↓
4. Resume Generation (AI-tailored)
   ↓
5. Recruiter Contact Finding
   ↓
6. Application Submission
   - Email with resume
   - OR Form filling
   ↓
7. Application Tracking
   ↓
8. Follow-up Scheduling
   ↓
9. Analytics Update
```

### API Control Flow

```
Mobile App Request
   ↓
API Endpoint
   ↓
Route Handler
   ↓
Service Layer
   ↓
External API (if needed)
   ↓
Database Operation
   ↓
Response to Mobile App
```

## Security Features

1. **Environment Variables**: Sensitive data in .env
2. **Input Validation**: Joi schemas
3. **Rate Limiting**: Configurable limits
4. **Safe Mode**: Manual approval before submission
5. **No Authentication**: Per requirements
6. **CORS**: Controlled cross-origin access
7. **Helmet**: Security headers

## Scalability

**Horizontal Scaling**:
- Stateless API design
- Redis for queue management
- Load balancer ready

**Vertical Scaling**:
- Async/await patterns
- Worker threads
- Database connection pooling

**Performance**:
- Efficient database queries
- API response caching
- Lazy loading in mobile app
- Pagination support

## Deployment Options

1. **Railway**: One-click deploy
2. **Render**: Free tier available
3. **Fly.io**: Edge deployment
4. **Vercel**: Serverless functions
5. **Docker**: Container-based
6. **Kubernetes**: Enterprise scale

## Monitoring & Logging

**Logs**:
- Combined log: All events
- Error log: Errors only
- Location: `backend/logs/`

**Analytics**:
- Application success rates
- Job source performance
- Resume effectiveness
- System health metrics

**Health Check**:
- Endpoint: `/health`
- Database connectivity
- External API status
- Uptime monitoring

## Future Enhancements

- [ ] Chrome extension for manual applications
- [ ] LinkedIn direct apply integration
- [ ] Salary negotiation AI
- [ ] Interview scheduling automation
- [ ] Video interview preparation
- [ ] Skill gap analysis
- [ ] Job market trends analysis
- [ ] Team collaboration features
- [ ] Multi-user support
- [ ] Advanced analytics dashboard

## Configuration Management

**Environment-based**:
- Development: SQLite, verbose logging
- Staging: PostgreSQL, moderate logging
- Production: PostgreSQL, minimal logging

**API Provider Switching**:
- No code changes required
- Hot-swapping support
- Fallback chains
- Provider statistics

## Technology Stack

**Backend**:
- Runtime: Node.js 18+
- Framework: Express.js
- Database: SQLite / PostgreSQL
- ORM: None (raw SQL)
- Scraping: Cheerio, Axios, Puppeteer
- Scheduling: node-cron
- Logging: Winston
- Email: Nodemailer + SDKs
- AI: OpenAI SDK, Anthropic SDK

**Mobile**:
- Framework: React Native 0.73
- Navigation: React Navigation
- UI: React Native Paper
- State: Context API
- Storage: AsyncStorage
- HTTP: Axios

**DevOps**:
- Containerization: Docker
- Orchestration: Docker Compose
- CI/CD: GitHub Actions ready
- Hosting: Cloud-agnostic

## API Design Principles

1. **RESTful**: Standard HTTP methods
2. **Consistent**: Uniform response format
3. **Documented**: Comprehensive API docs
4. **Versioned**: Future-proof structure
5. **Paginated**: Large datasets handled
6. **Filtered**: Flexible query parameters
7. **Error-handled**: Graceful failures

## Performance Metrics

**Expected Performance**:
- API Response: < 200ms (avg)
- Job Scraping: 10-50 jobs/minute
- Resume Generation: < 5 seconds
- Email Sending: < 2 seconds
- Database Queries: < 50ms

**Optimization Strategies**:
- Database indexing
- Query optimization
- Caching frequently accessed data
- Async operations
- Connection pooling

---

**Architecture designed for reliability, scalability, and ease of deployment.**
