import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Unauthorized } from './pages/Unauthorized';
import { DashboardOverview } from './pages/DashboardOverview';
import { Rooms } from './pages/Rooms';
import { Tenants } from './pages/Tenants';
import { Invoices } from './pages/Invoices';
import { Expenses } from './pages/Expenses';
import { Complaints } from './pages/Complaints';
import { Notices } from './pages/Notices';
import { Mess } from './pages/Mess';
import { Visitors } from './pages/Visitors';
import { Reports } from './pages/Reports';
import { AIAssistant } from './pages/AIAssistant';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin', 'tenant', 'staff']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            
            {/* Module 3: Rooms */}
            <Route 
              path="rooms" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Rooms />
                </ProtectedRoute>
              } 
            />

            {/* Module 4: Tenants */}
            <Route 
              path="tenants" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Tenants />
                </ProtectedRoute>
              } 
            />

            {/* Module 5: Invoices */}
            <Route 
              path="invoices" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'tenant', 'staff']}>
                  <Invoices />
                </ProtectedRoute>
              } 
            />

            {/* Module 6: Expenses */}
            <Route 
              path="expenses" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Expenses />
                </ProtectedRoute>
              } 
            />

            {/* Module 7: Complaints */}
            <Route 
              path="complaints" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'tenant', 'staff']}>
                  <Complaints />
                </ProtectedRoute>
              } 
            />

            {/* Module 8: Notices */}
            <Route 
              path="notices" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'tenant', 'staff']}>
                  <Notices />
                </ProtectedRoute>
              } 
            />

            {/* Module 9: Mess */}
            <Route 
              path="mess" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'tenant', 'staff']}>
                  <Mess />
                </ProtectedRoute>
              } 
            />

            {/* Module 10: Visitors */}
            <Route 
              path="visitors" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Visitors />
                </ProtectedRoute>
              } 
            />

            {/* Module 11: Reports */}
            <Route 
              path="reports" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />

            {/* Module 12: Gemini AI Assistant */}
            <Route 
              path="ai-assistant" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'tenant', 'staff']}>
                  <AIAssistant />
                </ProtectedRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<DashboardOverview />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;