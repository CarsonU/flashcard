import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.patch('/:id', async (req, res) => {
  const { frontText, frontImage, backText, backImage } = req.body as {
    frontText?: string | null;
    frontImage?: string | null;
    backText?: string | null;
    backImage?: string | null;
  };
  try {
    const card = await prisma.card.update({
      where: { id: req.params.id },
      data: { frontText, frontImage, backText, backImage },
    });
    res.json(card);
  } catch {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { status, markReviewed } = req.body as { status?: string; markReviewed?: boolean };
  if (status !== 'focus' && status !== 'learned') {
    res.status(400).json({ error: 'status must be focus or learned' });
    return;
  }
  try {
    const data = markReviewed === false
      ? { status }
      : { status, lastReviewedAt: new Date() };
    const card = await prisma.card.update({
      where: { id: req.params.id },
      data,
    });
    res.json(card);
  } catch {
    res.status(500).json({ error: 'Failed to update card status' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.card.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

export default router;
