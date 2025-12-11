const axios = require('axios');
const cheerio = require('cheerio');
const database = require('../models/database');
const logger = require('../utils/logger');

class ProfileExtractorService {
  async extractProfile(url, type = 'auto') {
    try {
      logger.info(`Extracting profile from: ${url}`);

      let extractedData = {};

      if (type === 'auto') {
        type = this.detectProfileType(url);
      }

      if (type === 'linkedin') {
        extractedData = await this.extractLinkedIn(url);
      } else if (type === 'github') {
        extractedData = await this.extractGitHub(url);
      } else {
        extractedData = await this.extractGeneric(url);
      }

      return extractedData;
    } catch (error) {
      logger.error('Error extracting profile:', error);
      throw error;
    }
  }

  detectProfileType(url) {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('linkedin.com')) {
      return 'linkedin';
    } else if (lowerUrl.includes('github.com')) {
      return 'github';
    }

    return 'generic';
  }

  async extractLinkedIn(url) {
    try {
      // Note: LinkedIn has anti-scraping measures
      // In production, use LinkedIn API or professional scraping service
      logger.info('Extracting LinkedIn profile');

      // Simplified extraction
      return {
        type: 'linkedin',
        linkedin_url: url,
        name: 'LinkedIn User',
        current_title: 'Professional',
        years_experience: 5,
        skills: 'Cloud, DevOps, AWS',
        location: 'United States'
      };
    } catch (error) {
      logger.error('Error extracting LinkedIn profile:', error);
      return {};
    }
  }

  async extractGitHub(url) {
    try {
      logger.info('Extracting GitHub profile');

      // Extract username from URL
      const username = url.split('github.com/')[1]?.split('/')[0];

      if (!username) {
        throw new Error('Invalid GitHub URL');
      }

      // Use GitHub API
      const response = await axios.get(`https://api.github.com/users/${username}`, {
        headers: {
          'User-Agent': 'CloudHire-Nexus',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const data = response.data;

      return {
        type: 'github',
        github_url: url,
        name: data.name || username,
        email: data.email,
        location: data.location,
        portfolio_url: data.blog,
        current_title: data.bio,
        skills: 'Software Development'
      };
    } catch (error) {
      logger.error('Error extracting GitHub profile:', error);
      return {};
    }
  }

  async extractGeneric(url) {
    try {
      logger.info('Extracting generic profile');

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      // Try to extract common information
      const extractedData = {
        type: 'generic',
        url: url
      };

      // Try to find email
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const text = $.text();
      const emails = text.match(emailRegex);
      if (emails && emails.length > 0) {
        extractedData.email = emails[0];
      }

      // Try to find phone
      const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g;
      const phones = text.match(phoneRegex);
      if (phones && phones.length > 0) {
        extractedData.phone = phones[0];
      }

      // Try to find name (from title or h1)
      const name = $('h1').first().text().trim() || $('title').text().trim();
      if (name) {
        extractedData.name = name;
      }

      return extractedData;
    } catch (error) {
      logger.error('Error extracting generic profile:', error);
      return {};
    }
  }

  async extractFromResume(filePath) {
    try {
      logger.info('Extracting from resume PDF');

      // In production, use PDF parsing library
      // For now, return placeholder
      return {
        type: 'resume',
        name: 'Resume User',
        email: 'extracted@email.com',
        skills: 'Cloud Technologies'
      };
    } catch (error) {
      logger.error('Error extracting from resume:', error);
      return {};
    }
  }
}

module.exports = new ProfileExtractorService();
