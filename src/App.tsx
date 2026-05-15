/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { userService } from './services/userService';
import { UserProfile } from './types';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Vehicles from './pages/Vehicles';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await userService.getUserProfile();
          setUser(profile);
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark flex flex-col font-sans text-white relative overflow-hidden">
        {/* Background Visual Depth Blobs */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
        </div>

        <Header 
          user={user} 
          onAuthClick={() => setAuthModalOpen(true)} 
          onLogout={() => setUser(null)}
        />
        
        <main className="flex-grow relative z-10">
          <Routes>
            <Route path="/" element={<Home user={user} onAuthClick={() => setAuthModalOpen(true)} />} />
            <Route path="/vehicles" element={<Vehicles user={user} onAuthClick={() => setAuthModalOpen(true)} />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute user={user} />}>
              <Route path="/dashboard/*" element={<Dashboard user={user} />} />
            </Route>

            {/* Error redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-dark-1 border-t border-gold/10 py-20 px-6 mt-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24">
            <div className="lg:col-span-1">
              <h3 className="text-3xl font-display font-black tracking-tight text-white mb-6 uppercase">DriveFleet.</h3>
              <p className="text-sm text-white/50 leading-relaxed max-w-sm font-medium">
                The premier vehicle ecosystem in Ethiopia. 
                Bridging expectations with exceptional mobility solutions.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold mb-8">Navigation</h4>
              <ul className="space-y-6">
                <li><Link to="/vehicles" className="text-[11px] font-bold uppercase tracking-widest text-white/80 hover:text-gold transition-all duration-300 block">Browse Fleet</Link></li>
                <li><Link to="/contact" className="text-[11px] font-bold uppercase tracking-widest text-white/80 hover:text-gold transition-all duration-300 block">How It Works</Link></li>
                <li><Link to="/contact" className="text-[11px] font-bold uppercase tracking-widest text-white/80 hover:text-gold transition-all duration-300 block">Support Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold mb-8">Connect</h4>
              <p className="text-white/60 font-medium text-[11px] mb-8 uppercase tracking-widest">support@drivefleet.com</p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center text-gold hover:bg-gold hover:text-dark hover:scale-110 transition-all duration-300 cursor-pointer">
                  𝕏
                </div>
                <div className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center text-gold hover:bg-gold hover:text-dark hover:scale-110 transition-all duration-300 cursor-pointer">
                  in
                </div>
              </div>
            </div>
          </div>
        </footer>

        {authModalOpen && (
          <AuthModal 
            onClose={() => setAuthModalOpen(false)} 
            onSuccess={(profile) => {
              setUser(profile);
              setAuthModalOpen(false);
            }}
          />
        )}
      </div>
    </BrowserRouter>
  );
}

