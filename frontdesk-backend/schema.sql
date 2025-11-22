-- ============================================================================
-- DESK.AI DATABASE SCHEMA
-- ============================================================================
-- This SQL schema creates all necessary tables for the Desk.ai platform
-- Run this in your Supabase SQL editor or Neon console
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- BUSINESS SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id VARCHAR(100) UNIQUE NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  policies JSONB NOT NULL DEFAULT '{}'::jsonb,
  emergency_policy TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick business lookup
CREATE INDEX IF NOT EXISTS idx_business_settings_business_id ON business_settings(business_id);

-- ============================================================================
-- LEADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  channel VARCHAR(50) DEFAULT 'sms',
  issue_summary TEXT,
  zip_code VARCHAR(10),
  preferred_time VARCHAR(100),
  urgency VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'new',
  conversation_state VARCHAR(50) DEFAULT 'initial',
  confidence_scores JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb, -- Array of tags: emergency, return_customer, warranty, after_hours, high_priority
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_urgency ON leads(urgency);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_business_phone ON leads(business_id, phone);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN(tags);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL, -- 'customer' or 'ai'
  text TEXT NOT NULL,
  ai_data JSONB, -- Stores booking_intent, collected_data, confidence_scores, internal_notes
  channel VARCHAR(50) DEFAULT 'sms',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for message retrieval
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_lead_created ON messages(lead_id, created_at DESC);

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  business_id VARCHAR(100) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for appointment queries
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON appointments(business_id, scheduled_date);

-- ============================================================================
-- LEAD EVENTS TABLE (Timeline/Activity Log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- created, info_collected, urgency_detected, scheduled, status_updated, note_added, tag_added, tag_removed, field_updated
  event_data JSONB DEFAULT '{}'::jsonb, -- Stores event-specific data (old_value, new_value, field_name, etc.)
  description TEXT, -- Human-readable description of the event
  created_by VARCHAR(50) DEFAULT 'system', -- system, ai, user
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event retrieval
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_created ON lead_events(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON lead_events(event_type);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA (OPTIONAL - for demo/development)
-- ============================================================================

-- Insert default business settings
INSERT INTO business_settings (
  business_id,
  business_name,
  services,
  service_areas,
  pricing,
  hours,
  policies
) VALUES (
  'demo-business-001',
  'Houston Home Services',
  '["Plumbing", "HVAC", "Electrical", "Appliance Repair"]'::jsonb,
  '["77001", "77002", "77003", "77004", "77005"]'::jsonb,
  '{"Trip Fee": "$89", "Hourly Rate": "$120-180/hr"}'::jsonb,
  '{"weekdays": "8am - 6pm", "saturday": "9am - 4pm", "sunday": "Closed"}'::jsonb,
  '{"tripFee": "Standard $89 trip fee, waived if repair booked"}'::jsonb
) ON CONFLICT (business_id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (Optional - recommended for production)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

-- Create policies (example - adjust based on your auth strategy)
-- For now, allow all operations for authenticated users

CREATE POLICY "Allow all for service role" ON business_settings
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON leads
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON messages
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON appointments
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON lead_events
  FOR ALL USING (true);

-- ============================================================================
-- VIEWS (Optional - for easier querying)
-- ============================================================================

-- View for leads with message count and latest message
CREATE OR REPLACE VIEW leads_with_context AS
SELECT 
  l.*,
  COUNT(DISTINCT m.id) as message_count,
  MAX(m.created_at) as last_message_time,
  (
    SELECT text 
    FROM messages 
    WHERE lead_id = l.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as last_message_text,
  (
    SELECT COUNT(*) 
    FROM lead_events 
    WHERE lead_id = l.id
  ) as event_count
FROM leads l
LEFT JOIN messages m ON m.lead_id = l.id
GROUP BY l.id;

-- View for upcoming appointments with lead details
CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT 
  a.*,
  l.phone as customer_phone,
  l.issue_summary,
  l.zip_code,
  l.urgency,
  l.internal_notes as lead_notes
FROM appointments a
JOIN leads l ON l.id = a.lead_id
WHERE a.scheduled_date >= CURRENT_DATE
  AND a.status IN ('pending', 'confirmed')
ORDER BY a.scheduled_date, a.scheduled_time;

-- View for lead timeline with all events
CREATE OR REPLACE VIEW lead_timeline AS
SELECT 
  l.id as lead_id,
  l.phone,
  l.status,
  e.id as event_id,
  e.event_type,
  e.description,
  e.event_data,
  e.created_by,
  e.created_at
FROM leads l
LEFT JOIN lead_events e ON e.lead_id = l.id
ORDER BY l.id, e.created_at DESC;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- Your Desk.ai database is now ready to use.
-- Remember to:
-- 1. Add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file
-- 2. Update your backend code to use the new database layer
-- 3. Test all CRUD operations before deploying to production
-- ============================================================================
