export interface User {
  id: string;
  email: string;
}

export interface AppProject {
  id: string;
  user_id: string;
  name: string;
  bundle_id: string;
  category: string;
  description: string;
  subtitle?: string;
  keywords?: string;
  created_at: string;
  updated_at: string;
}

export interface Screenshot {
  id: string;
  project_id: string;
  original_url: string;
  processed_urls: Record<string, string>;
  created_at: string;
}

export interface PrivacyPolicy {
  id: string;
  project_id: string;
  content: string;
  public_url?: string;
  created_at: string;
}
