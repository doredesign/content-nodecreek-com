import type { CollectionConfig } from 'payload'
import {
  tenantScopedRead,
  tenantScopedCreate,
  tenantScopedUpdate,
  tenantScopedDelete,
} from '../access/tenantScoped'
import { autoPopulateWebsite } from '../hooks/autoPopulateWebsite'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: tenantScopedRead,
    create: tenantScopedCreate,
    update: tenantScopedUpdate,
    delete: tenantScopedDelete,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'website',
      type: 'relationship',
      relationTo: 'websites',
      required: false, // EXPAND: Optional during migration
      index: true,
      hooks: {
        beforeChange: [autoPopulateWebsite],
      },
      admin: {
        position: 'sidebar',
        description: 'Website this media belongs to',
        condition: (data, siblingData, { user }) => {
          // Only show for super-admins
          return user?.role === 'super-admin'
        },
      },
    },
  ],
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
  },
}
