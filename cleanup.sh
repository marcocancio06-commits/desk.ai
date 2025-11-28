#!/bin/bash
# =============================================================================
# CLEANUP SCRIPT FOR DESK.AI SINGLE-TENANT DEMO
# =============================================================================
# WARNING: Review carefully before running. This script deletes files.
# Run with: bash cleanup.sh
# Or dry-run with: bash cleanup.sh --dry-run
# =============================================================================

set -e

DRY_RUN=false
if [ "$1" == "--dry-run" ]; then
    DRY_RUN=true
    echo "🔍 DRY RUN MODE - No files will be deleted"
    echo ""
fi

DELETED_COUNT=0
DELETED_SIZE=0

delete_file() {
    local file="$1"
    if [ -f "$file" ]; then
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
        if [ "$DRY_RUN" == true ]; then
            echo "  Would delete: $file ($size bytes)"
        else
            rm -f "$file"
            echo "  ✓ Deleted: $file"
        fi
        DELETED_COUNT=$((DELETED_COUNT + 1))
        DELETED_SIZE=$((DELETED_SIZE + size))
    fi
}

echo "=============================================="
echo "DESK.AI CLEANUP SCRIPT"
echo "=============================================="
echo ""

# =============================================================================
# TASK 1: Delete root-level documentation/planning .md files
# =============================================================================
echo "📄 Removing planning/documentation markdown files..."

# Keep: README.md
# Delete: All other .md files (77 files identified)

delete_file "AI_IMPROVEMENTS.md"
delete_file "API_SECURITY_REFERENCE.md"
delete_file "APPOINTMENTS_SYSTEM.md"
delete_file "AUTH_EMERGENCY_SIMPLIFICATION_FINAL.md"
delete_file "AUTH_SETUP.md"
delete_file "AUTH_SIMPLIFICATION_COMPLETE.md"
delete_file "AUTH_SIMPLIFICATION_STATUS.md"
delete_file "AUTH_TEST_SUMMARY.md"
delete_file "BUG_REPORTING.md"
delete_file "BUGFIX_SUMMARY.md"
delete_file "BUSINESS_TRAINING.md"
delete_file "CHAT_UX_POLISH.md"
delete_file "COMMIT_SUMMARY.md"
delete_file "DASHBOARD_INTEGRATION.md"
delete_file "DASHBOARD_SPINNER_FIX.md"
delete_file "DEBUGGING_SUMMARY.md"
delete_file "DEMO_DATA.md"
delete_file "DEPLOYMENT_GUIDE.md"
delete_file "DEV_GUIDE.md"
delete_file "EMAIL_CONFIRMATION_FIX_SUMMARY.md"
delete_file "EMAIL_CONFIRMATION_TESTING.md"
delete_file "FLOWS_QUICK_REF.md"
delete_file "GOOGLE_CALENDAR_SETUP.md"
delete_file "LANDING_PAGE_CTA_CLEANUP.md"
delete_file "LEAD_DETAIL_PANEL.md"
delete_file "LEAD_UPDATE_API.md"
delete_file "LOCAL_SETUP_VERIFIED.md"
delete_file "MARKETPLACE_DISABLE_SUMMARY.md"
delete_file "MARKETPLACE_IMPLEMENTATION.md"
delete_file "MARKETPLACE_IMPLEMENTATION_OLD.md"
delete_file "MARKETPLACE_SETUP.md"
delete_file "MARKETPLACE_SETUP_GUIDE.md"
delete_file "MOBILE_POLISH.md"
delete_file "NAVIGATION_FLOWS.md"
delete_file "NO_BUSINESS_STATE_FIX.md"
delete_file "ONBOARDING_COMMIT_SUMMARY.md"
delete_file "ONBOARDING_IMPLEMENTATION.md"
delete_file "ONBOARDING_TESTING_GUIDE.md"
delete_file "ONBOARDING_WIZARD_IMPLEMENTATION.md"
delete_file "OWNER_DASHBOARD_AUTH.md"
delete_file "OWNER_FLOW_POLISH.md"
delete_file "PRODUCTION_POLISH_SUMMARY.md"
delete_file "PRODUCTION_SAAS_TRANSFORMATION.md"
delete_file "PROFILES_AUTH_FIX.md"
delete_file "PROMPT_6_IMPLEMENTATION.md"
delete_file "PROMPT_8_IMPLEMENTATION.md"
delete_file "PUBLIC_PAGE_POLISH.md"
delete_file "PUBLIC_PAGES_COMMIT_SUMMARY.md"
delete_file "PUBLIC_PAGES_TESTING_GUIDE.md"
delete_file "QUICK_REFERENCE.md"
delete_file "QUICK_START_ROLE_AUTH.md"
delete_file "QUICK_TEST_COMMANDS.md"
delete_file "QUICK_TESTING_GUIDE.md"
delete_file "RELIABILITY_SETUP.md"
delete_file "ROLE_AUTH_IMPLEMENTATION_SUMMARY.md"
delete_file "ROLE_AUTH_TESTING_GUIDE.md"
delete_file "ROLE_BASED_AUTH_IMPLEMENTATION.md"
delete_file "RUN_MIGRATION_008.md"
delete_file "SECURITY_IMPLEMENTATION_SUMMARY.md"
delete_file "SECURITY_TESTING_GUIDE.md"
delete_file "STEP5_AUTHENTICATION_SUMMARY.md"
delete_file "STEP6_MULTI_BUSINESS_SUMMARY.md"
delete_file "SUMMARY_API.md"
delete_file "SUMMARY_IMPLEMENTATION.md"
delete_file "SUPABASE_CONFIGURATION_SUMMARY.md"
delete_file "SUPABASE_QUICK_REFERENCE.md"
delete_file "SUPABASE_TESTING_CHECKLIST.md"
delete_file "TEAM_MANAGEMENT_IMPLEMENTATION.md"
delete_file "TEAM_MANAGEMENT_TESTING.md"
delete_file "TESTING.md"
delete_file "TESTING_AUTHENTICATION.md"
delete_file "TESTING_CHECKLIST.md"
delete_file "TESTING_MULTI_BUSINESS.md"
delete_file "TESTING_ONBOARDING_MARKETPLACE.md"
delete_file "TESTING_PUBLIC_URLS.md"
delete_file "TRAINING_HOOK_MAP.md"
delete_file "TWILIO_SETUP_GUIDE.md"

echo ""

# =============================================================================
# TASK 2: Delete obsolete shell scripts (plumbing demo specific)
# =============================================================================
echo "🔧 Removing obsolete shell scripts..."

delete_file "add-followups.sh"
delete_file "check-status.sh"
delete_file "seed-demo-data.sh"
delete_file "start-dev.sh"

echo ""

# =============================================================================
# TASK 3: Delete SQL files (database already set up)
# =============================================================================
echo "🗄️ Removing SQL setup files..."

delete_file "DATABASE_SCHEMA.sql"
delete_file "PROFILES_TABLE_SETUP.sql"
delete_file "SEED_MARKETPLACE.sql"
delete_file "SETUP_MARKETPLACE.sql"
delete_file "SUPABASE_ROLE_MIGRATION.sql"

echo ""

# =============================================================================
# TASK 4: Clean npm caches and prune dependencies
# =============================================================================
echo "📦 Cleaning npm caches and pruning dependencies..."

if [ "$DRY_RUN" == false ]; then
    echo "  Running npm prune in frontend..."
    cd frontend && npm prune --production=false 2>/dev/null || true
    cd ..
    
    echo "  Running npm prune in backend..."
    cd frontdesk-backend && npm prune 2>/dev/null || true
    cd ..
    
    echo "  Cleaning Next.js cache..."
    rm -rf frontend/.next/cache 2>/dev/null || true
else
    echo "  Would run: npm prune in frontend/"
    echo "  Would run: npm prune in frontdesk-backend/"
    echo "  Would delete: frontend/.next/cache/"
fi

echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo "=============================================="
echo "CLEANUP SUMMARY"
echo "=============================================="
echo "Files processed: $DELETED_COUNT"
if [ "$DRY_RUN" == true ]; then
    echo "Mode: DRY RUN (no files deleted)"
    echo ""
    echo "To execute cleanup, run without --dry-run flag:"
    echo "  bash cleanup.sh"
else
    echo "Mode: EXECUTED"
    echo "✅ Cleanup complete!"
fi
echo "=============================================="
