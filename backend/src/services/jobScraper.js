const axios = require('axios');
const cheerio = require('cheerio');
const database = require('../models/database');
const config = require('../config');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class JobScraperService {
  constructor() {
    this.scrapers = {
      linkedin: this.scrapeLinkedIn.bind(this),
      indeed: this.scrapeIndeed.bind(this),
      naukri: this.scrapeNaukri.bind(this),
      glassdoor: this.scrapeGlassdoor.bind(this),
      custom: this.scrapeCustomURL.bind(this)
    };
  }

  async scrapeJobs({ source, url, keywords = 'cloud engineer' }) {
    try {
      logger.info(`Starting job scrape for source: ${source}`);

      const scraper = this.scrapers[source];
      if (!scraper) {
        throw new Error(`Unsupported job source: ${source}`);
      }

      const jobs = await scraper(url, keywords);
      
      // Save jobs to database
      let savedCount = 0;
      for (const job of jobs) {
        try {
          await this.saveJob(job);
          savedCount++;
        } catch (error) {
          logger.error(`Error saving job: ${error.message}`);
        }
      }

      logger.info(`Scraped ${jobs.length} jobs, saved ${savedCount}`);
      return { scraped: jobs.length, saved: savedCount };
    } catch (error) {
      logger.error('Job scraping error:', error);
      throw error;
    }
  }

  async scrapeLinkedIn(url, keywords) {
    try {
      // LinkedIn job scraping
      const jobs = [];
      const searchUrl = url || `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keywords)}&location=Worldwide&f_WT=2`;

      // Note: In production, use proper scraping service or API
      // This is a simplified version
      logger.info(`Scraping LinkedIn: ${searchUrl}`);

      // Placeholder - would use ScraperAPI or similar in production
      const mockJobs = this.generateMockJobs('LinkedIn', keywords, 10);
      jobs.push(...mockJobs);

      await this.delay();
      return jobs;
    } catch (error) {
      logger.error('LinkedIn scraping error:', error);
      return [];
    }
  }

  async scrapeIndeed(url, keywords) {
    try {
      const jobs = [];
      const searchUrl = url || `https://www.indeed.com/jobs?q=${encodeURIComponent(keywords)}`;

      logger.info(`Scraping Indeed: ${searchUrl}`);

      // Placeholder - would use proper scraping in production
      const mockJobs = this.generateMockJobs('Indeed', keywords, 8);
      jobs.push(...mockJobs);

      await this.delay();
      return jobs;
    } catch (error) {
      logger.error('Indeed scraping error:', error);
      return [];
    }
  }

  async scrapeNaukri(url, keywords) {
    try {
      const jobs = [];
      const searchUrl = url || `https://www.naukri.com/${encodeURIComponent(keywords)}-jobs`;

      logger.info(`Scraping Naukri: ${searchUrl}`);

      const mockJobs = this.generateMockJobs('Naukri', keywords, 6);
      jobs.push(...mockJobs);

      await this.delay();
      return jobs;
    } catch (error) {
      logger.error('Naukri scraping error:', error);
      return [];
    }
  }

  async scrapeGlassdoor(url, keywords) {
    try {
      const jobs = [];
      const searchUrl = url || `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(keywords)}`;

      logger.info(`Scraping Glassdoor: ${searchUrl}`);

      const mockJobs = this.generateMockJobs('Glassdoor', keywords, 7);
      jobs.push(...mockJobs);

      await this.delay();
      return jobs;
    } catch (error) {
      logger.error('Glassdoor scraping error:', error);
      return [];
    }
  }

  async scrapeCustomURL(url) {
    try {
      logger.info(`Scraping custom URL: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const jobs = [];

      // Try to detect common job listing patterns
      $('article, .job, .job-listing, [class*="job"]').each((i, elem) => {
        const title = $(elem).find('h2, h3, .title, [class*="title"]').first().text().trim();
        const company = $(elem).find('.company, [class*="company"]').first().text().trim();
        const location = $(elem).find('.location, [class*="location"]').first().text().trim();
        const jobUrl = $(elem).find('a').first().attr('href');

        if (title && company) {
          jobs.push({
            external_id: uuidv4(),
            title,
            company,
            location: location || 'Not specified',
            url: jobUrl?.startsWith('http') ? jobUrl : new URL(jobUrl || '', url).href,
            source: 'custom',
            description: $(elem).text().substring(0, 500),
            posted_date: new Date().toISOString()
          });
        }
      });

      return jobs;
    } catch (error) {
      logger.error('Custom URL scraping error:', error);
      return [];
    }
  }

  generateMockJobs(source, keywords, count) {
    const jobs = [];
    const companies = ['Amazon', 'Google', 'Microsoft', 'IBM', 'Oracle', 'Salesforce', 'Adobe', 'Netflix'];
    const locations = ['Remote', 'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'London, UK'];
    const titles = [
      'Cloud Engineer',
      'Senior Cloud Architect',
      'DevOps Engineer',
      'Site Reliability Engineer',
      'Cloud Solutions Architect',
      'Platform Engineer',
      'Infrastructure Engineer'
    ];

    for (let i = 0; i < count; i++) {
      jobs.push({
        external_id: `${source.toLowerCase()}-${uuidv4()}`,
        title: titles[Math.floor(Math.random() * titles.length)],
        company: companies[Math.floor(Math.random() * companies.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        job_type: 'Full-time',
        experience_level: ['Entry', 'Mid', 'Senior'][Math.floor(Math.random() * 3)],
        salary_range: '$80,000 - $150,000',
        description: `Looking for a talented professional with experience in ${keywords}. Great opportunity to work with cutting-edge cloud technologies.`,
        requirements: 'AWS/Azure/GCP experience, Strong DevOps skills, Infrastructure as Code',
        url: `https://${source.toLowerCase()}.com/jobs/${uuidv4()}`,
        source: source,
        posted_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return jobs;
  }

  async saveJob(jobData) {
    try {
      // Check if job already exists
      const existing = database.query(
        'SELECT id FROM jobs WHERE external_id = ?',
        [jobData.external_id]
      )[0];

      if (existing) {
        logger.info(`Job already exists: ${jobData.external_id}`);
        return existing.id;
      }

      // Score the job
      const score = await this.scoreJob(jobData);

      const result = database.query(
        `INSERT INTO jobs (
          external_id, title, company, location, job_type, experience_level,
          salary_range, description, requirements, url, source, posted_date, score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          jobData.external_id,
          jobData.title,
          jobData.company,
          jobData.location,
          jobData.job_type,
          jobData.experience_level,
          jobData.salary_range,
          jobData.description,
          jobData.requirements,
          jobData.url,
          jobData.source,
          jobData.posted_date,
          score
        ]
      );

      return result.lastInsertRowid;
    } catch (error) {
      logger.error('Error saving job:', error);
      throw error;
    }
  }

  async scoreJob(job) {
    // Simple scoring algorithm
    let score = 0;

    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();

    // Check for cloud-related keywords
    const cloudKeywords = ['cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'devops', 'sre', 'platform'];
    for (const keyword of cloudKeywords) {
      if (title.includes(keyword)) score += 15;
      if (description.includes(keyword)) score += 5;
    }

    // Check for excluded keywords
    const excludeKeywords = ['developer', 'frontend', 'backend', 'full-stack', 'mobile'];
    for (const keyword of excludeKeywords) {
      if (title.includes(keyword)) score -= 20;
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  async delay() {
    const min = config.scraping.delayMin;
    const max = config.scraping.delayMax;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

module.exports = new JobScraperService();
