import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';

// Components
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './components/Auth/LoginPage';
import { SignupPage } from './components/Auth/SignupPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { WarehouseDashboard } from './pages/WarehouseDashboard';
import { StaffManagement } from './pages/StaffManagement';
import { MyTasks } from './pages/MyTasks';
import { Products } from './pages/Products';
import { Receipts } from './pages/operations/Receipts';
import { Deliveries } from './pages/operations/Deliveries';
import { Adjustments } from './pages/operations/Adjustments';
import { MoveHistory } from './pages/MoveHistory';
import { Settings } from './pages/Settings';
// Staff-specific pages
import { QuickReceive } from './pages/QuickReceive';
import { QuickPick } from './pages/QuickPick';
import { StockCount } from './pages/StockCount';
import { MyActivity } from './pages/MyActivity';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>

            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/register" element={<SignupPage />} />

            {/* Protected App Routes */}
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Default redirect to dashboard */}
              <Route index element={<Navigate to="dashboard" replace />} />

              {/* App Pages */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="warehouse-dashboard" element={<WarehouseDashboard />} />
              <Route path="staff-management" element={<StaffManagement />} />
              <Route path="my-tasks" element={<MyTasks />} />
              <Route path="products" element={<Products />} />
              <Route path="operations/receipts" element={<Receipts />} />
              <Route path="operations/deliveries" element={<Deliveries />} />
              <Route path="operations/adjustments" element={<Adjustments />} />
              <Route path="move-history" element={<MoveHistory />} />
              <Route path="settings" element={<Settings />} />
              {/* Staff-specific routes */}
              <Route path="quick-receive" element={<QuickReceive />} />
              <Route path="quick-pick" element={<QuickPick />} />
              <Route path="stock-count" element={<StockCount />} />
              <Route path="my-history" element={<MyActivity />} />

              {/* Fallback for unknown routes inside layout */}
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
