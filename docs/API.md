# CloudHire Nexus API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

No authentication required (as per requirements).

## Jobs API

### List Jobs
```
GET /api/jobs
```

Query Parameters:
- `status` - Filter by status (discovered, filtered, excluded)
- `source` - Filter by source (linkedin, indeed, etc.)
- `minScore` - Minimum job score (0-100)
- `search` - Search in title, company, description
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)
- `sortBy` - Sort field (default: created_at)
- `order` - Sort order (ASC/DESC, default: DESC)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Cloud Engineer",
      "company": "Amazon",
      "location": "Remote",
      "score": 85,
      "is_cloud_related": 1,
      "source": "linkedin",
      "url": "https://..."
    }
  ]
}
```

### Get Job Details
```
GET /api/jobs/:id
```

### Trigger Job Scraping
```
POST /api/jobs/scrape
```

Body:
```json
{
  "source": "linkedin",
  "keywords": "cloud engineer"
}
```

### Update Job Status
```
PATCH /api/jobs/:id/status
```

Body:
```json
{
  "status": "filtered"
}
```

## Applications API

### List Applications
```
GET /api/applications
```

Query Parameters:
- `status` - Filter by status
- `page` - Page number
- `limit` - Results per page

### Create Application (Auto-Apply)
```
POST /api/applications
```

Body:
```json
{
  "jobId": 1,
  "profileId": 1,
  "resumeId": 1,
  "method": "auto"
}
```

### Update Application Status
```
PATCH /api/applications/:id/status
```

Body:
```json
{
  "status": "interview",
  "notes": "Scheduled for next week"
}
```

### Send Follow-up
```
POST /api/applications/:id/followup
```

## Profile API

### Get Profile
```
GET /api/profile
```

### Save Profile
```
POST /api/profile
```

Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "current_title": "Cloud Engineer",
  "years_experience": 5,
  "skills": "AWS, Azure, Kubernetes",
  "location": "San Francisco, CA"
}
```

### Extract Profile from URL
```
POST /api/profile/extract
```

Body:
```json
{
  "url": "https://linkedin.com/in/johndoe",
  "type": "linkedin"
}
```

## Resumes API

### List Resumes
```
GET /api/resumes
```

### Generate Resume
```
POST /api/resumes/generate
```

Body:
```json
{
  "jobId": 1,
  "profileId": 1,
  "templateName": "standard"
}
```

### Get Available Templates
```
GET /api/resumes/templates/list
```

## Companies API

### List Companies
```
GET /api/companies
```

### Target Companies
```
POST /api/companies/target
```

Body:
```json
{
  "companies": ["Amazon", "Google", "Microsoft"]
}
```

### Scrape Company Jobs
```
POST /api/companies/:id/scrape
```

## Recruiters API

### List Recruiters
```
GET /api/recruiters
```

### Find Recruiters
```
POST /api/recruiters/find
```

Body:
```json
{
  "jobId": 1,
  "companyName": "Amazon"
}
```

### Contact Recruiter
```
POST /api/recruiters/:id/contact
```

Body:
```json
{
  "subject": "Regarding Cloud Engineer Position",
  "message": "Hello, I'm interested in..."
}
```

## Analytics API

### Dashboard Analytics
```
GET /api/analytics/dashboard
```

Response:
```json
{
  "success": true,
  "data": {
    "applications": {
      "total": 50,
      "pending": 10,
      "applied": 30,
      "interview": 8,
      "offer": 2
    },
    "jobs": {
      "total": 200,
      "cloudRelated": 150
    },
    "rates": {
      "callbackRate": "16.00",
      "offerRate": "4.00"
    }
  }
}
```

### Resume Analytics
```
GET /api/analytics/resumes
```

### Source Analytics
```
GET /api/analytics/sources
```

## API Control

### Get Configuration
```
GET /api/control/config
```

### Activate Provider
```
POST /api/control/providers/activate
```

Body:
```json
{
  "category": "email",
  "providerName": "resend"
}
```

### Test Provider
```
POST /api/control/providers/test
```

Body:
```json
{
  "category": "ai",
  "providerName": "openai"
}
```

## Notifications API

### List Notifications
```
GET /api/notifications?read=false&limit=50
```

### Mark as Read
```
PATCH /api/notifications/:id/read
```

### Mark All as Read
```
POST /api/notifications/read-all
```

## Feature Builder API

### List Rules
```
GET /api/features/rules
```

### Create Rule
```
POST /api/features/rules
```

Body:
```json
{
  "instruction": "Exclude all jobs with salary below $100k"
}
```

### Update Rule Status
```
PATCH /api/features/rules/:id/status
```

Body:
```json
{
  "isActive": false
}
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request
- `404` - Not found
- `500` - Server error
