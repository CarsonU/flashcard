import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Card } from '../types';
import CardModal from './CardModal';

interface Props {
  deckId: string;
  deckTitle: string;
  onBack: () => void;
  onStudy: () => void;
}

const IconBack = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
  </svg>
);

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zM0 13v3h3l8.5-8.5-3-3L0 13z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg>
);

export default function DeckView({ deckId, deckTitle, onBack, onStudy }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCard, setModalCard] = useState<Card | null | 'new'>(null);

  useEffect(() => {
    api.decks.cards(deckId).then(setCards).finally(() => setLoading(false));
  }, [deckId]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this card?')) return;
    await api.cards.delete(id);
    setCards(prev => prev.filter(c => c.id !== id));
  }

  function handleSaved(card: Card) {
    setCards(prev =>
      prev.some(c => c.id === card.id)
        ? prev.map(c => c.id === card.id ? card : c)
        : [...prev, card]
    );
    setModalCard(null);
  }

  const focusCount = cards.filter(c => c.status === 'focus').length;
  const learnedCount = cards.filter(c => c.status === 'learned').length;

  if (loading) {
    return (
      <div className="page">
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={onBack}>
            <IconBack /> All Decks
          </button>
          <h1 className="page-title">{deckTitle}</h1>
          <p className="page-subtitle">
            {cards.length} card{cards.length !== 1 ? 's' : ''}
            {cards.length > 0 && (
              <> &middot; {focusCount} learning &middot; {learnedCount} learned</>
            )}
          </p>
        </div>
        <div className="deck-header-actions">
          <button className="btn btn-ghost" onClick={() => setModalCard('new')}>+ Add Card</button>
          {cards.length > 0 && (
            <button className="btn btn-primary" onClick={onStudy}>Study Now</button>
          )}
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No cards yet</div>
          <div className="empty-body">Add your first card to start studying</div>
          <button className="btn btn-primary" onClick={() => setModalCard('new')}>+ Add Card</button>
        </div>
      ) : (
        <div className="card-list">
          <div className="card-list-header">
            <span>Front</span>
            <span>Back</span>
            <span></span>
          </div>
          {cards.map(card => (
            <div key={card.id} className="card-item">
              <span className="card-item-text">
                {card.frontText ?? (card.frontImage ? '(image)' : '—')}
              </span>
              <span className="card-item-text muted">
                {card.backText ?? (card.backImage ? '(image)' : '—')}
              </span>
              <div className="card-item-actions">
                <span className={`badge ${card.status === 'focus' ? 'badge-focus' : 'badge-learned'}`}>
                  {card.status === 'focus' ? 'Learning' : 'Learned'}
                </span>
                <button className="btn-icon" title="Edit" onClick={() => setModalCard(card)}>
                  <IconEdit />
                </button>
                <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(card.id)}>
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalCard !== null && (
        <CardModal
          deckId={deckId}
          card={modalCard === 'new' ? null : modalCard}
          onSave={handleSaved}
          onClose={() => setModalCard(null)}
        />
      )}
    </div>
  );
}
