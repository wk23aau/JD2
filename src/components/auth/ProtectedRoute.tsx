import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext'; // Adjust path as necessary

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner or a blank page while auth state is being determined
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex justify-center items-center">
        <div className="text-sky-400 text-xl">Authenticating...</div> {/* Basic loading indicator */}
      </div>
    );
  }

  if (!isAuthenticated) {
    // User is not authenticated, redirect to login
    // Save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // User is authenticated, render the child route's element
};

export default ProtectedRoute;
