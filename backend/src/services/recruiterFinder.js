const axios = require('axios');
const database = require('../models/database');
const config = require('../config');
const logger = require('../utils/logger');
const validator = require('validator');

class RecruiterFinderService {
  async findRecruiters({ jobId, companyName, jobUrl }) {
    try {
      logger.info(`Finding recruiters for company: ${companyName}`);

      const contacts = [];

      // Try to extract email from job posting
      if (jobUrl) {
        const urlContacts = await this.extractFromURL(jobUrl);
        contacts.push(...urlContacts);
      }

      // Try email finder services
      if (companyName) {
        const serviceContacts = await this.findViaService(companyName);
        contacts.push(...serviceContacts);
      }

      // Try email guessing
      if (companyName && contacts.length === 0) {
        const guessedContacts = await this.guessEmails(companyName);
        contacts.push(...guessedContacts);
      }

      // Save contacts to database
      for (const contact of contacts) {
        await this.saveContact({ ...contact, jobId });
      }

      return contacts;
    } catch (error) {
      logger.error('Error finding recruiters:', error);
      return [];
    }
  }

  async extractFromURL(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const text = response.data;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = text.match(emailRegex) || [];

      const contacts = [];
      for (const email of emails) {
        if (validator.isEmail(email) && !email.includes('example.com')) {
          contacts.push({
            email,
            source: 'job_posting',
            confidence_score: 80
          });
        }
      }

      return contacts;
    } catch (error) {
      logger.error('Error extracting from URL:', error);
      return [];
    }
  }

  async findViaService(companyName) {
    try {
      const activeProvider = config.emailFinder.active;
      const provider = config.emailFinder.providers[activeProvider];

      if (!provider || !provider.enabled) {
        logger.warn('No email finder service configured');
        return [];
      }

      if (activeProvider === 'hunter') {
        return this.findViaHunter(companyName);
      } else if (activeProvider === 'apollo') {
        return this.findViaApollo(companyName);
      } else if (activeProvider === 'clearbit') {
        return this.findViaClearbit(companyName);
      }

      return [];
    } catch (error) {
      logger.error('Error finding via service:', error);
      return [];
    }
  }

  async findViaHunter(companyName) {
    // In production, use Hunter.io API
    logger.info('Would search Hunter.io');
    return [];
  }

  async findViaApollo(companyName) {
    // In production, use Apollo.io API
    logger.info('Would search Apollo.io');
    return [];
  }

  async findViaClearbit(companyName) {
    // In production, use Clearbit API
    logger.info('Would search Clearbit');
    return [];
  }

  async guessEmails(companyName) {
    const domain = this.guessDomain(companyName);
    const patterns = [
      `careers@${domain}`,
      `recruiting@${domain}`,
      `hr@${domain}`,
      `jobs@${domain}`,
      `talent@${domain}`
    ];

    const contacts = [];
    for (const email of patterns) {
      contacts.push({
        email,
        source: 'guessed',
        confidence_score: 30
      });
    }

    return contacts;
  }

  guessDomain(companyName) {
    // Simple domain guessing
    return companyName.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '') + '.com';
  }

  async verifyEmail(email) {
    try {
      // Basic email validation
      if (!validator.isEmail(email)) {
        return {
          valid: false,
          confidence: 0,
          message: 'Invalid email format'
        };
      }

      // In production, use email verification service
      return {
        valid: true,
        confidence: 60,
        message: 'Email format is valid'
      };
    } catch (error) {
      logger.error('Error verifying email:', error);
      return {
        valid: false,
        confidence: 0,
        message: error.message
      };
    }
  }

  async saveContact(contact) {
    try {
      // Check if contact already exists
      const existing = database.query(
        'SELECT id FROM recruiter_contacts WHERE email = ? AND job_id = ?',
        [contact.email, contact.jobId]
      )[0];

      if (existing) {
        return existing.id;
      }

      const result = database.query(
        `INSERT INTO recruiter_contacts (
          job_id, email, name, phone, linkedin_url, title,
          confidence_score, source, verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contact.jobId,
          contact.email,
          contact.name || null,
          contact.phone || null,
          contact.linkedin_url || null,
          contact.title || null,
          contact.confidence_score || 50,
          contact.source || 'unknown',
          0
        ]
      );

      return result.lastInsertRowid;
    } catch (error) {
      logger.error('Error saving contact:', error);
      throw error;
    }
  }

  async contactRecruiter({ contact, message, subject }) {
    try {
      const emailService = require('./email');

      const result = await emailService.sendEmail({
        to: contact.email,
        subject: subject || 'Inquiry about Open Position',
        body: message
      });

      if (result.success) {
        // Log contact
        database.query(
          `INSERT INTO email_logs (recruiter_contact_id, to_email, subject, body, sent_via, sent_at, status)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'sent')`,
          [contact.id, contact.email, subject, message, config.email.active]
        );
      }

      return result;
    } catch (error) {
      logger.error('Error contacting recruiter:', error);
      throw error;
    }
  }
}

module.exports = new RecruiterFinderService();
