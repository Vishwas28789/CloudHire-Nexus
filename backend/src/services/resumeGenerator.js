const database = require('../models/database');
const aiService = require('./ai');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ResumeGeneratorService {
  constructor() {
    this.templatesDir = path.join(__dirname, '../../templates/resumes');
    this.outputDir = path.join(__dirname, '../../database/resumes');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.templatesDir, this.outputDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateResume({ jobId, profileId, templateName = 'standard', countryVariant, roleVariant }) {
    try {
      logger.info(`Generating resume for job ${jobId}, profile ${profileId}`);

      // Get profile data
      const profile = database.query('SELECT * FROM profiles WHERE id = ?', [profileId])[0];
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Get job data
      const job = database.query('SELECT * FROM jobs WHERE id = ?', [jobId])[0];
      if (!job) {
        throw new Error('Job not found');
      }

      // Generate tailored content using AI
      const tailoredContent = await this.tailorResumeContent(profile, job);

      // Generate PDF resume
      const fileName = `resume_${job.company.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const filePath = path.join(this.outputDir, fileName);

      // Simplified: In production, use proper PDF generation
      const content = this.generateResumeHTML(profile, job, tailoredContent);
      
      // Save resume record to database
      const result = database.query(
        `INSERT INTO resumes (
          profile_id, job_id, template_name, content, file_path, file_name,
          tailored, country_variant, role_variant
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [profileId, jobId, templateName, content, filePath, fileName, 1, countryVariant, roleVariant]
      );

      logger.info(`Resume generated: ${fileName}`);

      return {
        id: result.lastInsertRowid,
        fileName,
        filePath,
        content
      };
    } catch (error) {
      logger.error('Error generating resume:', error);
      throw error;
    }
  }

  async tailorResumeContent(profile, job) {
    try {
      // Use AI to tailor resume content to job description
      const prompt = `
        Tailor the following profile for this job:
        
        Job Title: ${job.title}
        Company: ${job.company}
        Job Description: ${job.description}
        Requirements: ${job.requirements}
        
        Profile:
        Name: ${profile.name}
        Title: ${profile.current_title}
        Skills: ${profile.skills}
        Experience: ${profile.years_experience} years
        
        Generate a tailored professional summary and key achievements that match the job requirements.
      `;

      const tailored = await aiService.generateText(prompt);
      return tailored;
    } catch (error) {
      logger.error('Error tailoring resume content:', error);
      return {
        summary: profile.current_title || 'Experienced professional',
        achievements: ['Strong technical background', 'Proven track record']
      };
    }
  }

  generateResumeHTML(profile, job, tailoredContent) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }
          h2 { color: #34495e; margin-top: 20px; }
          .section { margin-bottom: 20px; }
          .contact { font-size: 14px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <h1>${profile.name}</h1>
        <div class="contact">
          ${profile.email} | ${profile.phone || ''} | ${profile.location || ''}
        </div>
        
        <div class="section">
          <h2>Professional Summary</h2>
          <p>${tailoredContent || profile.current_title}</p>
        </div>
        
        <div class="section">
          <h2>Skills</h2>
          <p>${profile.skills || 'Cloud Technologies, DevOps, Infrastructure'}</p>
        </div>
        
        <div class="section">
          <h2>Experience</h2>
          <p>${profile.years_experience} years of professional experience</p>
        </div>
        
        <div class="section">
          <h2>Education</h2>
          <p>${profile.education || 'Bachelor\'s Degree in Computer Science'}</p>
        </div>
        
        <div class="section">
          <h2>Certifications</h2>
          <p>${profile.certifications || 'AWS Certified Solutions Architect'}</p>
        </div>
      </body>
      </html>
    `;
  }

  async tailorResume(resume) {
    // Additional tailoring for existing resume
    return resume;
  }

  getAvailableTemplates() {
    return [
      { name: 'standard', description: 'Clean, professional ATS-friendly template' },
      { name: 'modern', description: 'Modern design with icons and colors' },
      { name: 'technical', description: 'Technical-focused template' },
      { name: 'executive', description: 'Executive-level template' }
    ];
  }
}

module.exports = new ResumeGeneratorService();
