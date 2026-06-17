import { useState } from 'react';
import Dashboard from './components/Dashboard';
import DeckView from './components/DeckView';
import StudySession from './components/StudySession';

type View =
  | { page: 'dashboard' }
  | { page: 'deck'; deckId: string; deckTitle: string }
  | { page: 'study'; deckId: string; deckTitle: string };

export default function App() {
  const [view, setView] = useState<View>({ page: 'dashboard' });

  if (view.page === 'study') {
    return (
      <StudySession
        deckId={view.deckId}
        deckTitle={view.deckTitle}
        onDone={() => setView({ page: 'deck', deckId: view.deckId, deckTitle: view.deckTitle })}
      />
    );
  }

  if (view.page === 'deck') {
    return (
      <DeckView
        deckId={view.deckId}
        deckTitle={view.deckTitle}
        onBack={() => setView({ page: 'dashboard' })}
        onStudy={() => setView({ page: 'study', deckId: view.deckId, deckTitle: view.deckTitle })}
      />
    );
  }

  return (
    <Dashboard
      onOpenDeck={(deckId, deckTitle) => setView({ page: 'deck', deckId, deckTitle })}
    />
  );
}
