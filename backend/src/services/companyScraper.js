const axios = require('axios');
const cheerio = require('cheerio');
const database = require('../models/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class CompanyScraperService {
  async targetCompanies(companies) {
    try {
      logger.info(`Targeting ${companies.length} companies`);

      const results = [];

      for (const companyName of companies) {
        try {
          const result = await this.processCompany(companyName);
          results.push(result);

          // Rate limiting
          await this.delay(2000);
        } catch (error) {
          logger.error(`Error processing company ${companyName}:`, error);
          results.push({
            company: companyName,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error targeting companies:', error);
      throw error;
    }
  }

  async processCompany(companyName) {
    try {
      // Check if company already exists
      let company = database.query(
        'SELECT * FROM companies WHERE name = ?',
        [companyName]
      )[0];

      if (!company) {
        // Create company record
        const result = database.query(
          'INSERT INTO companies (name) VALUES (?)',
          [companyName]
        );
        company = {
          id: result.lastInsertRowid,
          name: companyName
        };
      }

      // Try to find career page
      const careerPageUrl = await this.findCareerPage(companyName);

      if (careerPageUrl) {
        database.query(
          'UPDATE companies SET career_page_url = ? WHERE id = ?',
          [careerPageUrl, company.id]
        );
      }

      // Scrape jobs from career page
      const jobs = await this.scrapeCompanyJobs({ ...company, career_page_url: careerPageUrl });

      return {
        company: companyName,
        success: true,
        careerPageUrl,
        jobsFound: jobs.length
      };
    } catch (error) {
      logger.error(`Error processing company ${companyName}:`, error);
      throw error;
    }
  }

  async findCareerPage(companyName) {
    try {
      // Common career page patterns
      const domain = this.guessDomain(companyName);
      const patterns = [
        `https://${domain}/careers`,
        `https://${domain}/jobs`,
        `https://careers.${domain}`,
        `https://jobs.${domain}`,
        `https://${domain}/about/careers`,
        `https://${domain}/company/careers`
      ];

      for (const url of patterns) {
        try {
          const response = await axios.get(url, {
            timeout: 5000,
            maxRedirects: 3,
            validateStatus: (status) => status < 400
          });

          if (response.status === 200) {
            logger.info(`Found career page: ${url}`);
            return url;
          }
        } catch (error) {
          // Continue to next pattern
        }
      }

      return null;
    } catch (error) {
      logger.error('Error finding career page:', error);
      return null;
    }
  }

  guessDomain(companyName) {
    return companyName.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '') + '.com';
  }

  async scrapeCompanyJobs(company) {
    try {
      if (!company.career_page_url) {
        logger.warn(`No career page URL for ${company.name}`);
        return [];
      }

      logger.info(`Scraping jobs from: ${company.career_page_url}`);

      const response = await axios.get(company.career_page_url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const jobs = [];

      // Try to detect job listings
      $('article, .job, .job-listing, [class*="job"], [class*="position"]').each((i, elem) => {
        const title = $(elem).find('h2, h3, .title, [class*="title"]').first().text().trim();
        const location = $(elem).find('.location, [class*="location"]').first().text().trim();
        const jobUrl = $(elem).find('a').first().attr('href');

        if (title) {
          // Filter for cloud-related roles only
          if (this.isCloudRelated(title)) {
            const job = {
              external_id: `${company.name.toLowerCase()}-${uuidv4()}`,
              title,
              company: company.name,
              location: location || 'Not specified',
              url: this.normalizeURL(jobUrl, company.career_page_url),
              source: 'company_career_page',
              description: $(elem).text().substring(0, 500),
              posted_date: new Date().toISOString()
            };

            jobs.push(job);
          }
        }
      });

      // Save jobs to database
      const jobScraperService = require('./jobScraper');
      for (const job of jobs) {
        await jobScraperService.saveJob(job);
      }

      logger.info(`Found ${jobs.length} cloud-related jobs at ${company.name}`);
      return jobs;
    } catch (error) {
      logger.error('Error scraping company jobs:', error);
      return [];
    }
  }

  isCloudRelated(title) {
    const cloudKeywords = ['cloud', 'devops', 'sre', 'platform', 'infrastructure', 'aws', 'azure', 'gcp'];
    const excludeKeywords = ['developer', 'frontend', 'backend', 'full-stack', 'mobile', 'web'];

    const lowerTitle = title.toLowerCase();

    // Check for cloud keywords
    const hasCloudKeyword = cloudKeywords.some(keyword => lowerTitle.includes(keyword));

    // Check for excluded keywords
    const hasExcludedKeyword = excludeKeywords.some(keyword => lowerTitle.includes(keyword));

    return hasCloudKeyword && !hasExcludedKeyword;
  }

  normalizeURL(url, baseUrl) {
    if (!url) return baseUrl;

    if (url.startsWith('http')) {
      return url;
    }

    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    }

    return baseUrl + '/' + url;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new CompanyScraperService();
