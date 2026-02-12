import type { Access } from 'payload'

/**
 * Helper function to extract website IDs from user.websites array
 * Handles both populated objects and ID strings
 */
function extractWebsiteIds(websites: any[]): string[] {
  return websites.map((website) => {
    // Handle populated objects
    if (typeof website === 'object' && website !== null) {
      return website.id || website._id || website
    }
    // Handle ID strings
    return website
  }).filter(Boolean)
}

/**
 * Read access: Super-admins see all content, others see content from their accessible websites
 */
export const tenantScopedRead: Access = ({ req: { user } }) => {
  // Unauthenticated users cannot read
  if (!user) return false

  // Super-admins can see everything
  if (user.role === 'super-admin') return true

  // EXPAND: During migration, users without websites can see all content (temporary)
  if (!user.websites || user.websites.length === 0) return true

  // Extract website IDs (handles both populated objects and ID strings)
  const websiteIds = extractWebsiteIds(user.websites)

  // Regular users can only see content from their assigned websites
  return {
    website: {
      in: websiteIds,
    },
  }
}

/**
 * Create access: Admins and editors can create content
 */
export const tenantScopedCreate: Access = ({ req: { user } }) => {
  if (!user) return false

  // Super-admins, website-admins, and editors can create
  if (
    user.role === 'super-admin' ||
    user.role === 'website-admin' ||
    user.role === 'editor'
  ) {
    return true
  }

  // Viewers cannot create
  return false
}

/**
 * Update access: Admins and editors can update content from their accessible websites
 */
export const tenantScopedUpdate: Access = ({ req: { user } }) => {
  if (!user) return false

  // Super-admins can update anything
  if (user.role === 'super-admin') return true

  // EXPAND: During migration, users without role/websites can update (temporary)
  if (!user.role || !user.websites || user.websites.length === 0) return true

  // Extract website IDs
  const websiteIds = extractWebsiteIds(user.websites)

  // Website-admins and editors can update content from their websites
  if (user.role === 'website-admin' || user.role === 'editor') {
    return {
      website: {
        in: websiteIds,
      },
    }
  }

  // Viewers cannot update
  return false
}

/**
 * Delete access: Only admins can delete
 */
export const tenantScopedDelete: Access = ({ req: { user } }) => {
  if (!user) return false

  // Super-admins can delete anything
  if (user.role === 'super-admin') return true

  // EXPAND: During migration, users without role/websites can delete (temporary)
  if (!user.role || !user.websites || user.websites.length === 0) return true

  // Extract website IDs
  const websiteIds = extractWebsiteIds(user.websites)

  // Website-admins can delete content from their websites
  if (user.role === 'website-admin') {
    return {
      website: {
        in: websiteIds,
      },
    }
  }

  // Editors and viewers cannot delete
  return false
}
