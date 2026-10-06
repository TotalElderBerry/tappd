/** Shrinks an image in the browser before upload, so uploads stay well under the 4 MB server limit. */
export async function resizeImage(file: File, maxDim: number, type: 'image/jpeg' | 'image/png' = 'image/jpeg', quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file')
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose an image under 5 MB')
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Couldn't read that image"))), type, quality))
}

export async function uploadImage(file: File, opts: { maxDim: number; keepAlpha?: boolean }): Promise<string> {
  const type = opts.keepAlpha ? 'image/png' : 'image/jpeg'
  const blob = await resizeImage(file, opts.maxDim, type)
  const form = new FormData()
  form.append('file', blob, opts.keepAlpha ? 'image.png' : 'image.jpg')
  const { url } = await $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body: form })
  return url
}
