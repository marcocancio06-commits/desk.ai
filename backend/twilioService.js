const twilio = require('twilio');

/**
 * Twilio SMS Service for Desk.ai
 * 
 * Features:
 * - Send/receive SMS messages
 * - Webhook signature validation
 * - Sandbox vs Production mode
 * - Message logging and tracking
 */

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.testMode = process.env.TWILIO_TEST_MODE === 'true';
    
    this.client = null;
    this.configured = false;
    
    this.initialize();
  }

  initialize() {
    if (!this.accountSid || !this.authToken) {
      console.log('⚠️  Twilio SMS: ⚠️  Not configured (missing credentials)');
      console.log('ℹ️  Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
      this.configured = false;
      return;
    }

    if (!this.phoneNumber) {
      console.log('⚠️  Twilio SMS: ⚠️  Not configured (missing phone number)');
      console.log('ℹ️  Set TWILIO_PHONE_NUMBER in .env');
      this.configured = false;
      return;
    }

    try {
      this.client = twilio(this.accountSid, this.authToken);
      this.configured = true;
      
      const mode = this.testMode ? 'SANDBOX/TEST' : 'PRODUCTION';
      console.log(`✅ Twilio SMS: Configured (${mode} mode)`);
      console.log(`📱 Twilio Phone: ${this.phoneNumber}`);
      
      if (this.testMode) {
        console.log('⚠️  Test Mode: SMS will only work in Twilio Sandbox');
      }
    } catch (error) {
      console.error('❌ Twilio SMS: Failed to initialize:', error.message);
      this.configured = false;
    }
  }

  isConfigured() {
    return this.configured;
  }

  getStatus() {
    return {
      configured: this.configured,
      testMode: this.testMode,
      phoneNumber: this.phoneNumber || null,
      accountSid: this.accountSid ? `${this.accountSid.substring(0, 8)}...` : null
    };
  }

  /**
   * Validate Twilio webhook signature
   * Ensures requests actually come from Twilio
   */
  validateWebhookSignature(signature, url, params) {
    if (!this.configured) {
      return false;
    }

    try {
      return twilio.validateRequest(
        this.authToken,
        signature,
        url,
        params
      );
    } catch (error) {
      console.error('❌ Webhook validation error:', error.message);
      return false;
    }
  }

  /**
   * Send an SMS message
   * @param {string} to - Recipient phone number (E.164 format)
   * @param {string} body - Message content
   * @param {object} options - Additional options
   * @returns {Promise<object>} Message details
   */
  async sendSMS(to, body, options = {}) {
    if (!this.configured) {
      throw new Error('Twilio is not configured. Please add credentials to .env file.');
    }

    if (this.testMode) {
      console.log('📱 [TEST MODE] Sending SMS:');
      console.log(`   To: ${to}`);
      console.log(`   Body: ${body}`);
    }

    try {
      const message = await this.client.messages.create({
        body: body,
        from: this.phoneNumber,
        to: to,
        ...options
      });

      console.log(`✅ SMS sent successfully: ${message.sid}`);
      
      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        direction: 'outbound-api',
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      console.error('❌ Failed to send SMS:', error.message);
      throw error;
    }
  }

  /**
   * Parse incoming SMS webhook data
   * @param {object} body - Request body from Twilio webhook
   * @returns {object} Parsed message data
   */
  parseIncomingSMS(body) {
    return {
      messageSid: body.MessageSid,
      accountSid: body.AccountSid,
      from: body.From,
      to: body.To,
      body: body.Body,
      numMedia: parseInt(body.NumMedia) || 0,
      fromCity: body.FromCity,
      fromState: body.FromState,
      fromZip: body.FromZip,
      fromCountry: body.FromCountry,
      timestamp: new Date()
    };
  }

  /**
   * Create TwiML response for webhook
   * @param {string} message - Optional reply message
   * @returns {string} TwiML XML
   */
  createTwiMLResponse(message = null) {
    const MessagingResponse = twilio.twiml.MessagingResponse;
    const twiml = new MessagingResponse();
    
    if (message) {
      twiml.message(message);
    }
    
    return twiml.toString();
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phone - Phone number in any format
   * @returns {string} E.164 formatted phone
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add +1 for US numbers if not present
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    // Add + prefix
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Check if phone number is in sandbox whitelist (for test mode)
   */
  async checkSandboxStatus(phoneNumber) {
    if (!this.configured || !this.testMode) {
      return { inSandbox: false, message: 'Not in test mode' };
    }

    // In test mode, we can only send to verified numbers
    // This is a placeholder - actual verification would require Twilio API call
    return {
      inSandbox: this.testMode,
      message: this.testMode ? 'Test mode - only verified numbers can receive SMS' : 'Production mode'
    };
  }
}

// Export singleton instance
const twilioService = new TwilioService();

module.exports = twilioService;
