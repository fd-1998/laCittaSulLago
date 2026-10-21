const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

let csrfToken = null

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function setCsrfToken(value) {
  csrfToken = value || null
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers)
  const isFormData = options.body instanceof FormData

  if (options.body != null && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (csrfToken && options.method && options.method !== 'GET') {
    headers.set('X-CSRF-Token', csrfToken)
  }

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body != null && !isFormData && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body,
  })

  if (response.status === 204) {
    return null
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message ?? 'La richiesta non è riuscita.',
      response.status,
      payload?.error?.code ?? 'request_failed',
    )
  }
  return payload?.data
}

export async function uploadPlaceImage(file, placeId) {
  const form = new FormData()
  form.set('file', file)
  form.set('placeId', placeId)
  return apiRequest('/uploads', { method: 'POST', body: form })
}

export async function fetchEditorTable(table) {
  return apiRequest(`/editor/tables/${encodeURIComponent(table)}`)
}

export async function updateEditorRow(table, match, changes) {
  return apiRequest(`/editor/tables/${encodeURIComponent(table)}`, {
    method: 'PATCH',
    body: { match, changes },
  })
}
