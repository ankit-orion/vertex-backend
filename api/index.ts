import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const DATA_DIR = path.join(__dirname, '../data/modules');

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
// Returns all modules with topic counts from JSON files
app.get('/api/modules', async (_req: Request, res: Response) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(DATA_DIR);
    const modules = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
        const data = JSON.parse(content);
        return {
          id: data.id || f.replace('.json', ''),
          title: data.title,
          description: data.description,
          order: data.order,
          icon: data.icon || null,
          topicsCount: data.topics.length,
        };
      })
      .sort((a, b) => a.order - b.order);

    res.json(modules);
  } catch (error: any) {
    console.error('Error fetching modules from JSON:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message
    });
  }
});

// ─── GET /api/modules/:moduleId ──────────────────────────────────────────────
// Returns a single module with all its topics from JSON files
app.get('/api/modules/:moduleId', async (req: Request<{ moduleId: string }>, res: Response) => {
  try {
    const moduleId = req.params.moduleId;
    if (!fs.existsSync(DATA_DIR)) {
      return res.status(404).json({ error: 'Modules directory not found' });
    }
    const files = fs.readdirSync(DATA_DIR);
    
    // Try to find by ID or by order (filename)
    let fileName = files.find(f => f.includes(`module-${moduleId}.json`) || f.includes(`${moduleId}.json`));
    
    let data;
    if (!fileName) {
      // Fallback: search content for matching order or ID
      const allMods = files.filter(f => f.endsWith('.json')).map(f => {
        const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
        return JSON.parse(content);
      });
      data = allMods.find(m => m.id === moduleId || m.order.toString() === moduleId);
    } else {
      const content = fs.readFileSync(path.join(DATA_DIR, fileName), 'utf-8');
      data = JSON.parse(content);
    }

    if (!data) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching module from JSON:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/modules/:moduleId/topics/:topicId ──────────────────────────────
// Returns a single topic from JSON
app.get('/api/modules/:moduleId/topics/:topicId', async (req: Request<{ moduleId: string, topicId: string }>, res: Response) => {
  const { moduleId, topicId } = req.params;

  try {
    const files = fs.readdirSync(DATA_DIR);
    const fileName = files.find(f => f.includes(`module-${moduleId}.json`) || f.includes(`${moduleId}.json`));
    
    if (!fileName) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    const content = fs.readFileSync(path.join(DATA_DIR, fileName), 'utf-8');
    const data = JSON.parse(content);
    const topic = data.topics.find((t: any) => t.id === topicId || t.order.toString() === topicId);

    if (!topic) {
      res.status(404).json({ error: 'Topic not found' });
      return;
    }

    res.json(topic);
  } catch (error) {
    console.error('Error fetching topic from JSON:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

export default app;
