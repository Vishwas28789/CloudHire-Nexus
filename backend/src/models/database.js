const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const config = require('../config');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.type = config.database.type;
  }

  async initialize() {
    if (this.type === 'sqlite') {
      return this.initializeSQLite();
    } else if (this.type === 'postgres') {
      return this.initializePostgres();
    }
    throw new Error(`Unsupported database type: ${this.type}`);
  }

  initializeSQLite() {
    const dbDir = path.dirname(config.database.sqlite.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(config.database.sqlite.path);
    this.db.pragma('journal_mode = WAL');
    this.createTables();
    return this.db;
  }

  async initializePostgres() {
    this.db = new Pool({
      host: config.database.postgres.host,
      port: config.database.postgres.port,
      database: config.database.postgres.database,
      user: config.database.postgres.user,
      password: config.database.postgres.password
    });

    await this.createTablesPostgres();
    return this.db;
  }

  createTables() {
    const tables = `
      -- User Profile
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        linkedin_url TEXT,
        github_url TEXT,
        portfolio_url TEXT,
        current_title TEXT,
        years_experience INTEGER,
        skills TEXT,
        certifications TEXT,
        education TEXT,
        location TEXT,
        preferred_locations TEXT,
        target_roles TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Jobs
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_id TEXT UNIQUE,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        job_type TEXT,
        experience_level TEXT,
        salary_range TEXT,
        description TEXT,
        requirements TEXT,
        url TEXT NOT NULL,
        source TEXT NOT NULL,
        posted_date DATETIME,
        score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'discovered',
        is_cloud_related BOOLEAN DEFAULT 0,
        is_excluded BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Companies
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        domain TEXT,
        career_page_url TEXT,
        industry TEXT,
        size TEXT,
        location TEXT,
        description TEXT,
        last_scraped DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Resumes
      CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER,
        job_id INTEGER,
        template_name TEXT NOT NULL,
        content TEXT,
        file_path TEXT,
        file_name TEXT,
        tailored BOOLEAN DEFAULT 0,
        version INTEGER DEFAULT 1,
        country_variant TEXT,
        role_variant TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES profiles(id),
        FOREIGN KEY (job_id) REFERENCES jobs(id)
      );

      -- Applications
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        profile_id INTEGER NOT NULL,
        resume_id INTEGER,
        status TEXT DEFAULT 'pending',
        application_method TEXT,
        applied_via TEXT,
        applied_date DATETIME,
        response_date DATETIME,
        interview_date DATETIME,
        offer_date DATETIME,
        rejection_date DATETIME,
        follow_up_count INTEGER DEFAULT 0,
        last_follow_up DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        FOREIGN KEY (profile_id) REFERENCES profiles(id),
        FOREIGN KEY (resume_id) REFERENCES resumes(id)
      );

      -- Recruiter Contacts
      CREATE TABLE IF NOT EXISTS recruiter_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        company_id INTEGER,
        name TEXT,
        email TEXT,
        phone TEXT,
        linkedin_url TEXT,
        title TEXT,
        confidence_score INTEGER,
        source TEXT,
        verified BOOLEAN DEFAULT 0,
        last_contacted DATETIME,
        response_received BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        FOREIGN KEY (company_id) REFERENCES companies(id)
      );

      -- Email Logs
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER,
        recruiter_contact_id INTEGER,
        to_email TEXT NOT NULL,
        subject TEXT,
        body TEXT,
        sent_via TEXT,
        sent_at DATETIME,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        opened BOOLEAN DEFAULT 0,
        clicked BOOLEAN DEFAULT 0,
        replied BOOLEAN DEFAULT 0,
        FOREIGN KEY (application_id) REFERENCES applications(id),
        FOREIGN KEY (recruiter_contact_id) REFERENCES recruiter_contacts(id)
      );

      -- API Provider Settings
      CREATE TABLE IF NOT EXISTS api_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        provider_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 0,
        priority INTEGER DEFAULT 0,
        config TEXT,
        last_used DATETIME,
        success_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, provider_name)
      );

      -- Feature Rules
      CREATE TABLE IF NOT EXISTS feature_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_name TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        rule_definition TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Notifications
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 1,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        data TEXT,
        read BOOLEAN DEFAULT 0,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Analytics Events
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        event_category TEXT,
        event_data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Scrape Queue
      CREATE TABLE IF NOT EXISTS scrape_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(score);
      CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
      CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
      CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
      CREATE INDEX IF NOT EXISTS idx_scrape_queue_status ON scrape_queue(status);
    `;

    this.db.exec(tables);
  }

  async createTablesPostgres() {
    const tables = `
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        linkedin_url TEXT,
        github_url TEXT,
        portfolio_url TEXT,
        current_title TEXT,
        years_experience INTEGER,
        skills TEXT,
        certifications TEXT,
        education TEXT,
        location TEXT,
        preferred_locations TEXT,
        target_roles TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        external_id TEXT UNIQUE,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        job_type TEXT,
        experience_level TEXT,
        salary_range TEXT,
        description TEXT,
        requirements TEXT,
        url TEXT NOT NULL,
        source TEXT NOT NULL,
        posted_date TIMESTAMP,
        score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'discovered',
        is_cloud_related BOOLEAN DEFAULT false,
        is_excluded BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        domain TEXT,
        career_page_url TEXT,
        industry TEXT,
        size TEXT,
        location TEXT,
        description TEXT,
        last_scraped TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS resumes (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER REFERENCES profiles(id),
        job_id INTEGER REFERENCES jobs(id),
        template_name TEXT NOT NULL,
        content TEXT,
        file_path TEXT,
        file_name TEXT,
        tailored BOOLEAN DEFAULT false,
        version INTEGER DEFAULT 1,
        country_variant TEXT,
        role_variant TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(id),
        profile_id INTEGER NOT NULL REFERENCES profiles(id),
        resume_id INTEGER REFERENCES resumes(id),
        status TEXT DEFAULT 'pending',
        application_method TEXT,
        applied_via TEXT,
        applied_date TIMESTAMP,
        response_date TIMESTAMP,
        interview_date TIMESTAMP,
        offer_date TIMESTAMP,
        rejection_date TIMESTAMP,
        follow_up_count INTEGER DEFAULT 0,
        last_follow_up TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS recruiter_contacts (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id),
        company_id INTEGER REFERENCES companies(id),
        name TEXT,
        email TEXT,
        phone TEXT,
        linkedin_url TEXT,
        title TEXT,
        confidence_score INTEGER,
        source TEXT,
        verified BOOLEAN DEFAULT false,
        last_contacted TIMESTAMP,
        response_received BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES applications(id),
        recruiter_contact_id INTEGER REFERENCES recruiter_contacts(id),
        to_email TEXT NOT NULL,
        subject TEXT,
        body TEXT,
        sent_via TEXT,
        sent_at TIMESTAMP,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        opened BOOLEAN DEFAULT false,
        clicked BOOLEAN DEFAULT false,
        replied BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS api_providers (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        provider_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT false,
        priority INTEGER DEFAULT 0,
        config TEXT,
        last_used TIMESTAMP,
        success_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, provider_name)
      );

      CREATE TABLE IF NOT EXISTS feature_rules (
        id SERIAL PRIMARY KEY,
        feature_name TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        rule_definition TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        data TEXT,
        read BOOLEAN DEFAULT false,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        event_category TEXT,
        event_data TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scrape_queue (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        result TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(score);
      CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
      CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
      CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
      CREATE INDEX IF NOT EXISTS idx_scrape_queue_status ON scrape_queue(status);
    `;

    await this.db.query(tables);
  }

  query(sql, params = []) {
    if (this.type === 'sqlite') {
      const stmt = this.db.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return stmt.all(...params);
      }
      return stmt.run(...params);
    } else {
      return this.db.query(sql, params);
    }
  }

  async close() {
    if (this.db) {
      if (this.type === 'sqlite') {
        this.db.close();
      } else {
        await this.db.end();
      }
    }
  }
}

module.exports = new DatabaseManager();
