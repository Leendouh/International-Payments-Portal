import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import PaymentForm from './components/PaymentForm';
import PaymentHistory from './components/PaymentHistory';
import EmployeeLogin from './components/EmployeeLogin';
import EmployeeDashboard from './components/EmployeeDashboard';
import EmployeeProfile from './components/EmployeeProfile';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Customer Portal Routes */}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/dashboard" /> : (
                <>
                  <Navbar />
                  <main className="container mx-auto px-4 py-8">
                    <Login />
                  </main>
                </>
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/dashboard" /> : (
                <>
                  <Navbar />
                  <main className="container mx-auto px-4 py-8">
                    <Register />
                  </main>
                </>
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <div className="pt-20">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8">
                    <Dashboard />
                  </main>
                </div>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/payment" 
            element={
              user ? (
                <div className="pt-20">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8">
                    <PaymentForm />
                  </main>
                </div>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/history" 
            element={
              user ? (
                <div className="pt-20">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8">
                    <PaymentHistory />
                  </main>
                </div>
              ) : <Navigate to="/login" />
            } 
          />
          
          {/* Employee Portal Routes */}
          <Route 
            path="/employee/login" 
            element={<EmployeeLogin />} 
          />
          <Route 
            path="/employee/dashboard" 
            element={<EmployeeDashboard />} 
          />
          <Route 
            path="/employee/profile" 
            element={<EmployeeProfile />} 
          />
          
          {/* Default Route */}
          <Route 
            path="/" 
            element={<Navigate to="/login" />} 
          />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
