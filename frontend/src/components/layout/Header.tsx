import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Car, LayoutDashboard, KeyRound, Bell, Trash2, CheckCheck, Menu, X } from 'lucide-react';
import { UserProfile, AppNotification } from '../../types';
import React, { useState, useEffect, useRef } from 'react';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import { notificationService } from '../../services/notificationService';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  user: UserProfile | null;
  onAuthClick: () => void;
  onLogout: () => void;
}

export default function Header({ user, onAuthClick, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // Fail silently on standard transient network errors (like server booting or restart)
      const isNetworkError = err?.message === 'Failed to fetch' || err?.name === 'TypeError';
      if (!isNetworkError) {
        console.error('Failed to fetch notifications:', err);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsNotificationsOpen(false);
      return;
    }
    fetchNotifications();

    // Check notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/');
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatNotificationTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <header className="bg-dark/92 backdrop-blur-lg border-b border-gold/15 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center group">
          <span className="text-2xl font-display font-black tracking-tight text-white">Ethiovehicles <span className="text-gold">Rent</span></span>
        </Link>
 
        <nav className="hidden md:flex items-center gap-10">
          <Link to="/" className="text-[13px] font-medium text-muted hover:text-gold transition-colors">Home</Link>
          <Link to="/vehicles" className="text-[13px] font-medium text-muted hover:text-gold transition-colors">Browse Vehicles</Link>
          <Link to="/contact" className="text-[13px] font-medium text-muted hover:text-gold transition-colors">Contact</Link>
          {user && (
            <Link to="/dashboard" className="flex items-center gap-2 text-[13px] font-medium text-gold hover:underline transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          )}
        </nav>
 
        <div className="flex items-center gap-4">
          {/* Desktop User Section */}
          {user ? (
            <div className="hidden md:flex items-center gap-4 pl-6 border-l border-white/10">
              <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest leading-none mb-1">
                  {user.role}
                </span>
                <span className="text-xs font-medium text-white">
                  {user.name}
                </span>
              </div>
              
              <button 
                onClick={() => setIsChangePasswordOpen(true)}
                className="p-2 text-muted hover:text-gold transition-all border border-white/5 rounded-lg hover:bg-white/5"
                title="Change Password"
              >
                <KeyRound className="w-4 h-4" />
              </button>

              <button 
                onClick={handleSignOut}
                className="p-2 text-muted hover:text-white transition-all border border-white/5 rounded-lg hover:bg-white/5"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="hidden md:block px-6 py-2.5 bg-gold text-dark font-bold text-sm rounded-lg hover:shadow-xl hover:shadow-gold/20 transition-all"
            >
              Log in / Sign up
            </button>
          )}

          {/* Shared Notifications Popover (Desktop & Mobile when logged in) */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-muted hover:text-gold transition-all border border-white/5 rounded-lg hover:bg-white/5 relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl border border-white/10 bg-dark-1/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-xs uppercase tracking-wider text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-gold/15 text-gold text-[9px] font-bold">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-gold hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-muted font-medium text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                          className={`p-3 rounded-xl border transition-all text-left relative group ${
                            notification.isRead
                              ? 'bg-transparent border-white/5 hover:bg-white/5'
                              : 'bg-gold/5 border-gold/15 hover:bg-gold/10 cursor-pointer'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h5 className={`text-xs font-bold ${notification.isRead ? 'text-white/85' : 'text-gold'}`}>
                              {notification.title}
                            </h5>
                            <span className="text-[9px] font-mono text-white/40 tracking-tight shrink-0">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/70 leading-relaxed font-medium mb-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all mt-1">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="text-[9px] font-bold text-gold hover:underline"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              className="text-white/40 hover:text-red-400 p-1 ml-2 inline-flex items-center"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Unread Accent Dot */}
                          {!notification.isRead && (
                            <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-gold" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compact Mobile Login Button */}
          {!user && (
            <button 
              onClick={onAuthClick}
              className="md:hidden px-4 py-2 bg-gold text-dark font-bold text-xs rounded-lg hover:shadow-xl hover:shadow-gold/20 transition-all"
            >
              Log In
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden text-muted hover:text-gold transition-all border border-white/5 rounded-lg hover:bg-white/5 z-50 relative"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-dark/80 backdrop-blur-md z-40 md:hidden"
            />

            {/* Drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-dark-2 border-l border-gold/15 p-6 shadow-2xl z-40 flex flex-col justify-between md:hidden pt-24"
            >
              {/* Navigation links & profile header */}
              <div className="space-y-8">
                {user && (
                  <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20 text-gold shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white leading-tight truncate">{user.name}</span>
                      <span className="text-[10px] font-bold text-gold uppercase tracking-wider mt-0.5">{user.role}</span>
                    </div>
                  </div>
                )}

                <nav className="flex flex-col gap-5">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-white hover:text-gold transition-colors py-1.5"
                  >
                    Home
                  </Link>
                  <Link
                    to="/vehicles"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-white hover:text-gold transition-colors py-1.5"
                  >
                    Browse Vehicles
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-white hover:text-gold transition-colors py-1.5"
                  >
                    Contact
                  </Link>
                  {user && (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm font-medium text-gold hover:underline transition-colors py-1.5"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gold" />
                      Dashboard
                    </Link>
                  )}
                </nav>
              </div>

              {/* Action buttons inside drawer */}
              <div className="pt-6 border-t border-white/5 space-y-3">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsChangePasswordOpen(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 text-muted hover:text-gold transition-all border border-white/5 rounded-xl hover:bg-white/5 text-xs font-bold"
                    >
                      <KeyRound className="w-4 h-4 text-gold shrink-0" />
                      Change Password
                    </button>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-3 p-3 text-muted hover:text-red-400 transition-all border border-white/5 rounded-xl hover:bg-white/5 text-xs font-bold"
                    >
                      <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onAuthClick();
                    }}
                    className="w-full py-3 bg-gold text-dark font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/10"
                  >
                    Log in / Sign up
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </header>
  );
}
