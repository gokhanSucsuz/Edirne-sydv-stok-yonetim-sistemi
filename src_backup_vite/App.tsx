/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Personnel from './pages/Personnel';
import UnitPanel from './pages/UnitPanel';
import Statistics from './pages/Statistics';
import Guide from './pages/Guide';
import Backup from './pages/Backup';
import MasterItems from './pages/MasterItems';
import TenderManagement from './pages/TenderManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppRoutes() {
  const { user, personnel, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!personnel) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="personnel" element={<Personnel />} />
        <Route path="master-items" element={<MasterItems />} />
        <Route path="tenders" element={<TenderManagement />} />
        <Route path="unit/vefa" element={<UnitPanel unit="Vefa Temizlik" />} />
        <Route path="unit/asevi" element={<UnitPanel unit="Aşevi" />} />
        <Route path="unit/dergah" element={<UnitPanel unit="Dergah" />} />
        <Route path="unit/bagis" element={<UnitPanel unit="Bağış" />} />
        <Route path="unit/vakif" element={<UnitPanel unit="Vakıf" />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="guide" element={<Guide />} />
        <Route path="backup" element={<Backup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
