export const AI_PROVIDERS = [
  {
    id: 'openai',
    label: 'OpenAI (GPT-4o)',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    keyPrefix: 'sk-',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-5-5',
    keyPrefix: 'sk-ant-',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    model: 'gemini-2.5-flash',
    keyPrefix: 'AI',
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest',
    keyPrefix: '',
  },
];

const STORAGE_KEY = 'celeritas_ai_keys';
const REQUEST_TIMEOUT_MS = 60_000;

// Security note: API keys are stored in localStorage, so any script running on
// this page (including injected or third-party scripts) can read them.
export function loadApiKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// See loadApiKeys: keys saved here are readable by any script on the page.
export function saveApiKeys(keys: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // ignore
  }
}

export function getActiveProvider(keys: Record<string, string>) {
  for (const provider of AI_PROVIDERS) {
    if (keys[provider.id]?.trim()) return provider;
  }
  return null;
}

function buildSystemPrompt() {
  return `You are the AI Assistant for the Celeritas Spectrometry Lab, an expert in Cherenkov radiation, particle physics, and detector optics. 
Analyze simulation results, explain physics concepts like Frank-Tamm limits or Sellmeier dispersion, and recommend sensor configurations. 
Be concise, use markdown and LaTeX, and rely strictly on physical principles.`;
}

// Extracts a human-readable message from a provider error body, then throws
// with the HTTP status so the real failure is visible instead of 'No response'.
async function throwProviderError(providerLabel: string, res: Response): Promise<never> {
  let detail = '';
  try {
    const data = await res.json();
    const message = data?.error?.message ?? data?.error ?? data?.message;
    detail = typeof message === 'string' ? message : message ? JSON.stringify(message) : '';
  } catch {
    // body was not JSON; fall through with status only
  }
  const suffix = detail ? `: ${detail}` : '';
  throw new Error(`${providerLabel} request failed (HTTP ${res.status})${suffix}`);
}

// Runs a fetch with a 60s timeout. The timer is cleared in finally.
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendAIMessage(providerId: string, apiKey: string, prompt: string, context: any): Promise<string> {
  const provider = AI_PROVIDERS.find((p) => p.id === providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const contextStr = JSON.stringify(context, null, 2);
  const fullPrompt = `${prompt}\n\nContext:\n${contextStr}`;

  if (providerId === 'openai') {
    const res = await fetchWithTimeout(provider.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: fullPrompt }
        ],
      })
    });
    if (!res.ok) await throwProviderError(provider.label, res);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response';
  } else if (providerId === 'anthropic') {
    // SECURITY: 'anthropic-dangerous-direct-browser-access' lets the browser call
    // the API directly. The API key lives in the browser, so anyone who can read
    // the page or localStorage can use it. A backend proxy that holds the key is
    // recommended for production.
    const res = await fetchWithTimeout(provider.endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: provider.model,
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 1024
      })
    });
    if (!res.ok) await throwProviderError(provider.label, res);
    const data = await res.json();
    return data.content?.[0]?.text || 'No response';
  } else if (providerId === 'gemini') {
    // The key is sent in a header rather than the URL query string, so it does
    // not end up in browser history, proxy logs or Referer headers.
    const res = await fetchWithTimeout(provider.endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: buildSystemPrompt() }] },
          { role: 'model', parts: [{ text: 'Understood.' }] },
          { role: 'user', parts: [{ text: fullPrompt }] }
        ]
      })
    });
    if (!res.ok) await throwProviderError(provider.label, res);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  } else if (providerId === 'mistral') {
    const res = await fetchWithTimeout(provider.endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 1024
      })
    });
    if (!res.ok) await throwProviderError(provider.label, res);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response';
  }
  return 'Unsupported provider';
}
