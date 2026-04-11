import pg from 'pg';

const { Pool } = pg;

let pool;
let degradedMode = false;

function enableDegradedMode(reason) {
  if (!degradedMode) {
    console.warn(`[PG] degraded mode enabled: ${reason}`);
  }
  degradedMode = true;
}

function getPool() {
  if (degradedMode) return null;

  if (!process.env.DATABASE_URL) {
    enableDegradedMode('DATABASE_URL is not configured');
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
    });

    pool.on('error', (err) => {
      enableDegradedMode(err.message);
    });
  }

  return pool;
}

export async function initDb() {
  const currentPool = getPool();
  if (!currentPool) return false;

  try {
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS chat_logs (
        id BIGSERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        page TEXT,
        intent_type TEXT,
        booking JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS action TEXT;
      ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS flow TEXT;
      ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS stage TEXT;
      ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS fallback_reason TEXT;
      ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS medflex_result JSONB;
      ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS debug_trace JSONB;
      CREATE INDEX IF NOT EXISTS chat_logs_session_idx ON chat_logs (session_id);
      CREATE INDEX IF NOT EXISTS chat_logs_created_idx ON chat_logs (created_at);
    `);
    console.log('[PG] chat_logs table ready');
    return true;
  } catch (err) {
    enableDegradedMode(err.message);
    return false;
  }
}

export async function logMessage({
  sessionId,
  role,
  content,
  page,
  intentType,
  booking,
  action,
  flow,
  stage,
  fallbackReason,
  medflexResult,
  debugTrace,
}) {
  const currentPool = getPool();
  if (!currentPool) return;

  try {
    await currentPool.query(
      `INSERT INTO chat_logs (
        session_id,
        role,
        content,
        page,
        intent_type,
        booking,
        action,
        flow,
        stage,
        fallback_reason,
        medflex_result,
        debug_trace
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        sessionId,
        role,
        content,
        page ?? null,
        intentType ?? null,
        booking ? JSON.stringify(booking) : null,
        action ?? null,
        flow ?? null,
        stage ?? null,
        fallbackReason ?? null,
        medflexResult ? JSON.stringify(medflexResult) : null,
        debugTrace ? JSON.stringify(debugTrace) : null,
      ]
    );
  } catch (err) {
    enableDegradedMode(err.message);
  }
}

export function isPostgresDegraded() {
  return degradedMode;
}
