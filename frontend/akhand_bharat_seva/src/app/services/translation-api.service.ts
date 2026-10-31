import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface TranslationApiConfig {
  enabled: boolean;
  provider: string;
  apiKey?: string;
  apiEndpoint?: string;
  proxyUrl?: string;
  userId?: string;
  pipelineId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationApiService {
  private config: TranslationApiConfig = environment.translation;
  private cache: Map<string, string> = new Map();
  private cacheStorageKey = 'abs_translation_cache_v2';

  constructor() {
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const stored = localStorage.getItem(this.cacheStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.warn('Could not read translation cache from storage', e);
    }
  }

  private saveCache(): void {
    try {
      const obj = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.cacheStorageKey, JSON.stringify(obj));
    } catch (e) {
      console.warn('Could not save translation cache', e);
    }
  }

  /**
   * Translates a given text to the target language code.
   * If an API is configured, calls the respective API and caches the result.
   * If credentials are not yet configured, returns null to trigger local dictionary fallback.
   */
  async translateText(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string | null> {
    if (!text || targetLang === sourceLang) {
      return text;
    }

    const cacheKey = `${sourceLang}:${targetLang}:${text.trim()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Check if live API is configured
    if (!this.config.enabled || (!this.config.apiKey && !this.config.proxyUrl)) {
      // API not yet configured with credentials; fallback to built-in dictionary
      return null;
    }

    try {
      let translatedText: string | null = null;

      // 1. Backend Proxy (recommended for production security)
      if (this.config.proxyUrl) {
        const response = await fetch(this.config.proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang
          })
        });
        if (response.ok) {
          const data = await response.json();
          translatedText = data.translatedText || data.translation || null;
        }
      }
      // 2. Google Cloud Translation API
      else if (this.config.provider === 'google' && this.config.apiKey) {
        const endpoint = this.config.apiEndpoint || 'https://translation.googleapis.com/language/translate/v2';
        const url = `${endpoint}?key=${this.config.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text'
          })
        });
        if (response.ok) {
          const data = await response.json();
          translatedText = data?.data?.translations?.[0]?.translatedText || null;
        }
      }
      // 3. Azure Cognitive Translator
      else if (this.config.provider === 'azure' && this.config.apiKey) {
        const endpoint = this.config.apiEndpoint || 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';
        const url = `${endpoint}&from=${sourceLang}&to=${targetLang}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{ text }])
        });
        if (response.ok) {
          const data = await response.json();
          translatedText = data?.[0]?.translations?.[0]?.text || null;
        }
      }
      // 4. Bhashini / AI4Bharat NMT Pipeline
      else if (this.config.provider === 'bhashini' && this.config.apiKey) {
        const endpoint = this.config.apiEndpoint || 'https://api.bhashini.gov.in/v1/translate';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': this.config.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pipelineTasks: [
              {
                taskType: 'translation',
                config: {
                  language: {
                    sourceLanguage: sourceLang,
                    targetLanguage: targetLang
                  }
                }
              }
            ],
            inputData: {
              input: [{ source: text }]
            }
          })
        });
        if (response.ok) {
          const data = await response.json();
          translatedText = data?.pipelineResponse?.[0]?.output?.[0]?.target || null;
        }
      }

      if (translatedText) {
        this.cache.set(cacheKey, translatedText);
        this.saveCache();
        return translatedText;
      }
    } catch (error) {
      console.warn(`Translation API call failed for target "${targetLang}". Using local dictionary fallback.`, error);
    }

    return null;
  }

  isLiveApiConfigured(): boolean {
    return !!(this.config.enabled && (this.config.apiKey || this.config.proxyUrl));
  }

  getProviderName(): string {
    return this.config.provider;
  }
}
