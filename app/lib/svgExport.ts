async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/** Rasterizes an on-page SVG (remote images inlined first, so the canvas isn't tainted). Preview quality, not print-ready. */
export async function svgToPngDataUrl(svg: SVGSVGElement, width = 2280): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  for (const img of Array.from(clone.querySelectorAll('image'))) {
    const href = img.getAttribute('href') ?? ''
    if (/^https?:/.test(href)) img.setAttribute('href', await toDataUrl(href))
  }
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`
  await image.decode()
  const vb = svg.viewBox.baseVal
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = Math.round((width * vb.height) / vb.width)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f6f5fb'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}
