import type { CollectionConfig } from 'payload'

export const Websites: CollectionConfig = {
  slug: 'websites',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'domain', 'status', 'updatedAt'],
    description: 'Manage all websites in the multi-tenant system',
  },
  access: {
    // Only super-admins can manage websites
    read: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super-admin'
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super-admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super-admin'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super-admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for this website (e.g., "Acme Corporation")',
      },
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Primary domain for routing (e.g., "acme.com")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Suspended',
          value: 'suspended',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      admin: {
        description: 'Website status (soft delete capability)',
      },
    },
    {
      name: 'settings',
      type: 'group',
      admin: {
        description: 'Site-specific configuration',
      },
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Website logo',
          },
        },
        {
          name: 'primaryColor',
          type: 'text',
          admin: {
            description: 'Primary brand color (hex code)',
          },
        },
        {
          name: 'secondaryColor',
          type: 'text',
          admin: {
            description: 'Secondary brand color (hex code)',
          },
        },
        {
          name: 'analyticsId',
          type: 'text',
          admin: {
            description: 'Google Analytics or other analytics tracking ID',
          },
        },
      ],
    },
  ],
}
