const database = require('../models/database');
const resumeService = require('./resumeGenerator');
const emailService = require('./email');
const aiService = require('./ai');
const config = require('../config');
const logger = require('../utils/logger');

class AutoApplyService {
  async applyToJob({ jobId, profileId, resumeId, method = 'auto' }) {
    try {
      logger.info(`Starting application for job ${jobId}`);

      // Get job details
      const job = database.query('SELECT * FROM jobs WHERE id = ?', [jobId])[0];
      if (!job) {
        throw new Error('Job not found');
      }

      // Generate or use existing resume
      let resume;
      if (resumeId) {
        resume = database.query('SELECT * FROM resumes WHERE id = ?', [resumeId])[0];
      } else {
        resume = await resumeService.generateResume({
          jobId,
          profileId,
          templateName: 'standard'
        });
        resumeId = resume.id;
      }

      // Determine application method
      const applicationMethod = await this.determineApplicationMethod(job);

      let applicationResult;
      if (applicationMethod === 'email') {
        applicationResult = await this.applyViaEmail(job, profileId, resume);
      } else if (applicationMethod === 'form' && config.app.autoApplyEnabled && config.app.safeModeEnabled) {
        applicationResult = await this.applyViaForm(job, profileId, resume);
      } else {
        applicationResult = {
          status: 'pending',
          method: 'manual',
          message: 'Requires manual application'
        };
      }

      // Save application record
      const result = database.query(
        `INSERT INTO applications (
          job_id, profile_id, resume_id, status, application_method, applied_via
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [jobId, profileId, resumeId, applicationResult.status, method, applicationMethod]
      );

      if (applicationResult.status === 'applied') {
        database.query(
          'UPDATE applications SET applied_date = CURRENT_TIMESTAMP WHERE id = ?',
          [result.lastInsertRowid]
        );
      }

      logger.info(`Application created with ID: ${result.lastInsertRowid}`);

      return {
        applicationId: result.lastInsertRowid,
        ...applicationResult
      };
    } catch (error) {
      logger.error('Error applying to job:', error);
      throw error;
    }
  }

  async determineApplicationMethod(job) {
    // Determine how to apply based on job URL and description
    const url = job.url.toLowerCase();
    const description = (job.description || '').toLowerCase();

    if (description.includes('email') || description.includes('send resume to')) {
      return 'email';
    }

    if (url.includes('apply') || url.includes('application')) {
      return 'form';
    }

    return 'custom';
  }

  async applyViaEmail(job, profileId, resume) {
    try {
      logger.info(`Applying via email for job: ${job.title} at ${job.company}`);

      // Get profile
      const profile = database.query('SELECT * FROM profiles WHERE id = ?', [profileId])[0];

      // Find recruiter email
      const recruiterFinder = require('./recruiterFinder');
      const contacts = await recruiterFinder.findRecruiters({
        jobId: job.id,
        companyName: job.company
      });

      const recruiterEmail = contacts[0]?.email || this.guessRecruiterEmail(job.company);

      // Generate cover letter
      const coverLetter = await this.generateCoverLetter(job, profile);

      // Send email
      const emailResult = await emailService.sendEmail({
        to: recruiterEmail,
        subject: `Application for ${job.title} - ${profile.name}`,
        body: coverLetter,
        attachments: [{
          filename: resume.fileName,
          path: resume.filePath
        }]
      });

      return {
        status: emailResult.success ? 'applied' : 'pending',
        method: 'email',
        message: emailResult.success ? 'Email sent successfully' : 'Email failed to send'
      };
    } catch (error) {
      logger.error('Error applying via email:', error);
      return {
        status: 'failed',
        method: 'email',
        message: error.message
      };
    }
  }

  async applyViaForm(job, profileId, resume) {
    // Auto-fill and submit application form
    // In production, this would use Puppeteer or similar to fill forms
    
    if (!config.app.safeModeEnabled) {
      // Only fill, don't submit
      return {
        status: 'filled',
        method: 'form',
        message: 'Form filled, awaiting manual submission'
      };
    }

    return {
      status: 'pending',
      method: 'form',
      message: 'Form application queued'
    };
  }

  async generateCoverLetter(job, profile) {
    const prompt = `
      Generate a professional cover letter for this job:
      
      Job: ${job.title} at ${job.company}
      Company: ${job.company}
      
      Candidate: ${profile.name}
      Title: ${profile.current_title}
      Experience: ${profile.years_experience} years
      
      Make it professional, concise, and tailored to the role.
    `;

    const coverLetter = await aiService.generateText(prompt);

    return `
Dear Hiring Manager,

${coverLetter}

I have attached my resume for your review. I look forward to discussing how I can contribute to ${job.company}.

Best regards,
${profile.name}
${profile.email}
${profile.phone || ''}
    `.trim();
  }

  guessRecruiterEmail(companyName) {
    // Simple email guessing - would use proper service in production
    const domain = companyName.toLowerCase().replace(/\s+/g, '');
    return `careers@${domain}.com`;
  }

  async sendFollowUp(application) {
    try {
      logger.info(`Sending follow-up for application ${application.id}`);

      // Get job and profile
      const job = database.query('SELECT * FROM jobs WHERE id = ?', [application.job_id])[0];
      const profile = database.query('SELECT * FROM profiles WHERE id = ?', [application.profile_id])[0];

      // Find recruiter contact
      const contacts = database.query(
        'SELECT * FROM recruiter_contacts WHERE job_id = ? ORDER BY confidence_score DESC LIMIT 1',
        [application.job_id]
      );

      const recruiterEmail = contacts[0]?.email || this.guessRecruiterEmail(job.company);

      // Generate follow-up message
      const message = `
Dear Hiring Manager,

I hope this email finds you well. I wanted to follow up on my application for the ${job.title} position at ${job.company} that I submitted recently.

I remain very interested in this opportunity and would welcome the chance to discuss how my experience and skills align with your team's needs.

Thank you for your time and consideration.

Best regards,
${profile.name}
${profile.email}
      `.trim();

      // Send email
      const emailResult = await emailService.sendEmail({
        to: recruiterEmail,
        subject: `Follow-up: ${job.title} Application - ${profile.name}`,
        body: message
      });

      return emailResult;
    } catch (error) {
      logger.error('Error sending follow-up:', error);
      throw error;
    }
  }

  async autoAnswerQuestions(questions, profile) {
    // Use AI to answer application questions
    return await aiService.generateQAAnswers(questions, profile);
  }
}

module.exports = new AutoApplyService();
