import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import type { EmailAdapter } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { Resend } from 'resend'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Websites } from './collections/Websites'
import { Pages } from './collections/Pages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

const isCLI = process.argv.some((value) => realpath(value)?.endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'

const cloudflare =
  isCLI || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

// Resend email adapter
const resendAdapter: EmailAdapter | undefined = process.env.RESEND_API_KEY
  ? () => {
      const resend = new Resend(process.env.RESEND_API_KEY!)

      return {
        name: 'resend',
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@nodecreek.com',
        defaultFromName: process.env.EMAIL_FROM_NAME || 'Payload CMS',
        sendEmail: async (message) => {
          const from = message.from
            ? typeof message.from === 'string'
              ? message.from
              : `${(message.from as { name?: string; address?: string }).name || process.env.EMAIL_FROM_NAME} <${(message.from as { name?: string; address?: string }).address || process.env.EMAIL_FROM_ADDRESS}>`
            : `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`

          const to = Array.isArray(message.to)
            ? message.to.map((t: string | { address: string }) => (typeof t === 'string' ? t : t.address))
            : typeof message.to === 'string'
              ? [message.to]
              : [(message.to as { address: string }).address]

          return await resend.emails.send({
            from,
            to,
            subject: message.subject || '',
            html: message.html as string || '',
            text: message.text as string,
            replyTo: process.env.EMAIL_REPLY_TO || undefined,
          })
        },
      }
    }
  : undefined

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Websites, Pages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  email: resendAdapter,
  plugins: [
    r2Storage({
      // @ts-expect-error - R2Bucket type mismatch between Cloudflare Workers and Payload
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
  ],
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction,
      } satisfies GetPlatformProxyOptions),
  )
}
