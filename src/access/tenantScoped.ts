import type { Access } from 'payload'

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

  // Regular users can only see content from their assigned websites
  return {
    website: {
      in: user.websites,
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

  // Website-admins and editors can update content from their websites
  if (user.role === 'website-admin' || user.role === 'editor') {
    return {
      website: {
        in: user.websites,
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

  // Website-admins can delete content from their websites
  if (user.role === 'website-admin') {
    return {
      website: {
        in: user.websites,
      },
    }
  }

  // Editors and viewers cannot delete
  return false
}
