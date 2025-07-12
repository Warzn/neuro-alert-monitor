
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Activity, User, LogOut, Settings, History, Home, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/history', label: 'Historique', icon: History },
    { path: '/settings', label: 'Paramètres', icon: Settings },
  ];

  const NavContent = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors w-full ${
              isActive
                ? 'text-medical-blue bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {item.label}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen medical-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="bg-medical-blue p-2 rounded-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-lg sm:text-xl font-semibold text-gray-800">
                  Epilot
                </span>
              </div>
            </div>

            {/* Navigation - Desktop */}
            {!isMobile && (
              <nav className="hidden md:flex space-x-8">
                <NavContent />
              </nav>
            )}

            {/* User menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-700 hidden sm:block">{user?.fullName}</span>
              </div>
              
              {/* Mobile Menu */}
              {isMobile && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <div className="flex flex-col space-y-4 mt-8">
                      <NavContent />
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="text-gray-600 hover:text-gray-900 w-full"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              
              {/* Desktop Logout */}
              {!isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 sm:h-12 text-xs sm:text-sm">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-mint-green rounded-full status-pulse mr-2"></div>
                <span className="text-gray-600">Jetson: Active</span>
              </div>
            </div>
            <div className="text-gray-600 hidden sm:block">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
