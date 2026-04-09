/**
 * GigaChat API клиент.
 * Документация: https://developers.sber.ru/docs/ru/gigachat/api/overview
 *
 * Аутентификация: OAuth 2.0 client_credentials.
 * GIGACHAT_AUTH_KEY — готовый Base64(clientId:clientSecret) из личного кабинета.
 * Токен кешируется в памяти и обновляется за 60 сек до истечения.
 *
 * GigaChat использует самоподписанный TLS-сертификат.
 * Используем fetch из undici с кастомным Agent (rejectUnauthorized: false)
 * только для эндпоинтов GigaChat.
 */

import { fetch, Agent } from 'undici';

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const API_BASE  = 'https://gigachat.devices.sberbank.ru/api/v1';

// Пропускаем проверку самоподписанного сертификата GigaChat
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });

let tokenCache = { value: null, expiresAt: 0 };

/** Получает/обновляет OAuth-токен (кешируется, обновляется за 60 с до истечения) */
async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt - 60_000) {
    return tokenCache.value;
  }

  const authKey = process.env.GIGACHAT_AUTH_KEY;
  if (!authKey) throw new Error('GIGACHAT_AUTH_KEY не задан в .env');

  const rqUid = crypto.randomUUID();

  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: rqUid,
    },
    body: new URLSearchParams({
      scope: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
    }).toString(),
    dispatcher: insecureAgent,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GigaChat OAuth error ${res.status}: ${text}`);
  }

  const data = await res.json();

  tokenCache = {
    value: data.access_token,
    expiresAt: data.expires_at, // unix timestamp в мс
  };

  console.log('[GigaChat] токен обновлён, истекает:', new Date(tokenCache.expiresAt).toISOString());
  return tokenCache.value;
}

/**
 * Отправляет запрос в GigaChat Chat Completions.
 * @param {Array<{role: 'system'|'user'|'assistant', content: string}>} messages
 * @returns {Promise<string>} — текст ответа модели
 */
export async function chat(messages) {
  const token = await getAccessToken();
  const model = process.env.GIGACHAT_MODEL || 'GigaChat-Pro';

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 512,
      stream: false,
    }),
    dispatcher: insecureAgent,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GigaChat API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
