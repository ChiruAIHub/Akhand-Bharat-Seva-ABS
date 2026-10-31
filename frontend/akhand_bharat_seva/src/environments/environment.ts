/**
 * Translation API Configuration Environment
 *
 * NOTE: API keys and sensitive credentials must never be committed to source control.
 * Configure your credentials in `.env` and pass them into your build or backend proxy.
 */
export const environment = {
  production: true,
  translation: {
    // Flag to enable live API translation once credentials are provided
    enabled: false,
    // Supported providers: 'bhashini' | 'google' | 'azure' | 'libretranslate' | 'custom'
    provider: 'bhashini',
    // Secure backend proxy URL (recommended to avoid exposing API keys in frontend)
    proxyUrl: '',
    // Direct API endpoint (used if calling client-side or during local testing)
    apiEndpoint: '',
    // API Key / Token placeholder (to be supplied by user)
    apiKey: '',
    // Optional Bhashini/Provider IDs
    userId: '',
    pipelineId: ''
  }
};
