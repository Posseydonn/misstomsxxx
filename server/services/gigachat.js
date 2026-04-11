import { randomUUID } from 'node:crypto';
import { Agent, fetch } from 'undici';

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const API_BASE = 'https://gigachat.devices.sberbank.ru/api/v1';
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });
const tokenCache = { value: null, expiresAt: 0 };
const circuitBreaker = {
  failures: 0,
  openUntil: 0,
};

function getTimeoutMs() {
  return Number(process.env.GIGACHAT_TIMEOUT_MS || 12_000);
}

function getRetryCount() {
  return Number(process.env.GIGACHAT_RETRIES || 2);
}

function openCircuit(reason) {
  circuitBreaker.failures += 1;
  if (circuitBreaker.failures >= 3) {
    circuitBreaker.openUntil = Date.now() + 30_000;
    console.warn(`[GigaChat] circuit opened: ${reason}`);
  }
}

function closeCircuit() {
  circuitBreaker.failures = 0;
  circuitBreaker.openUntil = 0;
}

function resetToken() {
  tokenCache.value = null;
  tokenCache.expiresAt = 0;
}

function isRetriableStatus(status) {
  return status === 401 || status === 408 || status === 429 || status >= 500;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = getTimeoutMs()) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt - 60_000) {
    return tokenCache.value;
  }

  const authKey = process.env.GIGACHAT_AUTH_KEY;
  if (!authKey) {
    throw new Error('GIGACHAT_AUTH_KEY is not configured');
  }

  const res = await fetchWithTimeout(
    OAUTH_URL,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        RqUID: randomUUID(),
      },
      body: new URLSearchParams({
        scope: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
      }).toString(),
      dispatcher: insecureAgent,
    },
    getTimeoutMs()
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GigaChat OAuth error ${res.status}: ${text}`);
  }

  const data = await res.json();
  tokenCache.value = data.access_token;
  tokenCache.expiresAt = data.expires_at;
  return tokenCache.value;
}

async function requestChat(messages, attempt = 0) {
  if (circuitBreaker.openUntil > Date.now()) {
    const err = new Error('GIGACHAT_CIRCUIT_OPEN');
    err.code = 'GIGACHAT_CIRCUIT_OPEN';
    throw err;
  }

  try {
    const token = await getAccessToken();
    const model = process.env.GIGACHAT_MODEL || 'GigaChat-Pro';

    const res = await fetchWithTimeout(
      `${API_BASE}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 512,
          stream: false,
        }),
        dispatcher: insecureAgent,
      },
      getTimeoutMs()
    );

    if (!res.ok) {
      if (res.status === 401) {
        resetToken();
      }

      const text = await res.text();
      if (attempt < getRetryCount() && isRetriableStatus(res.status)) {
        return requestChat(messages, attempt + 1);
      }

      openCircuit(`status ${res.status}`);
      throw new Error(`GigaChat API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    closeCircuit();
    return data.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    if (err?.name === 'AbortError' && attempt < getRetryCount()) {
      return requestChat(messages, attempt + 1);
    }

    if (attempt < getRetryCount() && /fetch failed|ECONN|socket|network/i.test(err.message || '')) {
      return requestChat(messages, attempt + 1);
    }

    openCircuit(err.message || 'unknown');
    throw err;
  }
}

export async function invoke(messages, schema) {
  const content = await requestChat(messages, 0);

  if (!schema) {
    return content;
  }

  try {
    return JSON.parse(String(content).trim());
  } catch {
    return content;
  }
}

export async function chat(messages) {
  return invoke(messages);
}

export function isGigaChatCircuitOpen() {
  return circuitBreaker.openUntil > Date.now();
}
