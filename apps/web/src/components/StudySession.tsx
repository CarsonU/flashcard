import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { Card } from '../types';

interface Props {
  deckId: string;
  deckTitle: string;
  onDone: () => void;
}

const IconCheck = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function StudySession({ deckId, deckTitle, onDone }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [focusCount, setFocusCount] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [done, setDone] = useState(false);

  // Stable ref so keyboard handler always sees latest state
  const stateRef = useRef({ flipped, done, index, cards });
  stateRef.current = { flipped, done, index, cards };

  useEffect(() => {
    api.decks.session(deckId).then(data => {
      setCards(data);
      setLoading(false);
      if (data.length === 0) setDone(true);
    });
  }, [deckId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = stateRef.current;
      if (s.done) return;
      if (e.code === 'Space' && !s.flipped) {
        e.preventDefault();
        setFlipped(true);
      }
      if (e.code === 'ArrowLeft' && s.flipped) {
        e.preventDefault();
        doReview('focus', s.index, s.cards);
      }
      if (e.code === 'ArrowRight' && s.flipped) {
        e.preventDefault();
        doReview('learned', s.index, s.cards);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function doReview(status: 'focus' | 'learned', idx: number, cardList: Card[]) {
    const card = cardList[idx];
    await api.cards.updateStatus(card.id, status);
    if (status === 'focus') setFocusCount(c => c + 1);
    else setLearnedCount(c => c + 1);
    const next = idx + 1;
    if (next >= cardList.length) {
      setDone(true);
    } else {
      setIndex(next);
      setFlipped(false);
    }
  }

  function review(status: 'focus' | 'learned') {
    doReview(status, stateRef.current.index, stateRef.current.cards);
  }

  if (loading) {
    return (
      <div className="study-page">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Loading session...
        </div>
      </div>
    );
  }

  if (done) {
    const total = focusCount + learnedCount;
    return (
      <div className="study-page">
        <div className="study-header">
          <span className="study-deck-name">{deckTitle}</span>
        </div>
        <div className="study-main">
          <div className="complete-wrap">
            <div className="complete-icon"><IconCheck /></div>
            <h2 className="complete-title">Session Complete</h2>
            <p className="complete-sub">
              {total === 0
                ? 'This deck has no cards yet.'
                : `You reviewed ${total} card${total !== 1 ? 's' : ''}. Keep it up!`}
            </p>
            {total > 0 && (
              <div className="stats-row">
                <div className="stat-box focus">
                  <div className="stat-val">{focusCount}</div>
                  <div className="stat-lbl">Still Learning</div>
                </div>
                <div className="stat-box learned">
                  <div className="stat-val">{learnedCount}</div>
                  <div className="stat-lbl">Got It</div>
                </div>
              </div>
            )}
            <button className="btn btn-primary" style={{ fontSize: 15, padding: '13px 32px' }} onClick={onDone}>
              Back to Deck
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[index];
  const progress = (index / cards.length) * 100;

  return (
    <div className="study-page">
      <div className="study-header">
        <span className="study-deck-name">{deckTitle}</span>
        <div className="study-progress-wrap">
          <div className="study-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <span className="study-progress-label">{index + 1} / {cards.length}</span>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={onDone}>Exit</button>
      </div>

      <div className="study-main">
        <div
          className="flip-scene"
          tabIndex={0}
          role="button"
          aria-label={flipped ? 'Card back — rate yourself below' : 'Card front — click or press Space to flip'}
          onClick={() => setFlipped(f => !f)}
          onKeyDown={e => { if (e.key === 'Enter') setFlipped(f => !f); }}
        >
          <div className={`flip-card${flipped ? ' flipped' : ''}`}>
            <div className="flip-face front">
              <span className="flip-face-label">Front</span>
              {card.frontImage && (
                <img className="flip-face-img" src={card.frontImage} alt="card front" />
              )}
              {card.frontText && (
                <div className="flip-face-text">{card.frontText}</div>
              )}
              {!card.frontText && !card.frontImage && (
                <div className="flip-face-text" style={{ color: 'var(--text-secondary)' }}>(empty)</div>
              )}
            </div>
            <div className="flip-face back">
              <span className="flip-face-label">Back</span>
              {card.backImage && (
                <img className="flip-face-img" src={card.backImage} alt="card back" />
              )}
              {card.backText && (
                <div className="flip-face-text">{card.backText}</div>
              )}
              {!card.backText && !card.backImage && (
                <div className="flip-face-text" style={{ color: 'var(--text-secondary)' }}>(empty)</div>
              )}
            </div>
          </div>
        </div>

        {!flipped ? (
          <p className="card-hint">
            Click card or press <kbd className="kbd">Space</kbd> to reveal answer
          </p>
        ) : (
          <div className="review-btns">
            <button className="review-btn review-btn-focus" onClick={() => review('focus')}>
              Still Learning
              <span className="review-btn-sub">← Left arrow or click</span>
            </button>
            <button className="review-btn review-btn-learned" onClick={() => review('learned')}>
              Got It
              <span className="review-btn-sub">Right arrow or click →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
