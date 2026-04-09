/**
 * PostgreSQL — логирование диалогов для аналитики.
 *
 * Инициализация таблицы:
 *   node -e "import('./services/postgres.js').then(m => m.initDb())"
 *
 * Или выполни SQL вручную:
 *   CREATE TABLE IF NOT EXISTS chat_logs (
 *     id          BIGSERIAL PRIMARY KEY,
 *     session_id  TEXT NOT NULL,
 *     role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
 *     content     TEXT NOT NULL,
 *     page        TEXT,
 *     intent_type TEXT,
 *     booking     JSONB,
 *     created_at  TIMESTAMPTZ DEFAULT NOW()
 *   );
 *   CREATE INDEX ON chat_logs (session_id);
 *   CREATE INDEX ON chat_logs (created_at);
 */

import pg from 'pg';

const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
    pool.on('error', (err) => {
      console.error('[PG] unexpected pool error:', err.message);
    });
  }
  return pool;
}

/** Создаёт таблицу если не существует (запускать при старте сервера) */
export async function initDb() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS chat_logs (
      id          BIGSERIAL PRIMARY KEY,
      session_id  TEXT NOT NULL,
      role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content     TEXT NOT NULL,
      page        TEXT,
      intent_type TEXT,
      booking     JSONB,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS chat_logs_session_idx ON chat_logs (session_id);
    CREATE INDEX IF NOT EXISTS chat_logs_created_idx ON chat_logs (created_at);
  `);
  console.log('[PG] chat_logs table ready');
}

/**
 * Логирует одно сообщение диалога.
 * @param {object} params
 * @param {string} params.sessionId
 * @param {'user'|'assistant'} params.role
 * @param {string} params.content
 * @param {string} [params.page]
 * @param {string} [params.intentType]
 * @param {object} [params.booking]
 */
export async function logMessage({ sessionId, role, content, page, intentType, booking }) {
  try {
    await getPool().query(
      `INSERT INTO chat_logs (session_id, role, content, page, intent_type, booking)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, role, content, page ?? null, intentType ?? null, booking ? JSON.stringify(booking) : null]
    );
  } catch (err) {
    // Логирование не должно ломать основной флоу
    console.error('[PG] logMessage error:', err.message);
  }
}
