import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import DeckView from './components/DeckView';
import StudySession from './components/StudySession';
import ThemeToggle from './components/ThemeToggle';

type View =
  | { page: 'dashboard' }
  | { page: 'deck'; deckId: string; deckTitle: string }
  | { page: 'study'; deckId: string; deckTitle: string; includeLearned: boolean };

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [view, setView] = useState<View>({ page: 'dashboard' });
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  function renderView() {
    if (view.page === 'study') {
      return (
        <StudySession
          deckId={view.deckId}
          deckTitle={view.deckTitle}
          includeLearned={view.includeLearned}
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
          onStudy={includeLearned => setView({ page: 'study', deckId: view.deckId, deckTitle: view.deckTitle, includeLearned })}
        />
      );
    }

    return (
      <Dashboard
        onOpenDeck={(deckId, deckTitle) => setView({ page: 'deck', deckId, deckTitle })}
      />
    );
  }

  return (
    <>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      {renderView()}
    </>
  );
}
