import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { Card } from '../types';
import CardModal from './CardModal';

interface Props {
  deckId: string;
  deckTitle: string;
  onBack: () => void;
  onStudy: (includeLearned: boolean) => void;
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

interface AddCardFormProps {
  deckId: string;
  onCardAdded: (card: Card) => void;
  onDone: () => void;
}

function AddCardForm({ deckId, onCardAdded, onDone }: AddCardFormProps) {
  const [frontText, setFrontText] = useState('');
  const [frontImage, setFrontImage] = useState('');
  const [backText, setBackText] = useState('');
  const [backImage, setBackImage] = useState('');
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const frontTextRef = useRef<HTMLTextAreaElement>(null);
  const backTextRef  = useRef<HTMLTextAreaElement>(null);
  const frontImgRef  = useRef<HTMLInputElement>(null);
  const backImgRef   = useRef<HTMLInputElement>(null);

  // Tab order: frontText → backText → frontImg → backImg → (wrap)
  function handleTab(
    e: React.KeyboardEvent,
    prev: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
    next: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>
  ) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    (e.shiftKey ? prev : next).current?.focus();
  }

  useEffect(() => {
    frontTextRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDone();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  async function save() {
    const hasContent = frontText.trim() || frontImage.trim() || backText.trim() || backImage.trim();
    if (!hasContent || saving) return;
    setSaving(true);
    try {
      const card = await api.decks.createCard(deckId, {
        frontText: frontText.trim() || null,
        frontImage: frontImage.trim() || null,
        backText: backText.trim() || null,
        backImage: backImage.trim() || null,
      });
      onCardAdded(card);
      setFrontText('');
      setFrontImage('');
      setBackText('');
      setBackImage('');
      setCount(c => c + 1);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      frontTextRef.current?.focus();
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(
    e: React.KeyboardEvent,
    prev: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
    next: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>
  ) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      save();
      return;
    }
    handleTab(e, prev, next);
  }

  return (
    <div className={`add-panel${flash ? ' add-panel-flash' : ''}`}>
      <div className="add-panel-header">
        <span className="add-panel-title">Add Cards</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {count > 0 && (
            <span className="add-panel-count">{count} card{count !== 1 ? 's' : ''} added</span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onDone}>Done</button>
        </div>
      </div>

      <div className="add-panel-grid">
        <div className="add-panel-side">
          <label className="add-panel-label">Front</label>
          <textarea
            ref={frontTextRef}
            className="add-panel-textarea"
            placeholder="Front side of the card..."
            value={frontText}
            rows={3}
            onChange={e => setFrontText(e.target.value)}
            onKeyDown={e => onKeyDown(e, backImgRef, backTextRef)}
          />
          <input
            ref={frontImgRef}
            className="add-panel-image-input"
            placeholder="Image URL (optional)"
            type="url"
            value={frontImage}
            onChange={e => setFrontImage(e.target.value)}
            onKeyDown={e => onKeyDown(e, backTextRef, backImgRef)}
          />
        </div>

        <div className="add-panel-divider" />

        <div className="add-panel-side">
          <label className="add-panel-label">Back</label>
          <textarea
            ref={backTextRef}
            className="add-panel-textarea"
            placeholder="Back side of the card..."
            value={backText}
            rows={3}
            onChange={e => setBackText(e.target.value)}
            onKeyDown={e => onKeyDown(e, frontTextRef, frontImgRef)}
          />
          <input
            ref={backImgRef}
            className="add-panel-image-input"
            placeholder="Image URL (optional)"
            type="url"
            value={backImage}
            onChange={e => setBackImage(e.target.value)}
            onKeyDown={e => onKeyDown(e, frontImgRef, frontTextRef)}
          />
        </div>
      </div>

      <div className="add-panel-footer">
        <span className="add-panel-hint">
          <kbd className="kbd">Ctrl+Enter</kbd> save &nbsp;·&nbsp;
          <kbd className="kbd">Tab</kbd> next field &nbsp;·&nbsp;
          <kbd className="kbd">Esc</kbd> finish
        </span>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Card'}
        </button>
      </div>
    </div>
  );
}

export default function DeckView({ deckId, deckTitle, onBack, onStudy }: Props) {
  const reviewLearnedStorageKey = `flashcard:review-learned:${deckId}`;
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCards, setAddingCards] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [includeLearned, setIncludeLearned] = useState(() => (
    localStorage.getItem(reviewLearnedStorageKey) === 'true'
  ));
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setLoading(true);
    api.decks.cards(deckId).then(data => {
      setCards(data);
      setLoading(false);
    });
  }, [deckId]);

  useEffect(() => {
    setIncludeLearned(localStorage.getItem(reviewLearnedStorageKey) === 'true');
  }, [reviewLearnedStorageKey]);

  function handleCardAdded(card: Card) {
    setCards(prev => [...prev, card]);
  }

  function handleCardEdited(card: Card) {
    setCards(prev => prev.map(c => c.id === card.id ? card : c));
    setEditCard(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this card?')) return;
    await api.cards.delete(id);
    setCards(prev => prev.filter(c => c.id !== id));
  }

  function handleIncludeLearnedChange(next: boolean) {
    setIncludeLearned(next);
    localStorage.setItem(reviewLearnedStorageKey, String(next));
  }

  async function handleToggleStatus(card: Card) {
    if (updatingStatusIds.has(card.id)) return;
    const status = card.status === 'focus' ? 'learned' : 'focus';
    setUpdatingStatusIds(prev => new Set(prev).add(card.id));
    try {
      const updated = await api.cards.updateStatus(card.id, status, { markReviewed: false });
      setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    } finally {
      setUpdatingStatusIds(prev => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
  }

  const focusCount = cards.filter(c => c.status === 'focus').length;
  const learnedCount = cards.filter(c => c.status === 'learned').length;
  const canStudy = includeLearned ? cards.length > 0 : focusCount > 0;

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
          {!addingCards && (
            <button className="btn btn-ghost" onClick={() => setAddingCards(true)}>
              + Add Cards
            </button>
          )}
          {cards.length > 0 && (
            <>
              <label className="review-learned-toggle">
                <input
                  type="checkbox"
                  checked={includeLearned}
                  onChange={e => handleIncludeLearnedChange(e.target.checked)}
                />
                <span>Review learned</span>
              </label>
              <button
                className="btn btn-primary"
                onClick={() => onStudy(includeLearned)}
                disabled={!canStudy}
                title={canStudy ? undefined : 'Turn on Review learned to study this deck'}
              >
                Study Now
              </button>
            </>
          )}
        </div>
      </div>

      {addingCards && (
        <AddCardForm
          deckId={deckId}
          onCardAdded={handleCardAdded}
          onDone={() => setAddingCards(false)}
        />
      )}

      {cards.length === 0 && !addingCards ? (
        <div className="empty">
          <div className="empty-title">No cards yet</div>
          <div className="empty-body">Add your first card to start studying</div>
          <button className="btn btn-primary" onClick={() => setAddingCards(true)}>+ Add Cards</button>
        </div>
      ) : cards.length > 0 ? (
        <div className="card-list" style={{ marginTop: addingCards ? 24 : 0 }}>
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
                <button
                  type="button"
                  className={`badge status-toggle ${card.status === 'focus' ? 'badge-focus' : 'badge-learned'}`}
                  onClick={() => handleToggleStatus(card)}
                  disabled={updatingStatusIds.has(card.id)}
                  title={`Mark as ${card.status === 'focus' ? 'Learned' : 'Learning'}`}
                  aria-label={`Mark card as ${card.status === 'focus' ? 'Learned' : 'Learning'}`}
                >
                  {card.status === 'focus' ? 'Learning' : 'Learned'}
                </button>
                <button className="btn-icon" title="Edit" onClick={() => setEditCard(card)}>
                  <IconEdit />
                </button>
                <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(card.id)}>
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {editCard && (
        <CardModal
          deckId={deckId}
          card={editCard}
          onSave={handleCardEdited}
          onClose={() => setEditCard(null)}
        />
      )}
    </div>
  );
}
