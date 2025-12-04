interface ApiResponse<T> {
  data: T
  error?: string
  status: number
}

export const createApiClient = (baseUrl: string) => {
  const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      const data = await response.json()

      return {
        data: data as T,
        status: response.status,
        error: response.ok ? undefined : data.message || 'Request failed',
      }
    } catch (error) {
      return {
        data: null as T,
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  return {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: any) =>
      request<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    put: <T>(endpoint: string, body: any) =>
      request<T>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    patch: <T>(endpoint: string, body: any) =>
      request<T>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: <T>(endpoint: string) =>
      request<T>(endpoint, { method: 'DELETE' }),
  }
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

export const retryRequest = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError || new Error('Request failed after retries')
}

