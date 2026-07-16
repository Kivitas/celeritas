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
    model: 'claude-3-sonnet-20240229',
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

export function loadApiKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

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

export async function sendAIMessage(providerId: string, apiKey: string, prompt: string, context: any): Promise<string> {
  const provider = AI_PROVIDERS.find((p) => p.id === providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const contextStr = JSON.stringify(context, null, 2);
  const fullPrompt = `${prompt}\n\nContext:\n${contextStr}`;

  if (providerId === 'openai') {
    const res = await fetch(provider.endpoint, {
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
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response';
  } else if (providerId === 'anthropic') {
    const res = await fetch(provider.endpoint, {
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
    const data = await res.json();
    return data.content?.[0]?.text || 'No response';
  } else if (providerId === 'gemini') {
    const res = await fetch(`${provider.endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: buildSystemPrompt() }] },
          { role: 'model', parts: [{ text: 'Understood.' }] },
          { role: 'user', parts: [{ text: fullPrompt }] }
        ]
      })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  } else if (providerId === 'mistral') {
    const res = await fetch(provider.endpoint, {
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
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response';
  }
  return 'Unsupported provider';
}
