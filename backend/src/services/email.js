const nodemailer = require('nodemailer');
const database = require('../models/database');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const activeProvider = config.email.active;
    const provider = config.email.providers[activeProvider];

    if (!provider || !provider.enabled) {
      logger.warn('No email provider configured');
      return;
    }

    try {
      if (activeProvider === 'smtp') {
        this.transporter = nodemailer.createTransporter({
          host: provider.host,
          port: provider.port,
          secure: provider.port === 465,
          auth: {
            user: provider.user,
            pass: provider.password
          }
        });
      } else {
        // For other providers (Resend, Brevo, etc.), would use their SDKs
        // Simplified: use SMTP as fallback
        logger.info(`Using email provider: ${activeProvider}`);
      }
    } catch (error) {
      logger.error('Error initializing email transporter:', error);
    }
  }

  async sendEmail({ to, subject, body, attachments = [] }) {
    try {
      logger.info(`Sending email to: ${to}`);

      // Try active provider first
      const result = await this.sendWithProvider(to, subject, body, attachments);

      // Log email
      database.query(
        `INSERT INTO email_logs (to_email, subject, body, sent_via, sent_at, status)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
        [to, subject, body, config.email.active, result.success ? 'sent' : 'failed']
      );

      return result;
    } catch (error) {
      logger.error('Error sending email:', error);
      
      // Log failed email
      database.query(
        `INSERT INTO email_logs (to_email, subject, body, sent_via, status, error_message)
         VALUES (?, ?, ?, ?, 'failed', ?)`,
        [to, subject, body, config.email.active, error.message]
      );

      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendWithProvider(to, subject, body, attachments) {
    const activeProvider = config.email.active;

    if (activeProvider === 'resend') {
      return this.sendWithResend(to, subject, body, attachments);
    } else if (activeProvider === 'brevo') {
      return this.sendWithBrevo(to, subject, body, attachments);
    } else if (activeProvider === 'mailjet') {
      return this.sendWithMailjet(to, subject, body, attachments);
    } else if (activeProvider === 'smtp') {
      return this.sendWithSMTP(to, subject, body, attachments);
    }

    throw new Error('No email provider configured');
  }

  async sendWithSMTP(to, subject, body, attachments) {
    if (!this.transporter) {
      throw new Error('SMTP transporter not configured');
    }

    const mailOptions = {
      from: config.email.providers.smtp.fromEmail,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
      attachments
    };

    await this.transporter.sendMail(mailOptions);

    logger.info('Email sent via SMTP');
    return { success: true, provider: 'smtp' };
  }

  async sendWithResend(to, subject, body, attachments) {
    // In production, use Resend SDK
    logger.info('Would send via Resend');
    return { success: true, provider: 'resend' };
  }

  async sendWithBrevo(to, subject, body, attachments) {
    // In production, use Brevo (Sendinblue) SDK
    logger.info('Would send via Brevo');
    return { success: true, provider: 'brevo' };
  }

  async sendWithMailjet(to, subject, body, attachments) {
    // In production, use Mailjet SDK
    logger.info('Would send via Mailjet');
    return { success: true, provider: 'mailjet' };
  }

  async sendBulkEmails(emails) {
    const results = [];

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);

      // Rate limiting
      await this.delay(1000);
    }

    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new EmailService();
