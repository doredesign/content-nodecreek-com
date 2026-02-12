import type { Block } from 'payload'

export const ImageGallery: Block = {
  slug: 'imageGallery',
  labels: {
    singular: 'Image Gallery',
    plural: 'Image Galleries',
  },
  fields: [
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          admin: {
            description: 'Optional image caption',
          },
        },
      ],
    },
    {
      name: 'columns',
      type: 'number',
      required: true,
      defaultValue: 3,
      min: 1,
      max: 6,
      admin: {
        description: 'Number of columns in the gallery (1-6)',
      },
    },
  ],
}
