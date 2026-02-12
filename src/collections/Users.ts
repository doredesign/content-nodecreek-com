import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'websites', 'updatedAt'],
  },
  auth: true,
  access: {
    // Super-admins see all users; others see users who share at least one website
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin') return true

      // Users can see other users who share at least one website
      return {
        websites: {
          in: user.websites || [],
        },
      }
    },
    // Only super-admins and website-admins can create users
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super-admin' || user.role === 'website-admin'
    },
    // Website-admins can update users from their websites
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin') return true

      if (user.role === 'website-admin') {
        return {
          websites: {
            in: user.websites || [],
          },
        }
      }

      return false
    },
    // Only super-admins can delete users
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super-admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Ensure defaultWebsite is in the websites array
        if (data.websites && data.websites.length > 0 && data.defaultWebsite) {
          const websiteIds = data.websites.map((w: any) =>
            typeof w === 'string' ? w : (w?.id || w)
          )

          const defaultWebsiteId =
            typeof data.defaultWebsite === 'string'
              ? data.defaultWebsite
              : (data.defaultWebsite?.id || data.defaultWebsite)

          if (!websiteIds.includes(defaultWebsiteId)) {
            throw new Error('Default website must be one of the assigned websites')
          }
        }

        // On create, if only one website is assigned, auto-set it as default
        if (operation === 'create' && data.websites && data.websites.length === 1 && !data.defaultWebsite) {
          data.defaultWebsite = data.websites[0]
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: false, // EXPAND: Optional during migration
      defaultValue: 'viewer',
      options: [
        {
          label: 'Super Admin',
          value: 'super-admin',
        },
        {
          label: 'Website Admin',
          value: 'website-admin',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
        {
          label: 'Viewer',
          value: 'viewer',
        },
      ],
      admin: {
        description: 'User role determines their permissions across the platform',
        position: 'sidebar',
      },
      access: {
        // Only super-admins can assign super-admin role
        update: ({ req: { user } }) => {
          if (!user) return false
          return user.role === 'super-admin'
        },
      },
    },
    {
      name: 'websites',
      type: 'relationship',
      relationTo: 'websites',
      required: false, // EXPAND: Optional during migration
      hasMany: true,
      admin: {
        description: 'Websites this user can access',
        position: 'sidebar',
      },
    },
    {
      name: 'defaultWebsite',
      type: 'relationship',
      relationTo: 'websites',
      required: false, // EXPAND: Optional during migration
      admin: {
        description: 'Primary website for this user (used when creating content)',
        position: 'sidebar',
      },
    },
  ],
}
