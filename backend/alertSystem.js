/**
 * Email alert system for critical failures
 * Sends notifications to growzone.ai@gmail.com
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

class AlertSystem {
  constructor() {
    this.alertEmail = 'growzone.ai@gmail.com';
    this.lastAlertTimes = new Map(); // Track to prevent alert spam
    this.cooldownMs = 15 * 60 * 1000; // 15 minutes between similar alerts
    
    // Configure email transporter
    this.transporter = null;
    this.setupTransporter();
  }

  setupTransporter() {
    // Use environment variables for email config
    const emailUser = process.env.ALERT_EMAIL_USER;
    const emailPass = process.env.ALERT_EMAIL_PASS;

    if (emailUser && emailPass) {
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
      logger.info('Alert email system configured');
    } else {
      logger.warn('Alert email not configured (missing ALERT_EMAIL_USER or ALERT_EMAIL_PASS)');
    }
  }

  /**
   * Check if we should send alert (cooldown check)
   */
  shouldSendAlert(alertKey) {
    const lastTime = this.lastAlertTimes.get(alertKey);
    if (!lastTime) return true;
    
    const timeSince = Date.now() - lastTime;
    return timeSince > this.cooldownMs;
  }

  /**
   * Send critical alert email
   */
  async sendCriticalAlert(subject, details) {
    if (!this.transporter) {
      logger.warn('Cannot send alert email - not configured');
      return false;
    }

    const alertKey = `critical:${subject}`;
    
    // Check cooldown
    if (!this.shouldSendAlert(alertKey)) {
      logger.debug(`Skipping alert (cooldown): ${subject}`);
      return false;
    }

    try {
      const emailBody = `
🚨 CRITICAL ALERT - Desk.ai

Subject: ${subject}

Time: ${new Date().toISOString()}

Details:
${JSON.stringify(details, null, 2)}

---
This is an automated alert from Desk.ai monitoring system.
      `.trim();

      await this.transporter.sendMail({
        from: process.env.ALERT_EMAIL_USER,
        to: this.alertEmail,
        subject: `🚨 Desk.ai Alert: ${subject}`,
        text: emailBody
      });

      // Update last alert time
      this.lastAlertTimes.set(alertKey, Date.now());
      
      logger.info(`Critical alert sent: ${subject}`);
      return true;
    } catch (error) {
      logger.error('Failed to send alert email', { error: error.message });
      return false;
    }
  }

  /**
   * Alert for database connection failure
   */
  async alertDatabaseFailure(error) {
    await this.sendCriticalAlert('Database Connection Failed', {
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Alert for AI service failure
   */
  async alertAIFailure(context, error, retries) {
    await this.sendCriticalAlert('AI Service Failure', {
      context,
      errorMessage: error.message,
      retriesAttempted: retries,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Alert for repeated errors (threshold-based)
   */
  async alertRepeatedErrors(errorType, count, timeWindow) {
    await this.sendCriticalAlert('Repeated Errors Detected', {
      errorType,
      occurrences: count,
      timeWindowMinutes: timeWindow,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Alert for system resource issues
   */
  async alertResourceIssue(resourceType, details) {
    await this.sendCriticalAlert(`Resource Issue: ${resourceType}`, {
      resource: resourceType,
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton
const alertSystem = new AlertSystem();
module.exports = alertSystem;
