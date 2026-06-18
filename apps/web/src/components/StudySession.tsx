import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '../api';
import type { Card } from '../types';

interface Props {
  deckId: string;
  deckTitle: string;
  includeLearned: boolean;
  onDone: () => void;
}

type ReviewStatus = 'focus' | 'learned';

function isTextEntryTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function isButtonTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button'));
}

export default function StudySession({ deckId, deckTitle, includeLearned, onDone }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [focusCount, setFocusCount] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const stateRef = useRef({ flipped, done, index, cards, reviewing });
  stateRef.current = { flipped, done, index, cards, reviewing };

  useEffect(() => {
    setLoading(true);
    setDone(false);
    setIndex(0);
    setFlipped(false);
    setFocusCount(0);
    setLearnedCount(0);

    api.decks.session(deckId, includeLearned).then(data => {
      setCards(data);
      setLoading(false);
      if (data.length === 0) setDone(true);
    });
  }, [deckId, includeLearned]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = stateRef.current;
      if (s.done || s.reviewing || isTextEntryTarget(e.target)) return;

      if (e.code === 'Space' && !s.flipped) {
        if (isButtonTarget(e.target)) return;
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

  async function doReview(status: ReviewStatus, idx: number, cardList: Card[]) {
    if (stateRef.current.reviewing) return;

    const card = cardList[idx];
    if (!card) return;

    setReviewing(true);
    try {
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
    } finally {
      setReviewing(false);
    }
  }

  function review(status: ReviewStatus) {
    doReview(status, stateRef.current.index, stateRef.current.cards);
  }

  function renderHeader(progress?: number, label?: string) {
    return (
      <header className="study-header">
        <button type="button" className="study-exit-btn" onClick={onDone} aria-label="Exit study session">
          <X size={18} aria-hidden="true" />
        </button>
        <div className="study-header-main">
          <span className="study-deck-name" title={deckTitle}>{deckTitle}</span>
          {typeof progress === 'number' && label && (
            <div className="study-progress-row">
              <div
                className="study-progress-wrap"
                role="progressbar"
                aria-label="Study progress"
                aria-valuemin={0}
                aria-valuemax={cards.length}
                aria-valuenow={index + 1}
              >
                <div className="study-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <span className="study-progress-label">{label}</span>
            </div>
          )}
        </div>
      </header>
    );
  }

  if (loading) {
    return (
      <div className="study-page">
        {renderHeader()}
        <main className="study-main">
          <p className="loading-text">Loading session...</p>
        </main>
      </div>
    );
  }

  if (done) {
    const total = focusCount + learnedCount;

    return (
      <div className="study-page">
        {renderHeader()}
        <main className="study-main">
          <section className="complete-wrap" aria-live="polite">
            <div className="complete-icon">
              <Check size={38} strokeWidth={2.6} aria-hidden="true" />
            </div>
            <h2 className="complete-title">Session Complete</h2>
            <p className="complete-sub">
              {total === 0
                ? 'This deck has no cards yet.'
                : `You reviewed ${total} card${total !== 1 ? 's' : ''}. Keep it up!`}
            </p>
            {total > 0 && (
              <div className="stats-row" aria-label="Session results">
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
            <button type="button" className="btn btn-primary complete-action" onClick={onDone}>
              Back to Deck
            </button>
          </section>
        </main>
      </div>
    );
  }

  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="study-page">
      {renderHeader(progress, `${index + 1} / ${cards.length}`)}

      <main className="study-main">
        <button
          type="button"
          className="flip-scene"
          aria-pressed={flipped}
          aria-label={flipped ? 'Answer revealed. Choose how well you knew it.' : 'Reveal answer'}
          onClick={() => {
            if (!flipped) setFlipped(true);
          }}
        >
          <div className={`flip-card${flipped ? ' flipped' : ''}`} key={index}>
            <div className="flip-face front">
              <span className="flip-face-label">Front</span>
              {card.frontImage && (
                <img className="flip-face-img" src={card.frontImage} alt="Card front visual" />
              )}
              {card.frontText && (
                <div className="flip-face-text">{card.frontText}</div>
              )}
              {!card.frontText && !card.frontImage && (
                <div className="flip-face-text muted">(empty)</div>
              )}
            </div>
            <div className="flip-face back">
              <span className="flip-face-label">Back</span>
              {card.backImage && (
                <img className="flip-face-img" src={card.backImage} alt="Card back visual" />
              )}
              {card.backText && (
                <div className="flip-face-text">{card.backText}</div>
              )}
              {!card.backText && !card.backImage && (
                <div className="flip-face-text muted">(empty)</div>
              )}
            </div>
          </div>
        </button>

        {!flipped ? (
          <p className="card-hint">
            Tap or click the card to reveal the answer
            <span className="desktop-shortcut">
              <kbd className="kbd">Space</kbd>
            </span>
          </p>
        ) : (
          <div className="review-btns" aria-label="Rate this card">
            <button
              type="button"
              className="review-btn review-btn-focus"
              onClick={() => review('focus')}
              disabled={reviewing}
            >
              Still Learning
              <span className="review-btn-sub mobile-copy">Review again soon</span>
              <span className="review-btn-sub desktop-copy">Left arrow</span>
            </button>
            <button
              type="button"
              className="review-btn review-btn-learned"
              onClick={() => review('learned')}
              disabled={reviewing}
            >
              Got It
              <span className="review-btn-sub mobile-copy">Mark as learned</span>
              <span className="review-btn-sub desktop-copy">Right arrow</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
