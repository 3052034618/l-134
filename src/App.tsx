import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ProductConfig from '@/pages/ProductConfig';
import CustomerConfig from '@/pages/CustomerConfig';
import BillingConfig from '@/pages/BillingConfig';
import CycleConfig from '@/pages/CycleConfig';
import DataFetch from '@/pages/DataFetch';
import Reconciliation from '@/pages/Reconciliation';
import DiscrepancyHandling from '@/pages/DiscrepancyHandling';
import ReportExport from '@/pages/ReportExport';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/config/products" element={<ProductConfig />} />
          <Route path="/config/customers" element={<CustomerConfig />} />
          <Route path="/config/billing" element={<BillingConfig />} />
          <Route path="/config/cycle" element={<CycleConfig />} />
          <Route path="/fetch" element={<DataFetch />} />
          <Route path="/reconciliation" element={<Reconciliation />} />
          <Route path="/discrepancy" element={<DiscrepancyHandling />} />
          <Route path="/export" element={<ReportExport />} />
        </Routes>
      </Layout>
    </Router>
  );
}
