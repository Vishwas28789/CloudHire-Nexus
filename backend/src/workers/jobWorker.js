const cron = require('node-cron');
const config = require('../config');
const logger = require('../utils/logger');
const jobScraperService = require('../services/jobScraper');
const jobFilterService = require('../services/jobFilter');
const autoApplyService = require('../services/autoApply');
const database = require('../models/database');

class JobWorker {
  constructor() {
    this.jobs = [];
  }

  async start() {
    logger.info('Starting job worker...');

    // Initialize database
    await database.initialize();

    // Schedule job scraping
    this.scheduleJobScraping();

    // Schedule auto-apply
    this.scheduleAutoApply();

    // Schedule follow-ups
    this.scheduleFollowUps();

    logger.info('Job worker started successfully');
  }

  scheduleJobScraping() {
    const schedule = config.cron.jobScrape;
    logger.info(`Scheduling job scraping: ${schedule}`);

    const job = cron.schedule(schedule, async () => {
      try {
        logger.info('Starting scheduled job scraping');

        // Scrape from multiple sources
        const sources = ['linkedin', 'indeed', 'naukri', 'glassdoor'];

        for (const source of sources) {
          await jobScraperService.scrapeJobs({
            source,
            keywords: 'cloud engineer'
          });

          // Rate limiting between sources
          await this.delay(5000);
        }

        // Filter newly discovered jobs
        await jobFilterService.filterJobs();

        logger.info('Scheduled job scraping completed');
      } catch (error) {
        logger.error('Error in scheduled job scraping:', error);
      }
    });

    this.jobs.push(job);
  }

  scheduleAutoApply() {
    const schedule = config.cron.autoApply;
    logger.info(`Scheduling auto-apply: ${schedule}`);

    const job = cron.schedule(schedule, async () => {
      try {
        if (!config.app.autoApplyEnabled) {
          logger.info('Auto-apply is disabled');
          return;
        }

        logger.info('Starting scheduled auto-apply');

        // Get profile
        const profile = database.query('SELECT * FROM profiles ORDER BY id DESC LIMIT 1')[0];

        if (!profile) {
          logger.warn('No profile found for auto-apply');
          return;
        }

        // Get high-scoring jobs that haven't been applied to
        const jobs = database.query(`
          SELECT j.* FROM jobs j
          LEFT JOIN applications a ON j.id = a.job_id
          WHERE j.status = 'filtered'
            AND j.score >= ?
            AND j.is_excluded = 0
            AND a.id IS NULL
          ORDER BY j.score DESC
          LIMIT 5
        `, [config.jobs.minScore]);

        logger.info(`Found ${jobs.length} jobs to auto-apply`);

        for (const job of jobs) {
          try {
            await autoApplyService.applyToJob({
              jobId: job.id,
              profileId: profile.id,
              method: 'auto'
            });

            logger.info(`Auto-applied to: ${job.title} at ${job.company}`);

            // Rate limiting between applications
            await this.delay(10000);
          } catch (error) {
            logger.error(`Error auto-applying to job ${job.id}:`, error);
          }
        }

        logger.info('Scheduled auto-apply completed');
      } catch (error) {
        logger.error('Error in scheduled auto-apply:', error);
      }
    });

    this.jobs.push(job);
  }

  scheduleFollowUps() {
    const schedule = config.cron.followup;
    logger.info(`Scheduling follow-ups: ${schedule}`);

    const job = cron.schedule(schedule, async () => {
      try {
        logger.info('Starting scheduled follow-ups');

        // Get applications that need follow-up
        // Applied > 7 days ago, no response, less than 3 follow-ups
        const applications = database.query(`
          SELECT a.*, j.title, j.company
          FROM applications a
          JOIN jobs j ON a.job_id = j.id
          WHERE a.status = 'applied'
            AND a.applied_date < datetime('now', '-7 days')
            AND a.follow_up_count < 3
            AND (a.last_follow_up IS NULL OR a.last_follow_up < datetime('now', '-5 days'))
          LIMIT 10
        `);

        logger.info(`Found ${applications.length} applications for follow-up`);

        for (const application of applications) {
          try {
            await autoApplyService.sendFollowUp(application);

            logger.info(`Sent follow-up for: ${application.title} at ${application.company}`);

            // Rate limiting
            await this.delay(5000);
          } catch (error) {
            logger.error(`Error sending follow-up for application ${application.id}:`, error);
          }
        }

        logger.info('Scheduled follow-ups completed');
      } catch (error) {
        logger.error('Error in scheduled follow-ups:', error);
      }
    });

    this.jobs.push(job);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    logger.info('Stopping job worker...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    logger.info('Job worker stopped');
  }
}

// Run worker if executed directly
if (require.main === module) {
  const worker = new JobWorker();
  worker.start();

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    worker.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    worker.stop();
    process.exit(0);
  });
}

module.exports = JobWorker;
