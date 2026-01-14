import { Router } from 'express';
import { WhitelistMiddleware } from '../middlewares/whitelist.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Apply auth middleware
router.use(WhitelistMiddleware);

router.get('/', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

export const usersRouter = router;
