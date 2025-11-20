const database = require('../models/database');
const config = require('../config');
const logger = require('../utils/logger');

class NotificationService {
  async sendNotification({ type, title, message, data = {} }) {
    try {
      logger.info(`Sending notification: ${title}`);

      // Save to database
      const result = database.query(
        `INSERT INTO notifications (type, title, message, data, sent_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [type, title, message, JSON.stringify(data)]
      );

      const notificationId = result.lastInsertRowid;

      // Send via configured channels
      const promises = [];

      if (config.notifications.whatsapp.enabled) {
        promises.push(this.sendViaWhatsApp(title, message));
      }

      if (config.notifications.firebase.enabled) {
        promises.push(this.sendViaFirebase(title, message, data));
      }

      if (config.notifications.onesignal.enabled) {
        promises.push(this.sendViaOneSignal(title, message, data));
      }

      await Promise.allSettled(promises);

      return {
        id: notificationId,
        success: true
      };
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  async sendViaWhatsApp(title, message) {
    try {
      logger.info('Sending WhatsApp notification');

      // In production, use WhatsApp Business API
      // const response = await axios.post(
      //   `https://graph.facebook.com/v18.0/${config.notifications.whatsapp.phoneId}/messages`,
      //   {
      //     messaging_product: 'whatsapp',
      //     to: 'USER_PHONE_NUMBER',
      //     type: 'text',
      //     text: { body: `${title}\n\n${message}` }
      //   },
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${config.notifications.whatsapp.token}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );

      return { success: true, channel: 'whatsapp' };
    } catch (error) {
      logger.error('Error sending WhatsApp notification:', error);
      return { success: false, channel: 'whatsapp', error: error.message };
    }
  }

  async sendViaFirebase(title, message, data) {
    try {
      logger.info('Sending Firebase notification');

      // In production, use Firebase Admin SDK
      // const messaging = admin.messaging();
      // await messaging.send({
      //   notification: { title, body: message },
      //   data,
      //   topic: 'all_users'
      // });

      return { success: true, channel: 'firebase' };
    } catch (error) {
      logger.error('Error sending Firebase notification:', error);
      return { success: false, channel: 'firebase', error: error.message };
    }
  }

  async sendViaOneSignal(title, message, data) {
    try {
      logger.info('Sending OneSignal notification');

      // In production, use OneSignal API
      // const response = await axios.post(
      //   'https://onesignal.com/api/v1/notifications',
      //   {
      //     app_id: config.notifications.onesignal.appId,
      //     included_segments: ['All'],
      //     headings: { en: title },
      //     contents: { en: message },
      //     data
      //   },
      //   {
      //     headers: {
      //       'Authorization': `Basic ${config.notifications.onesignal.apiKey}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );

      return { success: true, channel: 'onesignal' };
    } catch (error) {
      logger.error('Error sending OneSignal notification:', error);
      return { success: false, channel: 'onesignal', error: error.message };
    }
  }

  async notifyNewJob(job) {
    return this.sendNotification({
      type: 'new_job',
      title: 'New Job Found',
      message: `${job.title} at ${job.company}`,
      data: { jobId: job.id }
    });
  }

  async notifyApplicationSubmitted(application, job) {
    return this.sendNotification({
      type: 'application_submitted',
      title: 'Application Submitted',
      message: `Your application for ${job.title} at ${job.company} has been submitted`,
      data: { applicationId: application.id, jobId: job.id }
    });
  }

  async notifyCallback(application, job) {
    return this.sendNotification({
      type: 'callback',
      title: 'Interview Invitation!',
      message: `You have an interview for ${job.title} at ${job.company}`,
      data: { applicationId: application.id, jobId: job.id }
    });
  }

  async notifyOffer(application, job) {
    return this.sendNotification({
      type: 'offer',
      title: 'Job Offer Received!',
      message: `Congratulations! You received an offer for ${job.title} at ${job.company}`,
      data: { applicationId: application.id, jobId: job.id }
    });
  }

  async notifyError(error, context) {
    return this.sendNotification({
      type: 'error',
      title: 'System Error',
      message: `An error occurred: ${error.message}`,
      data: { context, error: error.message }
    });
  }
}

module.exports = new NotificationService();
