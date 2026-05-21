import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Car, LayoutDashboard } from 'lucide-react';
import { UserProfile } from '../../types';

interface HeaderProps {
  user: UserProfile | null;
  onAuthClick: () => void;
  onLogout: () => void;
}

export default function Header({ user, onAuthClick, onLogout }: HeaderProps) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/');
  };

  return (
    <header className="bg-dark/92 backdrop-blur-lg border-b border-gold/15 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center group">
          <span className="text-2xl font-display font-black tracking-tight text-white">Drive<span className="text-gold">Fleet</span></span>
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

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
               <div className="flex flex-col items-end mr-2">
                 <span className="text-[10px] font-bold text-gold uppercase tracking-widest leading-none mb-1">
                   {user.role}
                 </span>
                 <span className="text-xs font-medium text-white hidden sm:block">
                   {user.name}
                 </span>
               </div>
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
              className="px-6 py-2.5 bg-gold text-dark font-bold text-sm rounded-lg hover:shadow-xl hover:shadow-gold/20 transition-all"
            >
              Log in / Sign up
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
