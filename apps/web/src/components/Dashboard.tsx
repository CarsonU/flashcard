import { useEffect, useState } from 'react';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import type { Deck } from '../types';

interface Props {
  onOpenDeck: (deckId: string, deckTitle: string) => void;
}

export default function Dashboard({ onOpenDeck }: Props) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    api.decks.list().then(setDecks).finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newTitle.trim()) return;

    const deck = await api.decks.create(newTitle.trim());
    setDecks(prev => [{ ...deck, _count: { cards: 0 } }, ...prev]);
    setNewTitle('');
    setShowCreate(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this deck and all its cards?')) return;

    await api.decks.delete(id);
    setDecks(prev => prev.filter(d => d.id !== id));
  }

  function startEdit(deck: Deck) {
    setEditingId(deck.id);
    setEditTitle(deck.title);
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    const updated = await api.decks.update(id, editTitle.trim());
    setDecks(prev => prev.map(d => d.id === id ? { ...d, title: updated.title } : d));
    setEditingId(null);
  }

  if (loading) {
    return (
      <div className="page">
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">My Decks</h1>
          <p className="page-subtitle">{decks.length} deck{decks.length !== 1 ? 's' : ''}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={17} aria-hidden="true" />
          New Deck
        </button>
      </header>

      {showCreate && (
        <div className="inline-create" role="group" aria-label="Create a new deck">
          <input
            className="form-input"
            placeholder="Deck title..."
            value={newTitle}
            autoFocus
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') {
                setShowCreate(false);
                setNewTitle('');
              }
            }}
          />
          <button type="button" className="btn btn-primary" onClick={handleCreate}>Create</button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setShowCreate(false);
              setNewTitle('');
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {decks.length === 0 && !showCreate ? (
        <div className="empty">
          <div className="empty-icon">
            <Layers size={46} strokeWidth={1.6} aria-hidden="true" />
          </div>
          <div className="empty-title">No decks yet</div>
          <div className="empty-body">Create your first deck to get started</div>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={17} aria-hidden="true" />
            New Deck
          </button>
        </div>
      ) : (
        <div className="deck-grid">
          {decks.map(deck => {
            const cardCount = deck._count?.cards ?? 0;
            const isEditing = editingId === deck.id;

            return (
              <article key={deck.id} className={`deck-card${isEditing ? ' is-editing' : ''}`}>
                {isEditing ? (
                  <input
                    className="form-input deck-title-input"
                    value={editTitle}
                    autoFocus
                    aria-label={`Rename ${deck.title}`}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(deck.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => saveEdit(deck.id)}
                  />
                ) : (
                  <button
                    type="button"
                    className="deck-card-main"
                    onClick={() => onOpenDeck(deck.id, deck.title)}
                    aria-label={`Open ${deck.title}`}
                  >
                    <span className="deck-card-title">{deck.title}</span>
                    <span className="deck-card-meta">
                      {cardCount} card{cardCount !== 1 ? 's' : ''}
                    </span>
                  </button>
                )}

                {!isEditing && (
                  <div className="deck-card-actions" aria-label={`${deck.title} actions`}>
                    <button
                      type="button"
                      className="btn-icon"
                      title="Rename"
                      aria-label={`Rename ${deck.title}`}
                      onClick={() => startEdit(deck)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon danger"
                      title="Delete"
                      aria-label={`Delete ${deck.title}`}
                      onClick={() => handleDelete(deck.id)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
