import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, BarChart3, Eye, Home, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileOwnerMenuProps {
  profileId: string;
  subdomain: string;
  className?: string;
}

export const ProfileOwnerMenu: React.FC<ProfileOwnerMenuProps> = ({
  profileId,
  subdomain,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewAsVisitor, setViewAsVisitor] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    // Redirect to current profile or home
    if (subdomain) {
      navigate(`/${subdomain}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const toggleViewMode = () => {
    setViewAsVisitor(!viewAsVisitor);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-200 shadow-lg"
        aria-label="Menu do proprietário"
      >
        <Settings className="w-5 h-5 text-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <p className="text-xs font-medium text-slate-600 px-3 py-1">
              Gerenciar Perfil
            </p>
          </div>

          <div className="p-2 space-y-1">
            <Link
              to={`/panel/domains`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors group"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                Gerenciar Página
              </span>
            </Link>

            <Link
              to="/panel/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors group"
              onClick={() => setIsOpen(false)}
            >
              <BarChart3 className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                Ver Estatísticas
              </span>
            </Link>

            <button
              onClick={toggleViewMode}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors group"
            >
              <Eye className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                {viewAsVisitor ? 'Ver como Dono' : 'Ver como Visitante'}
              </span>
            </button>
          </div>

          <div className="border-t border-slate-200 p-2">
            <Link
              to="/panel/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                Ir para Dashboard
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors group mt-1"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                Sair
              </span>
            </button>
          </div>
        </div>
      )}

      {viewAsVisitor && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg z-50 flex items-center gap-2 text-sm font-medium">
          <Eye className="w-4 h-4" />
          Visualizando como visitante
        </div>
      )}
    </div>
  );
};
