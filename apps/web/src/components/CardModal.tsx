import { useRef, useState } from 'react';
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
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form className="modal" onSubmit={handleSubmit}>
        <h2 className="modal-title">{card ? 'Edit Card' : 'New Card'}</h2>

        <div className="modal-card-grid">
          <div className="form-section">Front</div>
          <div className="form-section">Back</div>

          <div className="form-group">
            <label className="form-label">Text</label>
            <textarea
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
            <label className="form-label">Text</label>
            <textarea
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
            <label className="form-label">Image URL (optional)</label>
            <input
              ref={frontImgRef}
              className="form-input"
              type="url"
              placeholder="https://..."
              value={frontImage}
              onChange={e => setFrontImage(e.target.value)}
              onKeyDown={e => handleTab(e, backTextRef, backImgRef)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Image URL (optional)</label>
            <input
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
