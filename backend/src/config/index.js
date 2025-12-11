const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // Database configuration
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    sqlite: {
      path: process.env.DB_PATH || path.join(__dirname, '../../database/cloudhire.db')
    },
    postgres: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'cloudhire',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || ''
    }
  },

  // Email service providers
  email: {
    active: 'resend', // Default active provider
    providers: {
      resend: {
        enabled: !!process.env.RESEND_API_KEY,
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: 'noreply@cloudhire.com'
      },
      brevo: {
        enabled: !!process.env.BREVO_API_KEY,
        apiKey: process.env.BREVO_API_KEY,
        fromEmail: 'noreply@cloudhire.com'
      },
      mailjet: {
        enabled: !!(process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY),
        apiKey: process.env.MAILJET_API_KEY,
        secretKey: process.env.MAILJET_SECRET_KEY,
        fromEmail: 'noreply@cloudhire.com'
      },
      smtp: {
        enabled: !!process.env.SMTP_HOST,
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASS,
        fromEmail: 'noreply@cloudhire.com'
      }
    }
  },

  // Recruiter email finder services
  emailFinder: {
    active: 'hunter',
    providers: {
      hunter: {
        enabled: !!process.env.HUNTER_API_KEY,
        apiKey: process.env.HUNTER_API_KEY
      },
      apollo: {
        enabled: !!process.env.APOLLO_API_KEY,
        apiKey: process.env.APOLLO_API_KEY
      },
      clearbit: {
        enabled: !!process.env.CLEARBIT_API_KEY,
        apiKey: process.env.CLEARBIT_API_KEY
      }
    }
  },

  // Web scraping services
  scraping: {
    active: 'custom',
    providers: {
      scraperapi: {
        enabled: !!process.env.SCRAPERAPI_KEY,
        apiKey: process.env.SCRAPERAPI_KEY
      },
      serpapi: {
        enabled: !!process.env.SERPAPI_KEY,
        apiKey: process.env.SERPAPI_KEY
      },
      custom: {
        enabled: true
      }
    },
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SCRAPES, 10) || 5,
    delayMin: parseInt(process.env.SCRAPE_DELAY_MIN, 10) || 2000,
    delayMax: parseInt(process.env.SCRAPE_DELAY_MAX, 10) || 5000,
    userAgentRotation: process.env.USER_AGENT_ROTATION !== 'false'
  },

  // Notification services
  notifications: {
    whatsapp: {
      enabled: !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
      token: process.env.WHATSAPP_TOKEN,
      phoneId: process.env.WHATSAPP_PHONE_ID
    },
    firebase: {
      enabled: !!process.env.FIREBASE_SERVER_KEY,
      serverKey: process.env.FIREBASE_SERVER_KEY
    },
    onesignal: {
      enabled: !!(process.env.ONESIGNAL_API_KEY && process.env.ONESIGNAL_APP_ID),
      apiKey: process.env.ONESIGNAL_API_KEY,
      appId: process.env.ONESIGNAL_APP_ID
    }
  },

  // AI model providers
  ai: {
    active: 'openai',
    providers: {
      openai: {
        enabled: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview'
      },
      anthropic: {
        enabled: !!process.env.ANTHROPIC_API_KEY,
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-opus-20240229'
      },
      google: {
        enabled: !!process.env.GOOGLE_AI_API_KEY,
        apiKey: process.env.GOOGLE_AI_API_KEY,
        model: 'gemini-pro'
      },
      groq: {
        enabled: !!process.env.GROQ_API_KEY,
        apiKey: process.env.GROQ_API_KEY,
        model: 'mixtral-8x7b-32768'
      }
    }
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || ''
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },

  // Application settings
  app: {
    autoApplyEnabled: process.env.AUTO_APPLY_ENABLED !== 'false',
    safeModeEnabled: process.env.SAFE_MODE_ENABLED !== 'false',
    emailRotationEnabled: process.env.EMAIL_ROTATION_ENABLED === 'true',
    resumeRotationEnabled: process.env.RESUME_ROTATION_ENABLED !== 'false'
  },

  // Job filtering
  jobs: {
    targetTypes: (process.env.TARGET_JOB_TYPES || 'cloud,devops,sre,platform').split(','),
    excludeTypes: (process.env.EXCLUDE_JOB_TYPES || 'developer,frontend,backend,full-stack').split(','),
    minScore: parseInt(process.env.MIN_JOB_SCORE, 10) || 60
  },

  // Cron schedules
  cron: {
    jobScrape: process.env.JOB_SCRAPE_SCHEDULE || '0 */6 * * *',
    autoApply: process.env.AUTO_APPLY_SCHEDULE || '0 */2 * * *',
    followup: process.env.FOLLOWUP_SCHEDULE || '0 9 * * *'
  }
};

module.exports = config;
