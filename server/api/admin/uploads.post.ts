import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'

const MAX_BYTES = 4 * 1024 * 1024 // stays under Vercel's 4.5 MB request limit; the browser resizes first
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')
  const ext = file?.type ? EXT[file.type] : undefined
  if (!file || !ext) throw createError({ statusCode: 400, statusMessage: 'Upload a JPEG, PNG or WebP image' })
  if (file.data.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'Image is larger than 4 MB' })
  const blob = await put(`uploads/${randomUUID()}.${ext}`, file.data, { access: 'public', contentType: file.type })
  return { url: blob.url }
})
