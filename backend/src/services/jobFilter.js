const database = require('../models/database');
const config = require('../config');
const logger = require('../utils/logger');

class JobFilterService {
  async evaluateJob(job) {
    try {
      const title = (job.title || '').toLowerCase();
      const description = (job.description || '').toLowerCase();
      const requirements = (job.requirements || '').toLowerCase();
      const fullText = `${title} ${description} ${requirements}`;

      let score = 0;
      let isCloudRelated = false;
      let isExcluded = false;

      // Cloud-related keywords (positive scoring)
      const cloudKeywords = {
        primary: ['cloud engineer', 'cloud architect', 'devops engineer', 'sre', 'site reliability', 'platform engineer'],
        secondary: ['aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'docker', 'terraform', 'ansible'],
        tertiary: ['infrastructure', 'ci/cd', 'containerization', 'orchestration', 'cloudformation', 'serverless']
      };

      // Check primary keywords (high weight)
      for (const keyword of cloudKeywords.primary) {
        if (title.includes(keyword)) {
          score += 25;
          isCloudRelated = true;
        }
        if (description.includes(keyword)) score += 10;
      }

      // Check secondary keywords (medium weight)
      for (const keyword of cloudKeywords.secondary) {
        if (fullText.includes(keyword)) {
          score += 5;
          isCloudRelated = true;
        }
      }

      // Check tertiary keywords (low weight)
      for (const keyword of cloudKeywords.tertiary) {
        if (fullText.includes(keyword)) score += 3;
      }

      // Excluded keywords (negative scoring)
      const excludeKeywords = [
        'software developer',
        'full stack developer',
        'frontend developer',
        'backend developer',
        'mobile developer',
        'web developer',
        'java developer',
        'python developer',
        '.net developer',
        'react developer',
        'angular developer'
      ];

      for (const keyword of excludeKeywords) {
        if (title.includes(keyword)) {
          score -= 30;
          isExcluded = true;
        }
      }

      // Check against user-defined target roles
      const targetRoles = config.jobs.targetTypes;
      for (const role of targetRoles) {
        if (title.includes(role)) {
          score += 15;
          isCloudRelated = true;
        }
      }

      // Check against user-defined excluded roles
      const excludeRoles = config.jobs.excludeTypes;
      for (const role of excludeRoles) {
        if (title.includes(role)) {
          score -= 20;
          isExcluded = true;
        }
      }

      // Ensure score is between 0 and 100
      score = Math.max(0, Math.min(100, score));

      return {
        score,
        isCloudRelated,
        isExcluded,
        shouldApply: score >= config.jobs.minScore && !isExcluded
      };
    } catch (error) {
      logger.error('Error evaluating job:', error);
      throw error;
    }
  }

  async filterJobs() {
    try {
      const jobs = database.query(
        "SELECT * FROM jobs WHERE status = 'discovered'"
      );

      logger.info(`Filtering ${jobs.length} discovered jobs`);

      for (const job of jobs) {
        const evaluation = await this.evaluateJob(job);

        database.query(
          `UPDATE jobs SET 
            score = ?,
            is_cloud_related = ?,
            is_excluded = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [
            evaluation.score,
            evaluation.isCloudRelated ? 1 : 0,
            evaluation.isExcluded ? 1 : 0,
            evaluation.shouldApply ? 'filtered' : 'excluded',
            job.id
          ]
        );
      }

      logger.info('Job filtering completed');
      return { processed: jobs.length };
    } catch (error) {
      logger.error('Error filtering jobs:', error);
      throw error;
    }
  }

  async prioritizeJobs() {
    try {
      const jobs = database.query(
        "SELECT * FROM jobs WHERE status = 'filtered' ORDER BY score DESC, created_at DESC LIMIT 100"
      );

      return jobs;
    } catch (error) {
      logger.error('Error prioritizing jobs:', error);
      throw error;
    }
  }
}

module.exports = new JobFilterService();
