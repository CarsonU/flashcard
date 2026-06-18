import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import type { Card } from '../types';
import CardModal from './CardModal';

interface Props {
  deckId: string;
  deckTitle: string;
  onBack: () => void;
  onStudy: (includeLearned: boolean) => void;
}

interface AddCardFormProps {
  deckId: string;
  onCardAdded: (card: Card) => void;
  onDone: () => void;
}

function cardPreview(text: string | null, image: string | null) {
  if (text) return text;
  if (image) return '(image)';
  return '-';
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
  const backTextRef = useRef<HTMLTextAreaElement>(null);
  const frontImgRef = useRef<HTMLInputElement>(null);
  const backImgRef = useRef<HTMLInputElement>(null);

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
    <section className={`add-panel${flash ? ' add-panel-flash' : ''}`} aria-label="Add cards">
      <div className="add-panel-header">
        <div>
          <span className="add-panel-title">Add Cards</span>
          {count > 0 && (
            <span className="add-panel-count">{count} card{count !== 1 ? 's' : ''} added</span>
          )}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>
          <Check size={16} aria-hidden="true" />
          Done
        </button>
      </div>

      <div className="add-panel-grid">
        <div className="add-panel-side">
          <label className="add-panel-label" htmlFor="front-text">Front</label>
          <textarea
            id="front-text"
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
            aria-label="Front image URL"
            onChange={e => setFrontImage(e.target.value)}
            onKeyDown={e => onKeyDown(e, backTextRef, backImgRef)}
          />
        </div>

        <div className="add-panel-divider" />

        <div className="add-panel-side">
          <label className="add-panel-label" htmlFor="back-text">Back</label>
          <textarea
            id="back-text"
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
            aria-label="Back image URL"
            onChange={e => setBackImage(e.target.value)}
            onKeyDown={e => onKeyDown(e, frontImgRef, frontTextRef)}
          />
        </div>
      </div>

      <div className="add-panel-footer">
        <span className="add-panel-hint desktop-only">
          <kbd className="kbd">Ctrl+Enter</kbd> save
          <span aria-hidden="true"> &middot; </span>
          <kbd className="kbd">Tab</kbd> next field
          <span aria-hidden="true"> &middot; </span>
          <kbd className="kbd">Esc</kbd> finish
        </span>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Card'}
        </button>
      </div>
    </section>
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
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page deck-page">
      <header className="page-header deck-page-header">
        <div className="deck-heading">
          <button type="button" className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" />
            All Decks
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
          {cards.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-primary btn-study"
                onClick={() => onStudy(includeLearned)}
                disabled={!canStudy}
                title={canStudy ? undefined : 'Turn on Review learned to study this deck'}
              >
                <Play size={17} fill="currentColor" aria-hidden="true" />
                Study Now
              </button>
              <label className="review-learned-toggle">
                <input
                  type="checkbox"
                  checked={includeLearned}
                  onChange={e => handleIncludeLearnedChange(e.target.checked)}
                />
                <span className="toggle-track" aria-hidden="true">
                  <span className="toggle-thumb" />
                </span>
                <span>Review learned</span>
              </label>
            </>
          )}
          {!addingCards && (
            <button type="button" className="btn btn-ghost btn-secondary-action" onClick={() => setAddingCards(true)}>
              <Plus size={17} aria-hidden="true" />
              Add Cards
            </button>
          )}
        </div>
      </header>

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
          <button type="button" className="btn btn-primary" onClick={() => setAddingCards(true)}>
            <Plus size={17} aria-hidden="true" />
            Add Cards
          </button>
        </div>
      ) : cards.length > 0 ? (
        <div className={`card-list${addingCards ? ' card-list-spaced' : ''}`}>
          <div className="card-list-header" aria-hidden="true">
            <span>Front</span>
            <span>Back</span>
            <span></span>
          </div>
          {cards.map(card => (
            <article key={card.id} className="card-item">
              <div className="card-item-main">
                <div className="card-side">
                  <span className="card-side-label">Front</span>
                  <span className="card-item-text">
                    {cardPreview(card.frontText, card.frontImage)}
                  </span>
                </div>
                <div className="card-side">
                  <span className="card-side-label">Back</span>
                  <span className="card-item-text muted">
                    {cardPreview(card.backText, card.backImage)}
                  </span>
                </div>
              </div>
              <div className="card-item-actions">
                <button
                  type="button"
                  className={`badge status-toggle ${card.status === 'focus' ? 'badge-focus' : 'badge-learned'}`}
                  onClick={() => handleToggleStatus(card)}
                  disabled={updatingStatusIds.has(card.id)}
                  title={`Mark as ${card.status === 'focus' ? 'Learned' : 'Learning'}`}
                  aria-label={`Mark card as ${card.status === 'focus' ? 'Learned' : 'Learning'}`}
                  aria-pressed={card.status === 'learned'}
                >
                  {card.status === 'focus' ? 'Learning' : 'Learned'}
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  title="Edit"
                  aria-label="Edit card"
                  onClick={() => setEditCard(card)}
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn-icon danger"
                  title="Delete"
                  aria-label="Delete card"
                  onClick={() => handleDelete(card.id)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </article>
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
