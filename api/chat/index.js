import { handleChatTurn } from '../../server/routes/chatHandlers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return handleChatTurn(req, res);
}
