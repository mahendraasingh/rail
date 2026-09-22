import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Journeys from './pages/Journeys';
import CreateJourney from './pages/CreateJourney';
import JourneyDetails from './pages/JourneyDetails';
import SeatMapPage from './pages/SeatMapPage';
import Recommendations from './pages/Recommendations';
import SwapRequests from './pages/SwapRequests';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 dark:bg-navy-950 dark:text-slate-200 transition-colors duration-300">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Application Journey & Swap Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/journeys" element={<Journeys />} />
                <Route path="/journey/create" element={<CreateJourney />} />
                <Route path="/journey/:id" element={<JourneyDetails />} />
                <Route path="/journey/:id/seats" element={<SeatMapPage />} />
                <Route path="/journey/:id/recommendations" element={<Recommendations />} />
                <Route path="/swaps" element={<SwapRequests />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
