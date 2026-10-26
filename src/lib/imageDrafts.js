import { uploadPlaceImages } from './api'

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export function createFileDraft(file, isPrimary = false) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    imageUrl: null,
    caption: file.name,
    isPrimary,
    source: 'file',
    revokeUrl: true,
  }
}

export function createUrlDraft(url, isPrimary = false) {
  const trimmedUrl = url.trim()
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file: { name: trimmedUrl.split('/').pop() || 'immagine-link', size: 0 },
    previewUrl: trimmedUrl,
    imageUrl: trimmedUrl,
    caption: trimmedUrl.split('/').pop() || 'immagine-link',
    isPrimary,
    source: 'url',
    revokeUrl: false,
  }
}

export function draftsFromImages(images = []) {
  return images.map((image) => {
    const url = image.thumbnail_url || image.image_url
    return {
      id: image.id,
      file: { name: image.caption || url?.split('/').pop() || 'immagine', size: 0 },
      previewUrl: url,
      imageUrl: image.image_url || url,
      caption: image.caption || '',
      isPrimary: Boolean(image.is_primary),
      source: 'existing',
      revokeUrl: false,
    }
  })
}

export function cleanupDrafts(items) {
  items.forEach((item) => {
    if (item.revokeUrl) {
      URL.revokeObjectURL(item.previewUrl)
    }
  })
}

export function validateImageFiles(fileList) {
  const accepted = []
  const rejected = []

  Array.from(fileList ?? []).forEach((file) => {
    if (!file.type.startsWith('image/')) {
      rejected.push(`${file.name} non è un'immagine`)
    } else if (file.size > MAX_IMAGE_SIZE) {
      rejected.push(`${file.name} supera 10 MB`)
    } else {
      accepted.push(file)
    }
  })

  return { accepted, rejected }
}

export async function buildImagePayloads(drafts, layerId, placeId) {
  const fileDrafts = drafts.filter((draft) => draft.source === 'file')
  const linkedDrafts = drafts.filter((draft) => draft.source !== 'file')
  const payloads = linkedDrafts.map((draft) => ({
    historical_layer_id: layerId,
    image_url: draft.imageUrl || draft.previewUrl,
    thumbnail_url: draft.previewUrl,
    caption: draft.caption || draft.file.name,
    is_primary: draft.isPrimary,
  }))

  if (fileDrafts.length) {
    const uploaded = await uploadPlaceImages(fileDrafts.map((draft) => draft.file), placeId)
    const uploadedFiles = uploaded.files ?? [uploaded]
    if (uploadedFiles.length !== fileDrafts.length) {
      throw new Error('Il backend non ha restituito tutte le immagini caricate.')
    }
    uploadedFiles.forEach((file, index) => {
      const draft = fileDrafts[index]
      payloads.push({
        historical_layer_id: layerId,
        image_url: file.publicUrl,
        thumbnail_url: file.publicUrl,
        caption: draft.caption || file.originalName || draft.file.name,
        is_primary: draft.isPrimary,
      })
    })
  }

  return payloads
}
