export interface Deck {
  id: string;
  title: string;
  createdAt: string;
  _count?: { cards: number };
}

export interface Card {
  id: string;
  deckId: string;
  frontText: string | null;
  frontImage: string | null;
  backText: string | null;
  backImage: string | null;
  status: 'focus' | 'learned';
  lastReviewedAt: string | null;
}
