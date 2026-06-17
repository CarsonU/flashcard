import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Deck } from '../types';

interface Props {
  onOpenDeck: (deckId: string, deckTitle: string) => void;
}

const IconCards = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="14" width="32" height="22" rx="4"/>
    <path d="M12 14V10a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v4"/>
    <line x1="14" y1="22" x2="30" y2="22"/>
    <line x1="14" y1="28" x2="24" y2="28"/>
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

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this deck and all its cards?')) return;
    await api.decks.delete(id);
    setDecks(prev => prev.filter(d => d.id !== id));
  }

  function startEdit(deck: Deck, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(deck.id);
    setEditTitle(deck.title);
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) { setEditingId(null); return; }
    const updated = await api.decks.update(id, editTitle.trim());
    setDecks(prev => prev.map(d => d.id === id ? { ...d, title: updated.title } : d));
    setEditingId(null);
  }

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
          <h1 className="page-title">My Decks</h1>
          <p className="page-subtitle">{decks.length} deck{decks.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Deck</button>
      </div>

      {showCreate && (
        <div className="inline-create">
          <input
            className="form-input"
            placeholder="Deck title..."
            value={newTitle}
            autoFocus
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setShowCreate(false); setNewTitle(''); }
            }}
          />
          <button className="btn btn-primary" onClick={handleCreate}>Create</button>
          <button className="btn btn-ghost" onClick={() => { setShowCreate(false); setNewTitle(''); }}>Cancel</button>
        </div>
      )}

      {decks.length === 0 && !showCreate ? (
        <div className="empty">
          <div className="empty-icon"><IconCards /></div>
          <div className="empty-title">No decks yet</div>
          <div className="empty-body">Create your first deck to get started</div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Deck</button>
        </div>
      ) : (
        <div className="deck-grid">
          {decks.map(deck => (
            <div key={deck.id} className="deck-card" onClick={() => onOpenDeck(deck.id, deck.title)}>
              {editingId === deck.id ? (
                <input
                  className="form-input"
                  value={editTitle}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === 'Enter') saveEdit(deck.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={() => saveEdit(deck.id)}
                />
              ) : (
                <div className="deck-card-title">{deck.title}</div>
              )}
              <div className="deck-card-meta">
                {deck._count?.cards ?? 0} card{(deck._count?.cards ?? 0) !== 1 ? 's' : ''}
              </div>
              <div className="deck-card-actions">
                <button className="btn-icon" title="Rename" onClick={e => startEdit(deck, e)}>
                  <IconEdit />
                </button>
                <button className="btn-icon danger" title="Delete" onClick={e => handleDelete(deck.id, e)}>
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
