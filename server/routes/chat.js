import { Router } from 'express';
import { handleChatSession, handleChatTurn } from './chatHandlers.js';

const router = Router();

router.get('/session', handleChatSession);
router.post('/', handleChatTurn);

export default router;
