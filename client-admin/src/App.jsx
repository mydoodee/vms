import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import UsersPage from './pages/Users';
import Reports from './pages/Reports';
import Garages from './pages/Garages';
import Renewals from './pages/Renewals';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router basename="/vms">
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />

          {/* Secure Protected admin dashboard pages */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicles"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Vehicles />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicles/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <VehicleDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Tickets />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TicketDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/new"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CreateTicket />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <MainLayout>
                  <Reports />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/garages"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Garages />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/renewals"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <MainLayout>
                  <Renewals />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
