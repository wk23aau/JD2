import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext'; // Adjust path as necessary
import { SparklesIcon } from '../../constants'; // Assuming this icon is appropriate for logo

const MainHeader: React.FC = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <header className="bg-slate-900 text-slate-100 p-4 shadow-lg border-b border-slate-700">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-sky-400 hover:text-sky-300 transition-colors">
          <SparklesIcon className="w-7 h-7" />
          <span>AI CV Maker</span>
        </Link>
        <nav className="flex items-center space-x-2 md:space-x-4">
          {isLoading ? (
            <div className="text-sm text-slate-400">Loading...</div>
          ) : isAuthenticated ? (
            <>
              <Link to="/dashboard" className="px-3 py-2 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors">Dashboard</Link>
              <Link to="/editor" className="px-3 py-2 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors">New CV</Link>
              <span className="text-sm text-slate-400 hidden md:inline">
                Hi, {user?.username || 'User'}
                {user?.isAdmin && (<span className="ml-1 text-xs text-sky-400">(Admin)</span>)}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors">Login</Link>
              <Link to="/signup" className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-sm font-medium transition-colors">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default MainHeader;
