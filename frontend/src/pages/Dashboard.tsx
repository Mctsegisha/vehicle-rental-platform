import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import CustomerDashboard from '../components/dashboard/CustomerDashboard';
import OwnerDashboard from '../components/dashboard/OwnerDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: UserProfile;
}

export default function Dashboard({ user }: DashboardProps) {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-dark flex flex-col md:flex-row font-sans">
      <div className="flex-grow p-6 md:p-12 overflow-y-auto">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="max-w-7xl mx-auto"
        >
          <div className="mb-12">
            <h1 className="text-4xl font-display font-black text-white mb-2 tracking-tight uppercase">
              {user.role === 'admin' ? 'Admin Control Center' : 
               user.role === 'owner' ? 'Owner Dashboard' : 
               'Guest Dashboard'}
            </h1>
            <p className="text-muted font-bold text-[10px] uppercase tracking-[0.2em]">
              Connected as {user.name} // {user.role === 'customer' ? 'Renter' : user.role === 'owner' ? 'Provider' : 'System Admin'} profile
            </p>
          </div>

          {user.role === 'customer' && <CustomerDashboard user={user} />}
          {user.role === 'owner' && <OwnerDashboard user={user} />}
          {user.role === 'admin' && <AdminDashboard user={user} />}
        </motion.div>
      </div>
    </div>
  );
}
