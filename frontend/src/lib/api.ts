const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function chatWithAI(message: string, context?: object) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, context }),
  })

  if (!response.ok) {
    throw new Error('AI request failed')
  }

  return response.json()
}

export async function generateMetadata(appDescription: string, targetAudience?: string, language?: string) {
  const response = await fetch(`${API_BASE_URL}/api/metadata/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_description: appDescription,
      target_audience: targetAudience,
      language: language || 'zh',
    }),
  })

  if (!response.ok) {
    throw new Error('Metadata generation failed')
  }

  return response.json()
}

export async function generatePrivacyPolicy(data: {
  app_name: string
  data_collected: string[]
  data_usage: string[]
  third_party_sharing: boolean
  user_deletion: boolean
}) {
  const response = await fetch(`${API_BASE_URL}/api/privacy/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Privacy policy generation failed')
  }

  return response.json()
}
