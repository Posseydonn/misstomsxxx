import Redis from 'ioredis';

const HISTORY_TTL = 60 * 60 * 24; // 24 часа
const MAX_HISTORY_MESSAGES = 20;   // Держим последние 20 сообщений (10 пар)

let client;

function getClient() {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    client.on('error', (err) => {
      console.error('[Redis] connection error:', err.message);
    });
  }
  return client;
}

/**
 * Загружает историю диалога по sessionId.
 * @returns {Array<{role: string, content: string}>}
 */
export async function getHistory(sessionId) {
  try {
    const raw = await getClient().get(`chat:${sessionId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[Redis] getHistory error:', err.message);
    return [];
  }
}

/**
 * Сохраняет обновлённую историю с TTL 24 часа.
 * Обрезает до MAX_HISTORY_MESSAGES сообщений.
 */
export async function saveHistory(sessionId, messages) {
  try {
    const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
    await getClient().set(
      `chat:${sessionId}`,
      JSON.stringify(trimmed),
      'EX',
      HISTORY_TTL
    );
  } catch (err) {
    console.error('[Redis] saveHistory error:', err.message);
  }
}

/** Удаляет историю (например, после успешной записи) */
export async function clearHistory(sessionId) {
  try {
    await getClient().del(`chat:${sessionId}`);
  } catch (err) {
    console.error('[Redis] clearHistory error:', err.message);
  }
}
