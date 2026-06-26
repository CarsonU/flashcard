import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, Download, MoreHorizontal, Pencil, Play, Plus, Trash2, Upload } from 'lucide-react';
import { api } from '../api';
import { cardsToCsv, parseCsv } from '../csv';
import type { Card } from '../types';
import CardModal from './CardModal';

type SortMode = 'original' | 'alpha' | 'status';

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void save();
  }

  function handleSaveShortcut(e: React.KeyboardEvent<HTMLFormElement>) {
    const isEnter = e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter';
    if (!(e.ctrlKey || e.metaKey) || !isEnter) return;

    e.preventDefault();
    e.stopPropagation();
    void save();
  }

  function onKeyDown(
    e: React.KeyboardEvent,
    prev: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
    next: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>
  ) {
    handleTab(e, prev, next);
  }

  return (
    <form
      className={`add-panel${flash ? ' add-panel-flash' : ''}`}
      aria-label="Add cards"
      onSubmit={handleSubmit}
      onKeyDownCapture={handleSaveShortcut}
    >
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
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Card'}
        </button>
      </div>
    </form>
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
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('original');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [importing, setImporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function handleCardAdded(card: Card) {
    setCards(prev => [...prev, card]);
  }

  function handleExport() {
    const csv = cardsToCsv(cards);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeTitle = deckTitle.trim().replace(/[^a-z0-9-_ ]/gi, '').trim() || 'deck';
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeTitle}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        alert('No cards found in that CSV file.');
        return;
      }
      let added = 0;
      for (const row of rows) {
        const card = await api.decks.createCard(deckId, {
          frontText: row.front || null,
          backText: row.back || null,
        });
        handleCardAdded(card);
        added++;
      }
      alert(`Imported ${added} card${added !== 1 ? 's' : ''}.`);
    } catch {
      alert('Could not import that file. Make sure it is a valid CSV.');
    } finally {
      setImporting(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void handleImport(file);
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
  const canStudy = includeLearned ? cards.length > 0 : focusCount > 0;

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? cards.filter(c =>
          `${c.frontText ?? ''} ${c.backText ?? ''}`.toLowerCase().includes(q)
        )
      : cards;

    let sorted: Card[];
    if (sortMode === 'alpha') {
      sorted = [...filtered].sort((a, b) => {
        const af = (a.frontText ?? '').trim();
        const bf = (b.frontText ?? '').trim();
        if (!af && !bf) return 0;
        if (!af) return 1;
        if (!bf) return -1;
        return af.localeCompare(bf, undefined, { sensitivity: 'base' });
      });
    } else if (sortMode === 'status') {
      const rank = (c: Card) => (c.status === 'focus' ? 0 : 1);
      sorted = [...filtered].sort((a, b) => rank(a) - rank(b));
    } else {
      sorted = filtered;
    }

    return sortDir === 'desc' ? [...sorted].reverse() : sorted;
  }, [cards, query, sortMode, sortDir]);

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
          <div className="deck-menu" ref={menuRef}>
            <button
              type="button"
              className="btn-icon deck-menu-trigger"
              onClick={() => setMenuOpen(open => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="More actions"
              title="More actions"
            >
              <MoreHorizontal size={18} aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className="deck-menu-popover" role="menu">
                <button
                  type="button"
                  className="deck-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  disabled={importing}
                >
                  <Upload size={16} aria-hidden="true" />
                  {importing ? 'Importing...' : 'Import CSV'}
                </button>
                <button
                  type="button"
                  className="deck-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    handleExport();
                  }}
                  disabled={cards.length === 0}
                >
                  <Download size={16} aria-hidden="true" />
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="visually-hidden-input"
          onChange={onFileChange}
        />
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
        <>
          <div className={`card-toolbar${addingCards ? ' card-toolbar-spaced' : ''}`}>
            <input
              type="search"
              className="card-search"
              placeholder="Search cards..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search cards"
            />
            <label className="card-sort">
              <span className="card-sort-label">Sort</span>
              <select
                className="card-sort-select"
                value={sortMode}
                onChange={e => setSortMode(e.target.value as SortMode)}
              >
                <option value="original">Originally added</option>
                <option value="alpha">A–Z</option>
                <option value="status">Learning / Learned</option>
              </select>
              <button
                type="button"
                className="card-sort-dir"
                onClick={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
                aria-label={sortDir === 'asc' ? 'Sort descending' : 'Sort ascending'}
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDir === 'asc'
                  ? <ArrowUp size={16} aria-hidden="true" />
                  : <ArrowDown size={16} aria-hidden="true" />}
              </button>
            </label>
          </div>

          {visibleCards.length === 0 ? (
            <div className="empty">
              <div className="empty-title">No cards match</div>
              <div className="empty-body">Try a different search.</div>
            </div>
          ) : (
        <div className="card-list">
          <div className="card-list-header" aria-hidden="true">
            <span>Front</span>
            <span>Back</span>
            <span></span>
          </div>
          {visibleCards.map(card => (
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
          )}
        </>
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
