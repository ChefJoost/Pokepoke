import { useState } from 'react';
import { BottomNav } from './components/BottomNav.jsx';
import { ToastContainer } from './components/Toast.jsx';
import { useToast } from './hooks/useToast.js';
import { Dashboard } from './pages/Dashboard.jsx';
import { Collection } from './pages/Collection.jsx';
import { CardForm } from './pages/CardForm.jsx';
import { CardDetail } from './pages/CardDetail.jsx';
import { Sets } from './pages/Sets.jsx';
import { Wishlist } from './pages/Wishlist.jsx';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [editCardId, setEditCardId] = useState(null);
  const { toasts, toast } = useToast();

  function openCardDetail(id) {
    setSelectedCardId(id);
    setPage('card-detail');
  }

  function openCardEdit(id) {
    setEditCardId(id);
    setPage('card-edit');
  }

  function openAddCard() {
    setEditCardId(null);
    setPage('add');
  }

  function onCardSaved() {
    setPage('collection');
    setEditCardId(null);
  }

  function onCardDeleted() {
    setPage('collection');
    setSelectedCardId(null);
  }

  function navigateTo(p) {
    if (p === 'add') {
      openAddCard();
    } else {
      setPage(p);
    }
  }

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            setPage={navigateTo}
            setEditCard={({ id }) => openCardDetail(id)}
          />
        );
      case 'collection':
        return <Collection onCardClick={openCardDetail} />;
      case 'add':
        return (
          <CardForm
            cardId={null}
            onSaved={onCardSaved}
            onCancel={() => setPage('collection')}
            toast={toast}
          />
        );
      case 'card-edit':
        return (
          <CardForm
            cardId={editCardId}
            onSaved={() => {
              setPage('card-detail');
            }}
            onCancel={() => setPage('card-detail')}
            toast={toast}
          />
        );
      case 'card-detail':
        return (
          <CardDetail
            cardId={selectedCardId}
            onEdit={(id) => { setEditCardId(id); setPage('card-edit'); }}
            onBack={() => setPage('collection')}
            onDelete={onCardDeleted}
            toast={toast}
          />
        );
      case 'sets':
        return <Sets />;
      case 'wishlist':
        return <Wishlist toast={toast} />;
      default:
        return <Dashboard setPage={navigateTo} setEditCard={({ id }) => openCardDetail(id)} />;
    }
  }

  const navPage = ['dashboard', 'collection', 'sets', 'wishlist'].includes(page) ? page : '';

  return (
    <div className="app-shell">
      <main className="page-content">
        {renderPage()}
      </main>
      <BottomNav page={navPage} setPage={navigateTo} />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
