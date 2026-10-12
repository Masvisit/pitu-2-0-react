import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { usePlanStore } from './store/planStore.js';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import IACoachPage from './pages/IACoachPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import Navbar from './components/Navbar';

export default function App() {
  const { currentUser, isAuthenticated, initAuth } = useAuthStore();
  const carrega = usePlanStore((s) => s.carrega);
  const [pagina, setPagina] = useState('dashboard');

  useEffect(() => { initAuth(); }, [initAuth]);

  useEffect(() => {
    if (currentUser?.id) carrega(currentUser.id);
  }, [currentUser?.id, carrega]);

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar currentPage={pagina} setCurrentPage={setPagina} />
      <main>
        {pagina === 'dashboard' && <DashboardPage onVesA={setPagina} />}
        {pagina === 'calendar' && <CalendarPage />}
        {pagina === 'coach' && <IACoachPage />}
        {pagina === 'progress' && <ProgressPage />}
        {pagina === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
