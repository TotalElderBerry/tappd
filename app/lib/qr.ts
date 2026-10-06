import QRCode from 'qrcode'

export const qrSvg = (text: string) => QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
export const qrPngDataUrl = (text: string, width = 1024) => QRCode.toDataURL(text, { width, margin: 2, errorCorrectionLevel: 'M' })

export function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export function downloadText(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  downloadUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
