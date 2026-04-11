import { ensureServerReady } from '../bootstrap.js';
import { getChatSession, runChatTurn } from '../chat/runtime.js';

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return typeof body === 'object' ? body : {};
}

export async function handleChatSession(req, res) {
  const sessionId = String(req.query?.sessionId || '').trim();

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    await ensureServerReady();
    const payload = await getChatSession(sessionId);
    return res.json(payload);
  } catch (error) {
    console.error('[Chat] session error:', error.message);
    return res.status(500).json({
      error: 'Не удалось загрузить сессию.',
    });
  }
}

export async function handleChatTurn(req, res) {
  const body = parseBody(req.body);
  const { message, sessionId, pageContext, clientAction } = body;
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  if (!trimmedMessage && !clientAction) {
    return res.status(400).json({ error: 'message or clientAction is required' });
  }
  if (trimmedMessage.length > 1000) {
    return res.status(400).json({ error: 'message too long' });
  }

  try {
    await ensureServerReady();
    const payload = await runChatTurn({
      sessionId,
      message: trimmedMessage,
      pageContext,
      clientAction,
    });
    return res.json(payload);
  } catch (error) {
    console.error('[Chat] unhandled error:', error.message);
    return res.status(500).json({
      error: 'Произошла ошибка. Попробуйте еще раз.',
    });
  }
}
