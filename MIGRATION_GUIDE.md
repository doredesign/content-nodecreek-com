# Multi-Tenant Migration Guide

This guide walks through the **expand-migrate-contract** pattern for safely migrating to multi-tenant architecture in both development and production.

## Overview

The migration happens in 3 phases:

1. **EXPAND**: Deploy code that supports both old (without tenant fields) and new (with tenant fields) data
2. **MIGRATE**: Run data migration to populate tenant fields for existing data
3. **CONTRACT**: Deploy code that requires tenant fields (remove optional flags)

---

## Phase 1: EXPAND ✅ (COMPLETED)

**Goal**: Make new fields optional so existing data continues to work

**What was done**:
- Made `role`, `websites`, `defaultWebsite` optional in Users collection
- Made `website` optional in Media and Pages collections
- Updated access control to allow users without these fields (temporary)

**Current state**: Code supports both migrated and unmigrated data

---

## Phase 2: MIGRATE (YOU ARE HERE)

**Goal**: Populate tenant fields for all existing data

### Development Environment

1. **Start dev server** to sync schema:
   ```bash
   pnpm dev
   ```

   Answer `y` to push schema changes (safe now since fields are optional)

2. **Run data migration** (in a new terminal):
   ```bash
   pnpm migrate:multitenant
   ```

   This script will:
   - Create a default website (or use existing one)
   - Assign all users to that website
   - Set roles (first user = super-admin, others = website-admin)
   - Assign all media to that website

3. **Verify in admin UI**:
   - Log into http://localhost:3000/admin
   - Check that users have websites and roles assigned
   - Check that media has website assigned
   - Create a test page to verify multi-tenant works

### Production Environment

**IMPORTANT**: Run this BEFORE deploying contract phase code

1. **Ensure EXPAND code is deployed** (optional fields)

2. **Set PRIMARY_DOMAIN environment variable**:
   ```bash
   export PRIMARY_DOMAIN=yourdomain.com
   ```

3. **Run migration against production**:
   ```bash
   export NODE_ENV=production
   export CLOUDFLARE_ENV=production
   pnpm migrate:multitenant
   ```

4. **Verify in production admin UI** before proceeding to contract phase

---

## Phase 3: CONTRACT (AFTER MIGRATION)

**Goal**: Make fields required, enforce tenant isolation strictly

### When to run this

Only after Phase 2 (MIGRATE) is complete and verified in production.

### Steps

1. **Revert fields to required**:

   Edit these files and change `required: false` back to `required: true`:
   - `src/collections/Users.ts` - role, websites, defaultWebsite
   - `src/collections/Media.ts` - website
   - `src/collections/Pages.ts` - website

2. **Remove temporary access control**:

   Edit `src/access/tenantScoped.ts` and remove these lines:
   ```typescript
   // EXPAND: During migration, users without websites can see all content (temporary)
   if (!user.websites || user.websites.length === 0) return true
   ```

   And similar lines in `tenantScopedUpdate` and `tenantScopedDelete`

3. **Regenerate types**:
   ```bash
   pnpm payload generate:types
   ```

4. **Test locally**:
   ```bash
   pnpm dev
   ```

5. **Deploy to production**:
   ```bash
   # Your normal deployment process
   pnpm run deploy
   ```

---

## Rollback Plan

If something goes wrong during MIGRATE phase:

### Development
1. Stop dev server
2. Restore database backup (if you made one)
3. Or: Delete `.wrangler` directory and restart fresh

### Production
1. Do NOT deploy CONTRACT phase
2. Keep EXPAND phase deployed (everything still works)
3. Fix data migration script
4. Re-run migration
5. Only deploy CONTRACT after verifying migration

---

## Verification Checklist

After each phase:

### After EXPAND
- [ ] Code compiles without errors
- [ ] Existing users can still log in
- [ ] Existing data is still accessible

### After MIGRATE
- [ ] All users have `websites`, `defaultWebsite`, and `role` populated
- [ ] All media items have `website` populated
- [ ] Super-admin can see all websites
- [ ] Regular users can access their assigned website
- [ ] Can create new pages with auto-populated website

### After CONTRACT
- [ ] TypeScript types are correct (required fields)
- [ ] Cannot create users without tenant fields
- [ ] Cannot create pages without tenant fields
- [ ] Tenant isolation is enforced (users only see their website's data)

---

## Timeline Recommendation

- **Development**: All phases in one session (minutes)
- **Production**:
  - EXPAND: Deploy, wait 24-48 hours
  - MIGRATE: Run during low-traffic window, verify thoroughly
  - CONTRACT: Deploy 24-48 hours after MIGRATE (after verification)

---

## Troubleshooting

### "Property 'role' does not exist on type 'User'"
- Run `pnpm payload generate:types` to regenerate TypeScript types

### "table already exists" error during dev mode
- This is expected if you've run dev mode before
- Answer `y` to push schema changes (safe during EXPAND phase)

### Data migration fails
- Check the error message
- Verify website was created
- Try running migration again (it skips already-migrated items)

### Users can't see data after migration
- Check that users have `websites` array populated
- Check that content has `website` field populated
- Verify access control functions are working

---

## Questions?

Refer to the main implementation plan or check the code comments for details.
