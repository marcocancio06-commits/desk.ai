-- Add team_invites table for placeholder invites
-- When owner invites email that doesn't have Supabase account yet

CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(business_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_invites_business ON team_invites(business_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_expires ON team_invites(expires_at);

COMMENT ON TABLE team_invites IS 'Pending invitations for users who do not yet have accounts';
COMMENT ON COLUMN team_invites.email IS 'Email address of invited user (not yet signed up)';
COMMENT ON COLUMN team_invites.expires_at IS 'Invitation expiration (7 days from creation)';

-- RLS Policies for team_invites
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Owners can view invites for their business
CREATE POLICY "Owners can view team invites for their business"
  ON team_invites FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can create invites for their business
CREATE POLICY "Owners can create team invites"
  ON team_invites FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can delete invites for their business
CREATE POLICY "Owners can delete team invites"
  ON team_invites FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM business_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Update business_users table to ensure role column exists with proper constraints
ALTER TABLE business_users 
  DROP CONSTRAINT IF EXISTS business_users_role_check;

ALTER TABLE business_users 
  ADD CONSTRAINT business_users_role_check 
  CHECK (role IN ('owner', 'staff'));

COMMENT ON COLUMN business_users.role IS 'User role within business: owner (full access) or staff (limited access)';
