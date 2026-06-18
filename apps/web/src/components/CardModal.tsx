import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api';
import type { Card } from '../types';

interface Props {
  deckId: string;
  card: Card | null;
  onSave: (card: Card) => void;
  onClose: () => void;
}

export default function CardModal({ deckId, card, onSave, onClose }: Props) {
  const [frontText, setFrontText] = useState(card?.frontText ?? '');
  const [frontImage, setFrontImage] = useState(card?.frontImage ?? '');
  const [backText, setBackText] = useState(card?.backText ?? '');
  const [backImage, setBackImage] = useState(card?.backImage ?? '');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        frontText: frontText.trim() || null,
        frontImage: frontImage.trim() || null,
        backText: backText.trim() || null,
        backImage: backImage.trim() || null,
      };
      const saved = card
        ? await api.cards.update(card.id, data)
        : await api.decks.createCard(deckId, data);
      onSave(saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={handleSubmit} aria-labelledby="card-modal-title">
        <div className="modal-header">
          <h2 id="card-modal-title" className="modal-title">{card ? 'Edit Card' : 'New Card'}</h2>
          <button type="button" className="btn-icon modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-card-grid">
          <div className="modal-card-side">
            <div className="form-section">Front</div>
            <div className="form-group">
              <label className="form-label" htmlFor="modal-front-text">Text</label>
              <textarea
                id="modal-front-text"
                ref={frontTextRef}
                className="form-textarea"
                rows={3}
                placeholder="What goes on the front?"
                value={frontText}
                autoFocus
                onChange={e => setFrontText(e.target.value)}
                onKeyDown={e => handleTab(e, backImgRef, backTextRef)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="modal-front-image">Image URL (optional)</label>
              <input
                id="modal-front-image"
                ref={frontImgRef}
                className="form-input"
                type="url"
                placeholder="https://..."
                value={frontImage}
                onChange={e => setFrontImage(e.target.value)}
                onKeyDown={e => handleTab(e, backTextRef, backImgRef)}
              />
            </div>
          </div>

          <div className="modal-card-side">
            <div className="form-section">Back</div>
            <div className="form-group">
              <label className="form-label" htmlFor="modal-back-text">Text</label>
              <textarea
                id="modal-back-text"
                ref={backTextRef}
                className="form-textarea"
                rows={3}
                placeholder="What goes on the back?"
                value={backText}
                onChange={e => setBackText(e.target.value)}
                onKeyDown={e => handleTab(e, frontTextRef, frontImgRef)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="modal-back-image">Image URL (optional)</label>
              <input
                id="modal-back-image"
                ref={backImgRef}
                className="form-input"
                type="url"
                placeholder="https://..."
                value={backImage}
                onChange={e => setBackImage(e.target.value)}
                onKeyDown={e => handleTab(e, frontImgRef, frontTextRef)}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : card ? 'Save Changes' : 'Create Card'}
          </button>
        </div>
      </form>
    </div>
  );
}
