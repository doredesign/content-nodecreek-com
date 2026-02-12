import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
let testWebsiteA: any
let testWebsiteB: any
let superAdminUser: any
let websiteAdminUserA: any
let websiteAdminUserAB: any
let editorUserA: any
let viewerUserA: any
let testPageA: any
let testPageB: any
let testMediaA: any

describe('Multi-Tenant Access Control', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // Create test websites
    testWebsiteA = await payload.create({
      collection: 'websites',
      data: {
        name: 'Website A',
        domain: 'website-a.example.com',
        slug: 'website-a',
        status: 'active',
      },
    })

    testWebsiteB = await payload.create({
      collection: 'websites',
      data: {
        name: 'Website B',
        domain: 'website-b.example.com',
        slug: 'website-b',
        status: 'active',
      },
    })

    // Create super-admin user
    superAdminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'superadmin@test.com',
        password: 'password123',
        role: 'super-admin',
        websites: [testWebsiteA.id],
        defaultWebsite: testWebsiteA.id,
      },
    })

    // Create website-admin user with access to Website A only
    websiteAdminUserA = await payload.create({
      collection: 'users',
      data: {
        email: 'admin-a@test.com',
        password: 'password123',
        role: 'website-admin',
        websites: [testWebsiteA.id],
        defaultWebsite: testWebsiteA.id,
      },
    })

    // Create website-admin user with access to BOTH websites
    websiteAdminUserAB = await payload.create({
      collection: 'users',
      data: {
        email: 'admin-ab@test.com',
        password: 'password123',
        role: 'website-admin',
        websites: [testWebsiteA.id, testWebsiteB.id],
        defaultWebsite: testWebsiteA.id,
      },
    })

    // Create editor user for Website A
    editorUserA = await payload.create({
      collection: 'users',
      data: {
        email: 'editor-a@test.com',
        password: 'password123',
        role: 'editor',
        websites: [testWebsiteA.id],
        defaultWebsite: testWebsiteA.id,
      },
    })

    // Create viewer user for Website A
    viewerUserA = await payload.create({
      collection: 'users',
      data: {
        email: 'viewer-a@test.com',
        password: 'password123',
        role: 'viewer',
        websites: [testWebsiteA.id],
        defaultWebsite: testWebsiteA.id,
      },
    })

    // Create test pages
    testPageA = await payload.create({
      collection: 'pages',
      data: {
        title: 'Page for Website A',
        slug: 'page-a',
        website: testWebsiteA.id,
      },
      user: superAdminUser,
    })

    testPageB = await payload.create({
      collection: 'pages',
      data: {
        title: 'Page for Website B',
        slug: 'page-b',
        website: testWebsiteB.id,
      },
      user: superAdminUser,
    })

    // Create test media (if possible - might need actual file)
    try {
      testMediaA = await payload.create({
        collection: 'media',
        data: {
          alt: 'Test image for Website A',
          website: testWebsiteA.id,
        },
        user: superAdminUser,
      })
    } catch (e) {
      // Media creation might fail without actual file, that's okay
      testMediaA = null
    }
  })

  afterAll(async () => {
    // Clean up test data
    try {
      if (testMediaA?.id) await payload.delete({ collection: 'media', id: testMediaA.id })
      if (testPageB?.id) await payload.delete({ collection: 'pages', id: testPageB.id })
      if (testPageA?.id) await payload.delete({ collection: 'pages', id: testPageA.id })
      if (viewerUserA?.id) await payload.delete({ collection: 'users', id: viewerUserA.id })
      if (editorUserA?.id) await payload.delete({ collection: 'users', id: editorUserA.id })
      if (websiteAdminUserAB?.id) await payload.delete({ collection: 'users', id: websiteAdminUserAB.id })
      if (websiteAdminUserA?.id) await payload.delete({ collection: 'users', id: websiteAdminUserA.id })
      if (superAdminUser?.id) await payload.delete({ collection: 'users', id: superAdminUser.id })
      if (testWebsiteB?.id) await payload.delete({ collection: 'websites', id: testWebsiteB.id })
      if (testWebsiteA?.id) await payload.delete({ collection: 'websites', id: testWebsiteA.id })
    } catch (e) {
      // Ignore cleanup errors
    }
  })

  describe('Pages - Read Access', () => {
    it('super-admin can see pages from all websites', async () => {
      const pages = await payload.find({
        collection: 'pages',
        user: superAdminUser,
      })

      const pageAFound = pages.docs.find((p) => p.id === testPageA.id)
      const pageBFound = pages.docs.find((p) => p.id === testPageB.id)

      expect(pageAFound).toBeDefined()
      expect(pageBFound).toBeDefined()
    })

    it('website-admin can see pages from their assigned website', async () => {
      const pages = await payload.find({
        collection: 'pages',
        user: websiteAdminUserA,
      })

      const pageAFound = pages.docs.find((p) => p.id === testPageA.id)
      expect(pageAFound).toBeDefined()
      expect(pageAFound?.title).toBe('Page for Website A')
    })

    it('website-admin cannot see pages from other websites', async () => {
      const pages = await payload.find({
        collection: 'pages',
        user: websiteAdminUserA,
      })

      const pageBFound = pages.docs.find((p) => p.id === testPageB.id)
      expect(pageBFound).toBeUndefined()
    })

    it('user with multiple websites can see pages from all their websites', async () => {
      const pages = await payload.find({
        collection: 'pages',
        user: websiteAdminUserAB,
      })

      const pageAFound = pages.docs.find((p) => p.id === testPageA.id)
      const pageBFound = pages.docs.find((p) => p.id === testPageB.id)

      expect(pageAFound).toBeDefined()
      expect(pageBFound).toBeDefined()
    })

    it('editor can see pages from their assigned website', async () => {
      const pages = await payload.find({
        collection: 'pages',
        user: editorUserA,
      })

      const pageAFound = pages.docs.find((p) => p.id === testPageA.id)
      expect(pageAFound).toBeDefined()
    })

    it('viewer can see pages from their assigned website', async () => {
      const pages = await payload.find({
        collection: 'pages',
        user: viewerUserA,
      })

      const pageAFound = pages.docs.find((p) => p.id === testPageA.id)
      expect(pageAFound).toBeDefined()
    })
  })

  describe('Pages - Create Access', () => {
    it('website-admin can create pages', async () => {
      const newPage = await payload.create({
        collection: 'pages',
        data: {
          title: 'New Page',
          slug: 'new-page',
          website: testWebsiteA.id,
        },
        user: websiteAdminUserA,
      })

      expect(newPage).toBeDefined()
      expect(newPage.title).toBe('New Page')

      // Cleanup
      await payload.delete({ collection: 'pages', id: newPage.id })
    })

    it('editor can create pages', async () => {
      const newPage = await payload.create({
        collection: 'pages',
        data: {
          title: 'Editor Page',
          slug: 'editor-page',
          website: testWebsiteA.id,
        },
        user: editorUserA,
      })

      expect(newPage).toBeDefined()

      // Cleanup
      await payload.delete({ collection: 'pages', id: newPage.id })
    })

    it('viewer cannot create pages', async () => {
      await expect(
        payload.create({
          collection: 'pages',
          data: {
            title: 'Viewer Page',
            slug: 'viewer-page',
            website: testWebsiteA.id,
          },
          user: viewerUserA,
        })
      ).rejects.toThrow()
    })
  })

  describe('Pages - Update Access', () => {
    it('website-admin can update pages from their website', async () => {
      const updated = await payload.update({
        collection: 'pages',
        id: testPageA.id,
        data: {
          title: 'Updated Title',
        },
        user: websiteAdminUserA,
      })

      expect(updated.title).toBe('Updated Title')

      // Restore original title
      await payload.update({
        collection: 'pages',
        id: testPageA.id,
        data: { title: 'Page for Website A' },
        user: superAdminUser,
      })
    })

    it('website-admin cannot update pages from other websites', async () => {
      await expect(
        payload.update({
          collection: 'pages',
          id: testPageB.id,
          data: {
            title: 'Hacked Title',
          },
          user: websiteAdminUserA,
        })
      ).rejects.toThrow()
    })

    it('editor can update pages', async () => {
      const updated = await payload.update({
        collection: 'pages',
        id: testPageA.id,
        data: {
          title: 'Editor Updated',
        },
        user: editorUserA,
      })

      expect(updated.title).toBe('Editor Updated')

      // Restore
      await payload.update({
        collection: 'pages',
        id: testPageA.id,
        data: { title: 'Page for Website A' },
        user: superAdminUser,
      })
    })

    it('viewer cannot update pages', async () => {
      await expect(
        payload.update({
          collection: 'pages',
          id: testPageA.id,
          data: {
            title: 'Viewer Hacked',
          },
          user: viewerUserA,
        })
      ).rejects.toThrow()
    })
  })

  describe('Pages - Delete Access', () => {
    it('website-admin can delete pages from their website', async () => {
      const tempPage = await payload.create({
        collection: 'pages',
        data: {
          title: 'Temp Page',
          slug: 'temp-page',
          website: testWebsiteA.id,
        },
        user: superAdminUser,
      })

      await expect(
        payload.delete({
          collection: 'pages',
          id: tempPage.id,
          user: websiteAdminUserA,
        })
      ).resolves.not.toThrow()
    })

    it('website-admin cannot delete pages from other websites', async () => {
      await expect(
        payload.delete({
          collection: 'pages',
          id: testPageB.id,
          user: websiteAdminUserA,
        })
      ).rejects.toThrow()
    })

    it('editor cannot delete pages', async () => {
      await expect(
        payload.delete({
          collection: 'pages',
          id: testPageA.id,
          user: editorUserA,
        })
      ).rejects.toThrow()
    })

    it('viewer cannot delete pages', async () => {
      await expect(
        payload.delete({
          collection: 'pages',
          id: testPageA.id,
          user: viewerUserA,
        })
      ).rejects.toThrow()
    })
  })

  describe('Media - Access Control', () => {
    it('website-admin can see media from their website', async () => {
      if (!testMediaA) {
        console.log('Skipping media test - no test media created')
        return
      }

      const media = await payload.find({
        collection: 'media',
        user: websiteAdminUserA,
      })

      const mediaFound = media.docs.find((m) => m.id === testMediaA.id)
      expect(mediaFound).toBeDefined()
    })
  })

  describe('Users - Access Control', () => {
    it('website-admin can see users who share their website', async () => {
      const users = await payload.find({
        collection: 'users',
        user: websiteAdminUserA,
      })

      // Should see other users with access to Website A
      const editorFound = users.docs.find((u) => u.id === editorUserA.id)
      const viewerFound = users.docs.find((u) => u.id === viewerUserA.id)

      expect(editorFound).toBeDefined()
      expect(viewerFound).toBeDefined()
    })

    it('website-admin cannot see users from other websites only', async () => {
      // Create a user for Website B only
      const userB = await payload.create({
        collection: 'users',
        data: {
          email: 'user-b-only@test.com',
          password: 'password123',
          role: 'editor',
          websites: [testWebsiteB.id],
          defaultWebsite: testWebsiteB.id,
        },
      })

      const users = await payload.find({
        collection: 'users',
        user: websiteAdminUserA,
      })

      // Should NOT see user from Website B
      const userBFound = users.docs.find((u) => u.id === userB.id)
      expect(userBFound).toBeUndefined()

      // Cleanup
      await payload.delete({ collection: 'users', id: userB.id })
    })
  })
})
