import React, { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { ChatContainer } from './components/chat/ChatContainer';

export const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'agent'>('landing');

  return (
    <div>
      {view === 'landing' ? (
        <LandingPage onStartDemo={() => setView('agent')} />
      ) : (
        <ChatContainer onBackToLanding={() => setView('landing')} />
      )}
    </div>
  );
};

export default App;
