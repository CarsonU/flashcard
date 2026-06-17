import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

router.get('/', async (_req, res) => {
  try {
    const decks = await prisma.deck.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { cards: true } } },
    });
    res.json(decks);
  } catch {
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

router.post('/', async (req, res) => {
  const { title } = req.body as { title?: string };
  if (!title?.trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  try {
    const deck = await prisma.deck.create({ data: { title: title.trim() } });
    res.status(201).json(deck);
  } catch {
    res.status(500).json({ error: 'Failed to create deck' });
  }
});

router.patch('/:id', async (req, res) => {
  const { title } = req.body as { title?: string };
  if (!title?.trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  try {
    const deck = await prisma.deck.update({
      where: { id: req.params.id },
      data: { title: title.trim() },
    });
    res.json(deck);
  } catch {
    res.status(500).json({ error: 'Failed to update deck' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.deck.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete deck' });
  }
});

router.get('/:id/cards', async (req, res) => {
  try {
    const cards = await prisma.card.findMany({
      where: { deckId: req.params.id },
      orderBy: { id: 'asc' },
    });
    res.json(cards);
  } catch {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

router.post('/:id/cards', async (req, res) => {
  const { frontText, frontImage, backText, backImage } = req.body as {
    frontText?: string | null;
    frontImage?: string | null;
    backText?: string | null;
    backImage?: string | null;
  };
  try {
    const card = await prisma.card.create({
      data: {
        deckId: req.params.id,
        frontText: frontText ?? null,
        frontImage: frontImage ?? null,
        backText: backText ?? null,
        backImage: backImage ?? null,
      },
    });
    res.status(201).json(card);
  } catch {
    res.status(500).json({ error: 'Failed to create card' });
  }
});

router.get('/:id/session', async (req, res) => {
  try {
    const [focusCards, learnedCards] = await Promise.all([
      prisma.card.findMany({ where: { deckId: req.params.id, status: 'focus' } }),
      prisma.card.findMany({ where: { deckId: req.params.id, status: 'learned' } }),
    ]);

    const learnedCount = learnedCards.length > 0
      ? Math.max(1, Math.floor(learnedCards.length * 0.2))
      : 0;
    const selectedLearned = shuffle(learnedCards).slice(0, learnedCount);
    const session = shuffle([...focusCards, ...selectedLearned]);

    res.json(session);
  } catch {
    res.status(500).json({ error: 'Failed to build session' });
  }
});

export default router;
