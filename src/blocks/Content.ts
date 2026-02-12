import type { Block } from 'payload'

export const Content: Block = {
  slug: 'content',
  labels: {
    singular: 'Content Block',
    plural: 'Content Blocks',
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'Rich text content',
      },
    },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'normal',
      options: [
        {
          label: 'Narrow',
          value: 'narrow',
        },
        {
          label: 'Normal',
          value: 'normal',
        },
        {
          label: 'Wide',
          value: 'wide',
        },
        {
          label: 'Full Width',
          value: 'full',
        },
      ],
      admin: {
        description: 'Content width on the page',
      },
    },
  ],
}
