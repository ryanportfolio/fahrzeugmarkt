import type { ApiErrorBody } from '../types'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }
}

export type QueryValue = string | number | boolean | null | undefined | Array<string | number>

export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === null || item === undefined || item === '') continue
        search.append(key, String(item))
      }
    } else {
      search.append(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

interface RequestOptions {
  method?: string
  body?: unknown
  signal?: AbortSignal
}

const BASE = '/api'

async function toApiError(response: Response): Promise<ApiError> {
  let message = defaultMessage(response.status)
  let fieldErrors: Record<string, string> = {}
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>
    if (typeof body?.message === 'string' && body.message.trim()) message = body.message
    if (body?.fieldErrors) fieldErrors = body.fieldErrors
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(response.status, message, fieldErrors)
}

function defaultMessage(status: number): string {
  if (status === 401) return 'Please sign in to continue'
  if (status === 403) return 'You are not allowed to do that'
  if (status === 404) return 'We could not find what you were looking for'
  if (status === 413) return 'That file is too large'
  if (status >= 500) return 'The server is having trouble, please try again'
  return 'Something went wrong'
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options
  const init: RequestInit = { method, credentials: 'include', signal }
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Cannot reach the server, check your connection')
  }
  return parse<T>(response)
}

export async function upload<T>(path: string, file: File, field = 'file'): Promise<T> {
  const form = new FormData()
  form.append(field, file)
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server, check your connection')
  }
  return parse<T>(response)
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong'
}

export function fieldErrorsOf(error: unknown): Record<string, string> {
  return error instanceof ApiError ? error.fieldErrors : {}
}
