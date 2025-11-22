/**
 * Message queue for outbound SMS
 * Prevents rate limits and handles retry logic
 */

const logger = require('./logger');
const twilioService = require('./twilioService');

class SMSQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3;
    this.rateLimit = {
      messagesPerSecond: 1, // Twilio typical rate limit
      burstSize: 5
    };
    this.recentMessages = [];
    this.retryDelays = [2000, 5000, 10000]; // Delays for retry attempts
  }

  /**
   * Add message to queue
   */
  async enqueue(to, message, metadata = {}) {
    const queueItem = {
      id: Date.now() + Math.random(),
      to,
      message,
      metadata,
      attempts: 0,
      createdAt: new Date(),
      status: 'pending'
    };

    this.queue.push(queueItem);
    logger.info('SMS added to queue', {
      queueId: queueItem.id,
      to,
      queueLength: this.queue.length
    });

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return queueItem.id;
  }

  /**
   * Check if we're within rate limits
   */
  canSendNow() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Remove old messages from recent list
    this.recentMessages = this.recentMessages.filter(
      time => time > oneSecondAgo
    );

    // Check rate limit
    if (this.recentMessages.length >= this.rateLimit.messagesPerSecond) {
      return false;
    }

    return true;
  }

  /**
   * Process the queue
   */
  async processQueue() {
    if (this.processing) return;
    
    this.processing = true;
    logger.debug('Starting SMS queue processing');

    while (this.queue.length > 0) {
      // Check rate limit
      if (!this.canSendNow()) {
        logger.debug('Rate limit reached, waiting...');
        await this.sleep(1000);
        continue;
      }

      // Get next message
      const item = this.queue[0];
      
      try {
        logger.debug(`Sending SMS from queue`, {
          queueId: item.id,
          to: item.to,
          attempt: item.attempts + 1
        });

        // Send the message
        await twilioService.sendSMS(item.to, item.message);

        // Mark as sent
        this.recentMessages.push(Date.now());
        item.status = 'sent';
        
        logger.info('SMS sent successfully from queue', {
          queueId: item.id,
          to: item.to
        });

        // Remove from queue
        this.queue.shift();

      } catch (error) {
        item.attempts++;
        logger.error('SMS send failed from queue', {
          queueId: item.id,
          to: item.to,
          attempt: item.attempts,
          error: error.message
        });

        // Check if we should retry
        if (item.attempts < this.maxRetries) {
          const delay = this.retryDelays[item.attempts - 1] || 10000;
          logger.info(`Will retry SMS after ${delay}ms`, {
            queueId: item.id,
            attempt: item.attempts + 1
          });

          // Move to end of queue with delay
          this.queue.shift();
          await this.sleep(delay);
          this.queue.push(item);
        } else {
          // Max retries reached, mark as failed
          item.status = 'failed';
          item.error = error.message;
          
          logger.error('SMS failed after max retries', {
            queueId: item.id,
            to: item.to,
            attempts: item.attempts
          });

          // Remove from queue
          this.queue.shift();

          // Could save failed messages to database here
        }
      }

      // Small delay between messages
      await this.sleep(200);
    }

    this.processing = false;
    logger.debug('SMS queue processing complete');
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      recentMessageCount: this.recentMessages.length,
      pendingMessages: this.queue.filter(item => item.status === 'pending').length,
      failedMessages: this.queue.filter(item => item.status === 'failed').length
    };
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
const smsQueue = new SMSQueue();
module.exports = smsQueue;
