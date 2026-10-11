import type { ImageInput } from '../pipeline/types'

export interface PreparedImage {
  input: ImageInput
  previewUrl: string
  width: number
  height: number
}

/**
 * 浏览器侧压缩：最长边限到 maxEdge，转 JPEG。
 * createImageBitmap 的 imageOrientation: 'from-image' 负责吃掉 EXIF 旋转（手机竖拍）。
 */
export async function prepareImage(file: File, maxEdge = 1600, quality = 0.85): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context unavailable')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return { input: { base64, mime: 'image/jpeg', width, height }, previewUrl: dataUrl, width, height }
}
