import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { Home, Calendar, Users, Gem, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (!user || !profile) {
    return null;
  }

  const isAdmin = profile.rol === 'admin';

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Gem className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">Manicura Premium</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" icon={<Home size={18} />} label="Inicio" />
            {isAdmin ? (
              <>
                <NavLink to="/admin/clientas" icon={<Users size={18} />} label="Clientas" />
                <NavLink to="/admin/citas" icon={<Calendar size={18} />} label="Citas" />
                <NavLink to="/admin/servicios" icon={<Gem size={18} />} label="Servicios" />
              </>
            ) : (
              <>
                <NavLink to="/citas" icon={<Calendar size={18} />} label="Mis Citas" />
                <NavLink to="/servicios" icon={<Gem size={18} />} label="Servicios" />
                <NavLink to="/referidos" icon={<User size={18} />} label="Referidos" />
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                {profile.nombre} {profile.apellido}
              </span>
              {!isAdmin && (
                <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                  {profile.puntos} pts
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="hidden md:flex items-center gap-2"
            >
              <LogOut size={16} />
              Salir
            </Button>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              <MobileNavLink to="/" icon={<Home size={18} />} label="Inicio" />
              {isAdmin ? (
                <>
                  <MobileNavLink to="/admin/clientas" icon={<Users size={18} />} label="Clientas" />
                  <MobileNavLink to="/admin/citas" icon={<Calendar size={18} />} label="Citas" />
                  <MobileNavLink to="/admin/servicios" icon={<Gem size={18} />} label="Servicios" />
                </>
              ) : (
                <>
                  <MobileNavLink to="/citas" icon={<Calendar size={18} />} label="Mis Citas" />
                  <MobileNavLink to="/servicios" icon={<Gem size={18} />} label="Servicios" />
                  <MobileNavLink to="/referidos" icon={<User size={18} />} label="Referidos" />
                </>
              )}
              <div className="pt-3 border-t border-gray-200 mt-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {profile.nombre} {profile.apellido}
                  </span>
                  {!isAdmin && (
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                      {profile.puntos} pts
                    </span>
                  )}
                </div>
                <Button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2">
                  <LogOut size={16} />
                  Salir
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 text-sm font-medium transition-colors ${
        isActive
          ? 'text-primary'
          : 'text-gray-600 hover:text-primary'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
