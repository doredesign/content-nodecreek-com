/**
 * Data migration script for multi-tenant setup
 *
 * This is Phase 2 (MIGRATE) of the expand-migrate-contract flow.
 *
 * Run this after:
 * 1. Deploying the EXPAND phase code (optional fields)
 * 2. Running `pnpm dev` to sync the schema
 *
 * This script will:
 * - Create a default website if none exists
 * - Assign all existing users to that website
 * - Set defaultWebsite and role for all users
 * - Assign all existing media to that website
 */

// Load environment variables from .env.local
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Fallback to .env if .env.local doesn't exist
dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function migrateToMultiTenant() {
  console.log('Starting multi-tenant data migration...\n')

  // Verify required environment variables
  if (!process.env.PAYLOAD_SECRET) {
    console.error('❌ Error: PAYLOAD_SECRET environment variable is not set')
    console.error('   Please check your .env.local file')
    process.exit(1)
  }

  console.log('✓ Environment variables loaded')
  console.log(`  PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '***set***' : 'NOT SET'}`)
  console.log(`  PRIMARY_DOMAIN: ${process.env.PRIMARY_DOMAIN || 'not set (will use "example.com")'}\n`)

  // Dynamically import config after env vars are loaded
  const { default: config } = await import('../src/payload.config.js')
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    // Step 1: Check if a website already exists
    const existingWebsites = await payload.find({
      collection: 'websites',
      limit: 1,
    })

    let defaultWebsite

    if (existingWebsites.docs.length > 0) {
      defaultWebsite = existingWebsites.docs[0]
      console.log(`✓ Found existing website: "${defaultWebsite.name}" (${defaultWebsite.id})`)
    } else {
      // Create a default website
      console.log('Creating default website...')
      defaultWebsite = await payload.create({
        collection: 'websites',
        data: {
          name: 'Primary Website',
          domain: process.env.PRIMARY_DOMAIN || 'example.com',
          slug: 'primary',
          status: 'active',
        },
      })
      console.log(`✓ Created default website: "${defaultWebsite.name}" (${defaultWebsite.id})`)
    }

    // Step 2: Migrate all users
    console.log('\nMigrating users...')
    const users = await payload.find({
      collection: 'users',
      limit: 1000,
    })

    let userCount = 0
    for (const user of users.docs) {
      // Skip if already migrated
      if (user.websites && user.websites.length > 0 && user.defaultWebsite && user.role) {
        console.log(`  - Skipping ${user.email} (already migrated)`)
        continue
      }

      // Determine role: first user becomes super-admin, others become website-admin
      const role = userCount === 0 ? 'super-admin' : 'website-admin'

      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          websites: [defaultWebsite.id],
          defaultWebsite: defaultWebsite.id,
          role: role,
        },
      })

      console.log(`  ✓ Updated ${user.email} (role: ${role})`)
      userCount++
    }

    console.log(`\n✓ Migrated ${userCount} user(s)`)

    // Step 3: Migrate all media
    console.log('\nMigrating media...')
    const media = await payload.find({
      collection: 'media',
      limit: 1000,
    })

    let mediaCount = 0
    for (const item of media.docs) {
      // Skip if already migrated
      if (item.website) {
        console.log(`  - Skipping media ${item.id} (already migrated)`)
        continue
      }

      await payload.update({
        collection: 'media',
        id: item.id,
        data: {
          website: defaultWebsite.id,
        },
      })

      mediaCount++
    }

    console.log(`✓ Migrated ${mediaCount} media item(s)`)

    // Step 4: Summary
    console.log('\n' + '='.repeat(50))
    console.log('Migration completed successfully!')
    console.log('='.repeat(50))
    console.log(`Website: ${defaultWebsite.name} (${defaultWebsite.domain})`)
    console.log(`Users migrated: ${userCount}`)
    console.log(`Media migrated: ${mediaCount}`)
    console.log('\nNext steps:')
    console.log('1. Verify everything works in the admin UI')
    console.log('2. Deploy the CONTRACT phase (make fields required again)')
    console.log('3. Run this script in production before deploying CONTRACT')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

migrateToMultiTenant()
