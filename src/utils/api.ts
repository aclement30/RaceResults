type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: string | Record<string, unknown>
}

const { VITE_API_URL } = import.meta.env || {}

const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'same-origin',
  }

  const payload = options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body

  try {
    const response = await fetch(VITE_API_URL + endpoint, { ...defaultOptions, ...options, body: payload })

    if (!response.ok) {
      let errorMessage

      if (response.status === 400) {
        const errorData = await response.json()
        errorMessage = errorData?.message
      }

      throw new Error(`API request failed: ${errorMessage || response.status + ' ' + response.statusText}`)
    }

    const data = await response.json()

    return data
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

export const api = {
  async saveFeedback(payload: {
    url: string,
    feedbackType: 'good' | 'bad',
    id?: string,
    comments?: string
  }): Promise<{ id: string }> {
    return apiFetch('/feedback', {
      method: 'POST',
      body: payload
    })
  }
}