import Redis from 'ioredis';

const HISTORY_TTL = 60 * 60 * 24;
const MAX_HISTORY_MESSAGES = 20;
const memoryStore = new Map();
const inMemoryMode = {
  active: false,
  until: 0,
};

let client;

function getClient() {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 100, 1000),
    });

    client.on('error', (err) => {
      activateMemoryMode(err, 'connection');
    });
  }
  return client;
}

function activateMemoryMode(err, label) {
  const now = Date.now();
  if (!inMemoryMode.active || now > inMemoryMode.until) {
    console.warn(`[Redis] switching to in-memory fallback (${label}): ${err.message}`);
  }

  inMemoryMode.active = true;
  inMemoryMode.until = now + 60_000;
}

function shouldUseMemory() {
  return inMemoryMode.active && Date.now() < inMemoryMode.until;
}

async function withStore(label, redisHandler, memoryHandler) {
  if (shouldUseMemory()) {
    return memoryHandler();
  }

  try {
    const redis = getClient();
    if (redis.status === 'wait') {
      await redis.connect();
    }
    const value = await redisHandler(redis);
    inMemoryMode.active = false;
    return value;
  } catch (err) {
    activateMemoryMode(err, label);
    return memoryHandler();
  }
}

function setMemory(key, value, ttlSeconds) {
  memoryStore.set(key, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    value,
  });
}

function getMemory(key) {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function deleteMemory(key) {
  memoryStore.delete(key);
}

function historyKey(sessionId) {
  return `chat:history:${sessionId}`;
}

function stateKey(sessionId) {
  return `chat:state:${sessionId}`;
}

function normalizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .map((message) => {
      if (!message || typeof message !== 'object') return null;
      if (message.role !== 'user' && message.role !== 'assistant') return null;
      return message;
    })
    .filter(Boolean);
}

export async function getHistory(sessionId) {
  return withStore(
    'getHistory',
    async (redis) => {
      const raw = await redis.get(historyKey(sessionId));
      return normalizeHistory(raw ? JSON.parse(raw) : []);
    },
    () => normalizeHistory(getMemory(historyKey(sessionId)) ?? [])
  );
}

export async function saveHistory(sessionId, messages) {
  const trimmed = normalizeHistory(messages).slice(-MAX_HISTORY_MESSAGES);

  return withStore(
    'saveHistory',
    async (redis) => {
      await redis.set(historyKey(sessionId), JSON.stringify(trimmed), 'EX', HISTORY_TTL);
    },
    () => {
      setMemory(historyKey(sessionId), trimmed, HISTORY_TTL);
    }
  );
}

export async function clearHistory(sessionId) {
  return withStore(
    'clearHistory',
    async (redis) => {
      await redis.del(historyKey(sessionId));
    },
    () => {
      deleteMemory(historyKey(sessionId));
    }
  );
}

export async function getConversationState(sessionId) {
  return withStore(
    'getConversationState',
    async (redis) => {
      const raw = await redis.get(stateKey(sessionId));
      return raw ? JSON.parse(raw) : null;
    },
    () => getMemory(stateKey(sessionId)) ?? null
  );
}

export async function saveConversationState(sessionId, state) {
  return withStore(
    'saveConversationState',
    async (redis) => {
      await redis.set(stateKey(sessionId), JSON.stringify(state), 'EX', HISTORY_TTL);
    },
    () => {
      setMemory(stateKey(sessionId), state, HISTORY_TTL);
    }
  );
}

export async function clearConversationState(sessionId) {
  return withStore(
    'clearConversationState',
    async (redis) => {
      await redis.del(stateKey(sessionId));
    },
    () => {
      deleteMemory(stateKey(sessionId));
    }
  );
}
