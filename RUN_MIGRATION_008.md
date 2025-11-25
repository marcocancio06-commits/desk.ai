# Database Migration 008 - Marketplace Fields

## Prerequisites
- Supabase project dashboard access
- SQL Editor permissions

## Steps to Run Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   - Open file: `frontdesk-backend/migrations/008_add_marketplace_fields.sql`
   - Copy the entire contents

4. **Execute Migration**
   - Paste the SQL into the query editor
   - Click "Run" button
   - Wait for success confirmation

5. **Verify**
   - Run this query to confirm:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'businesses' 
   AND column_name IN ('is_public', 'tagline', 'short_description');
   ```
   - Should return 3 rows

### Option 2: Supabase CLI

```bash
cd /Users/marco/Desktop/agency-mvp

# If you have Supabase CLI installed
supabase db execute --file frontdesk-backend/migrations/008_add_marketplace_fields.sql
```

## Migration Contents

The migration adds these columns to `businesses` table:
- `is_public` (BOOLEAN) - Controls marketplace visibility
- `short_description` (TEXT) - Business description for marketplace (max 200 chars)
- `tagline` (TEXT) - Short tagline (max 60 chars)

Plus an index for efficient marketplace queries:
- `idx_businesses_is_public` on `is_public` WHERE `is_public = true`

## Safety Notes

✅ **Safe to run**:
- Uses `ADD COLUMN IF NOT EXISTS` - won't break if already exists
- Existing businesses will have `is_public = false` (private by default)
- No data loss risk

⚠️ **After migration**:
- All existing businesses remain private
- Owners must opt-in via dashboard settings (when implemented)
- Or enable during onboarding for new businesses

## Rollback (if needed)

If you need to undo this migration:

```sql
-- Remove marketplace fields
ALTER TABLE businesses 
  DROP COLUMN IF EXISTS is_public,
  DROP COLUMN IF EXISTS short_description,
  DROP COLUMN IF EXISTS tagline;

-- Remove index
DROP INDEX IF EXISTS idx_businesses_is_public;
```

## Next Steps

After successful migration:
1. ✅ Test onboarding flow with marketplace fields
2. ✅ Create a test business with `is_public = true`
3. ✅ Verify marketplace filtering works
4. ✅ Build public business pages

---

**Status**: Ready to run  
**Risk Level**: Low (safe, reversible)  
**Estimated Time**: < 1 minute
