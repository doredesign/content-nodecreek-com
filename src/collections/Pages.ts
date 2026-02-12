import type { CollectionConfig } from 'payload'
import {
  tenantScopedRead,
  tenantScopedCreate,
  tenantScopedUpdate,
  tenantScopedDelete,
} from '../access/tenantScoped'
import { autoPopulateWebsite } from '../hooks/autoPopulateWebsite'
import { Hero } from '../blocks/Hero'
import { Content } from '../blocks/Content'
import { ImageGallery } from '../blocks/ImageGallery'
import { CallToAction } from '../blocks/CallToAction'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'website', 'updatedAt'],
    description: 'Manage website pages with flexible content blocks',
  },
  access: {
    read: tenantScopedRead,
    create: tenantScopedCreate,
    update: tenantScopedUpdate,
    delete: tenantScopedDelete,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Page title',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'URL slug for this page',
      },
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
        description: 'Website this page belongs to',
        condition: (data, siblingData, { user }) => {
          // Only show for super-admins
          return user?.role === 'super-admin'
        },
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [Hero, Content, ImageGallery, CallToAction],
      admin: {
        description: 'Build your page using flexible content blocks',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      admin: {
        description: 'SEO meta description',
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: {
        description: 'Publication date',
        position: 'sidebar',
      },
    },
  ],
}
