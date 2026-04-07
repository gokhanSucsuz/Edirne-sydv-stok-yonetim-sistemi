/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Personnel from './pages/Personnel';
import UnitPanel from './pages/UnitPanel';
import Statistics from './pages/Statistics';
import Guide from './pages/Guide';
import MasterItems from './pages/MasterItems';
import TenderManagement from './pages/TenderManagement';

export default function App() {
  return (
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
