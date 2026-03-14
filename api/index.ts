import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://fullstackcode-tau.vercel.app',
    'https://fullstackcode-tau.vercel.app/'
  ]
}));
app.use(express.json());

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend API is running successfully!' });
});

// ─── GET /api/modules ────────────────────────────────────────────────────────
// Returns all modules with topic counts (lightweight list for the Modules page)
app.get('/api/modules', async (_req: Request, res: Response) => {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    });

    const result = modules.map((mod: any) => ({
      id: mod.id,
      title: mod.title,
      description: mod.description,
      order: mod.order,
      icon: mod.icon,
      topicsCount: mod._count.topics,
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/modules/:moduleId ──────────────────────────────────────────────
// Returns a single module with all its topics (for the ModuleDetails page).
// Supports lookup by UUID or by order number (1, 2, 3, …)
app.get('/api/modules/:moduleId', async (req: Request<{ moduleId: string }>, res: Response) => {
  const rawId = req.params.moduleId;

  try {
    const orderNum = parseInt(rawId, 10);
    const isOrderLookup = !isNaN(orderNum);

    const mod = await prisma.module.findFirst({
      where: isOrderLookup ? { order: orderNum } : { id: rawId },
      include: {
        topics: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!mod) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    res.json({
      id: mod.id,
      title: mod.title,
      description: mod.description,
      order: mod.order,
      icon: mod.icon,
      topics: (mod as any).topics.map((topic: any) => ({
        id: topic.id,
        title: topic.title,
        order: topic.order,
        content: topic.content, // raw Markdown
      })),
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/modules/:moduleId/topics/:topicId ──────────────────────────────
// Returns a single topic by its UUID
app.get('/api/modules/:moduleId/topics/:topicId', async (req: Request<{ moduleId: string, topicId: string }>, res: Response) => {
  const topicId = req.params.topicId;

  try {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      res.status(404).json({ error: 'Topic not found' });
      return;
    }

    res.json({
      id: topic.id,
      title: topic.title,
      order: topic.order,
      content: topic.content,
    });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Graceful shutdown ───────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

export default app;
