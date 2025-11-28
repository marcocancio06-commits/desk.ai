-- ============================================================================
-- GOOGLE CALENDAR OAUTH MIGRATION
-- ============================================================================
-- Adds tables for OAuth-based Google Calendar sync with conflict detection

-- ============================================================================
-- GOOGLE CALENDAR OAUTH TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id VARCHAR(100) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expiry_date BIGINT NOT NULL, -- Unix timestamp in milliseconds
  scope TEXT NOT NULL,
  calendar_id VARCHAR(255) DEFAULT 'primary',
  connected_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick business lookup
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_business_id 
  ON google_calendar_tokens(business_id);

-- Index for active connections
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_active 
  ON google_calendar_tokens(business_id, is_active);

-- ============================================================================
-- GOOGLE CALENDAR EVENT MAPPING TABLE
-- ============================================================================
-- Maps Desk.ai appointments to Google Calendar events
CREATE TABLE IF NOT EXISTS google_calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  business_id VARCHAR(100) NOT NULL,
  google_event_id VARCHAR(255) NOT NULL,
  calendar_id VARCHAR(255) NOT NULL,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status VARCHAR(50) DEFAULT 'synced', -- synced, pending, error
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event mapping
CREATE INDEX IF NOT EXISTS idx_gcal_events_appointment_id 
  ON google_calendar_events(appointment_id);

CREATE INDEX IF NOT EXISTS idx_gcal_events_google_event_id 
  ON google_calendar_events(google_event_id);

CREATE INDEX IF NOT EXISTS idx_gcal_events_business_id 
  ON google_calendar_events(business_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gcal_events_appointment_unique 
  ON google_calendar_events(appointment_id);

-- ============================================================================
-- GOOGLE CALENDAR CONFLICTS TABLE
-- ============================================================================
-- Stores detected scheduling conflicts
CREATE TABLE IF NOT EXISTS google_calendar_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  business_id VARCHAR(100) NOT NULL,
  conflict_type VARCHAR(50) NOT NULL, -- overlap, double_booking, external_event
  google_event_id VARCHAR(255),
  google_event_summary TEXT,
  google_event_start TIMESTAMPTZ,
  google_event_end TIMESTAMPTZ,
  conflict_severity VARCHAR(50) DEFAULT 'warning', -- warning, error, critical
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conflict queries
CREATE INDEX IF NOT EXISTS idx_gcal_conflicts_appointment_id 
  ON google_calendar_conflicts(appointment_id);

CREATE INDEX IF NOT EXISTS idx_gcal_conflicts_business_id 
  ON google_calendar_conflicts(business_id);

CREATE INDEX IF NOT EXISTS idx_gcal_conflicts_unresolved 
  ON google_calendar_conflicts(business_id, is_resolved) 
  WHERE is_resolved = false;

-- ============================================================================
-- GOOGLE CALENDAR SYNC LOG TABLE
-- ============================================================================
-- Tracks sync operations for debugging and monitoring
CREATE TABLE IF NOT EXISTS google_calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id VARCHAR(100) NOT NULL,
  sync_type VARCHAR(50) NOT NULL, -- full, incremental, push, pull
  sync_direction VARCHAR(20) NOT NULL, -- bidirectional, push, pull
  events_pushed INTEGER DEFAULT 0,
  events_pulled INTEGER DEFAULT 0,
  conflicts_detected INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  sync_status VARCHAR(50) DEFAULT 'success', -- success, partial, failed
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sync log
CREATE INDEX IF NOT EXISTS idx_gcal_sync_log_business_id 
  ON google_calendar_sync_log(business_id);

CREATE INDEX IF NOT EXISTS idx_gcal_sync_log_created_at 
  ON google_calendar_sync_log(created_at DESC);

-- ============================================================================
-- UPDATE APPOINTMENTS TABLE
-- ============================================================================
-- Add Google Calendar sync fields to existing appointments table
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS has_conflict BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Index for Google event lookup
CREATE INDEX IF NOT EXISTS idx_appointments_google_event_id 
  ON appointments(google_event_id) 
  WHERE google_event_id IS NOT NULL;

-- Index for conflicts
CREATE INDEX IF NOT EXISTS idx_appointments_conflicts 
  ON appointments(business_id, has_conflict) 
  WHERE has_conflict = true;

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================================================
CREATE TRIGGER update_google_calendar_tokens_updated_at 
  BEFORE UPDATE ON google_calendar_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_calendar_events_updated_at 
  BEFORE UPDATE ON google_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_calendar_conflicts_updated_at 
  BEFORE UPDATE ON google_calendar_conflicts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now)
CREATE POLICY "Allow all for service role" ON google_calendar_tokens FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON google_calendar_events FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON google_calendar_conflicts FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON google_calendar_sync_log FOR ALL USING (true);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for appointments with conflict information
CREATE OR REPLACE VIEW appointments_with_conflicts AS
SELECT 
  a.*,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', c.id,
          'type', c.conflict_type,
          'severity', c.conflict_severity,
          'google_event_summary', c.google_event_summary,
          'google_event_start', c.google_event_start,
          'google_event_end', c.google_event_end,
          'is_resolved', c.is_resolved
        )
      )
      FROM google_calendar_conflicts c
      WHERE c.appointment_id = a.id 
        AND c.is_resolved = false
    ),
    '[]'::json
  ) as active_conflicts,
  (
    SELECT COUNT(*) 
    FROM google_calendar_conflicts c
    WHERE c.appointment_id = a.id 
      AND c.is_resolved = false
  ) as conflict_count
FROM appointments a;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
