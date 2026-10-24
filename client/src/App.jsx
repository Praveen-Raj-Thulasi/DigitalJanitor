import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ScanWizard from './pages/ScanWizard';
import CleanupStudio from './pages/CleanupStudio';
import DuplicateDetective from './pages/DuplicateDetective';
import CleanHistory from './pages/CleanHistory';
import Achievements from './pages/Achievements';
import SettingsPage from './pages/SettingsPage';
import ClutterRadar from './pages/ClutterRadar';

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      {/* Protected App Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="scan" element={<ScanWizard />} />
        <Route path="radar" element={<ClutterRadar />} />
        <Route path="cleanup" element={<CleanupStudio />} />
        <Route path="duplicates" element={<DuplicateDetective />} />
        <Route path="history" element={<CleanHistory />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
