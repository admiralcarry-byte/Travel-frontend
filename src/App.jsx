import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SystemStatsProvider } from './contexts/SystemStatsContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClientsList from './pages/ClientsList';
import ClientForm from './pages/ClientForm';
import ClientDetails from './pages/ClientDetails';
import ProvidersList from './pages/ProvidersList';
import ProviderForm from './pages/ProviderForm';
import ProviderDetails from './pages/ProviderDetails';
import VendorDashboard from './pages/VendorDashboard';
import ServicesList from './pages/ServicesList';
import ServiceForm from './pages/ServiceForm';
import ServiceDetails from './pages/ServiceDetails';
import SalesList from './pages/SalesList';
import SaleWizard from './pages/SaleWizard';
import SaleSummary from './pages/SaleSummary';
import SaleEdit from './pages/SaleEdit';
import MonthlySales from './pages/MonthlySales';
import InventoryDashboard from './pages/InventoryDashboard';
import InventoryCalendar from './pages/InventoryCalendar';
import CupoForm from './pages/CupoForm';
import CupoDetails from './pages/CupoDetails';
import ReportingDashboard from './pages/ReportingDashboard';
import PaymentReports from './pages/PaymentReports';
// Notification imports - DISABLED
// import NotificationHistory from './pages/NotificationHistory';
// import NotificationAdmin from './pages/NotificationAdmin';
// import NotificationForm from './pages/NotificationForm';
import UserSettings from './pages/UserSettings';
import UsersList from './pages/UsersList';
import UserForm from './pages/UserForm';
import DailyReports from './pages/DailyReports';
import AdminInsightsDashboard from './pages/AdminInsightsDashboard';
import SearchPage from './pages/SearchPage';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/clients" 
        element={
          <ProtectedRoute>
            <Layout>
              <ClientsList />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/clients/new" 
        element={
          <ProtectedRoute>
            <Layout>
              <ClientForm />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/clients/:clientId" 
        element={
          <ProtectedRoute>
            <Layout>
              <ClientDetails />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/providers" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProvidersList />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/providers/new" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProviderForm />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/providers/:providerId" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProviderDetails />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/providers/:providerId/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <VendorDashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/services" 
        element={
          <ProtectedRoute>
            <Layout>
              <ServicesList />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/services/new" 
        element={
          <ProtectedRoute>
            <Layout>
              <ServiceForm />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/services/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <ServiceDetails />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/services/:id/edit" 
        element={
          <ProtectedRoute>
            <Layout>
              <ServiceForm />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales" 
        element={
          <ProtectedRoute>
            <Layout>
              <SalesList />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales/monthly" 
        element={
          <ProtectedRoute>
            <Layout>
              <MonthlySales />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales/wizard" 
        element={
          <ProtectedRoute>
            <Layout>
              <SaleWizard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales/new" 
        element={
          <ProtectedRoute>
            <Layout>
              <SaleWizard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <SaleSummary />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <SaleEdit />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales/:id/wizard"
        element={
          <ProtectedRoute>
            <Layout>
              <SaleWizard />
            </Layout>
          </ProtectedRoute>
        } 
      />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InventoryDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/calendar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InventoryCalendar />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cupos/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CupoForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cupos/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CupoDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <ReportingDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/payments"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <PaymentReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/daily-reports"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <DailyReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-insights"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminInsightsDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Notification routes - DISABLED */}
            {/* <Route
              path="/notifications/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NotificationHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/send"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NotificationForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/admin"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NotificationAdmin />
                  </Layout>
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UserSettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UsersList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UserForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UserForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SearchPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SystemStatsProvider>
          <Router>
            <AppRoutes />
          </Router>
        </SystemStatsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
