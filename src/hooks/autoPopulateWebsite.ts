import type { FieldHook } from 'payload'

/**
 * Auto-populate website field from logged-in user's defaultWebsite
 * - On create: Auto-assigns from user's defaultWebsite
 * - Super-admins can manually override
 * - Regular users are forced to their defaultWebsite
 * - On update: Prevents changing website (immutable after creation)
 */
export const autoPopulateWebsite: FieldHook = ({ req, operation, value, originalDoc }) => {
  const { user } = req

  // If no user in context, preserve the provided value
  if (!user) return value

  // On UPDATE: Prevent changing website (immutable after creation)
  if (operation === 'update') {
    // Super-admins can change website if needed
    if (user.role === 'super-admin' && value) {
      return value
    }
    // For everyone else, preserve original website
    return originalDoc?.website || value
  }

  // On CREATE: Auto-assign website
  if (operation === 'create') {
    // If super-admin manually selected a website, use it
    if (user.role === 'super-admin' && value) {
      return value
    }

    // Otherwise, use user's defaultWebsite
    return user.defaultWebsite || value
  }

  return value
}
