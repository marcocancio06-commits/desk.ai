-- Migration: Add SMS messages table and update leads for SMS support
-- Created: 2025-11-22
-- Description: Enables SMS conversation tracking through Twilio integration

-- Create messages table for SMS conversations
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Twilio specific fields
  twilio_sid VARCHAR(34) UNIQUE NOT NULL,
  twilio_account_sid VARCHAR(34),
  
  -- Message details
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  body TEXT NOT NULL,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'sent',
  error_code VARCHAR(10),
  error_message TEXT,
  
  -- Media attachments
  num_media INTEGER DEFAULT 0,
  
  -- Location data (from Twilio)
  from_city VARCHAR(100),
  from_state VARCHAR(50),
  from_zip VARCHAR(20),
  from_country VARCHAR(50),
  
  -- Timestamps
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add SMS tracking columns to leads table
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_sms_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_twilio_sid ON messages(twilio_sid);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_from_number ON messages(from_number);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_sms_enabled ON leads(sms_enabled) WHERE sms_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_leads_last_sms_at ON leads(last_sms_at DESC);

-- Add comment for documentation
COMMENT ON TABLE messages IS 'Stores SMS messages sent/received through Twilio integration';
COMMENT ON COLUMN messages.direction IS 'inbound = received from customer, outbound = sent from Desk.ai';
COMMENT ON COLUMN messages.twilio_sid IS 'Unique Twilio message SID for tracking and deduplication';
COMMENT ON COLUMN leads.sms_enabled IS 'TRUE if lead has ever sent/received SMS';
COMMENT ON COLUMN leads.last_sms_at IS 'Timestamp of most recent SMS interaction';
COMMENT ON COLUMN leads.sms_opt_out IS 'TRUE if lead has opted out of SMS communications';
