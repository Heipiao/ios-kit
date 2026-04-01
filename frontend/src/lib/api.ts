const API_BASE_URL = process.env.PUBLIC_API_BASE_URL || 'http://localhost:8000'

type DeviceType = 'iphone_65' | 'iphone_67' | 'iphone_55' | 'ipad_129' | 'ipad_11' | 'ipad_109'
type BackgroundStyle = 'gradient' | 'gradient_blue' | 'gradient_purple' | 'gradient_sunset' | 'solid_white' | 'solid_black' | 'dark'

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

export async function processScreenshot(
  imageBase64: string,
  deviceType: DeviceType,
  backgroundStyle: BackgroundStyle,
  showFrame: boolean,
  caption?: string
) {
  const response = await fetch(`${API_BASE_URL}/api/screenshot/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_base64: imageBase64,
      device_type: deviceType,
      background_style: backgroundStyle,
      show_frame: showFrame,
      caption,
    }),
  })

  if (!response.ok) {
    throw new Error('Screenshot processing failed')
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
      language: language || 'en',
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
