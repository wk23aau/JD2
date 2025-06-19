import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext'; // Adjust path as necessary

const AdminProtectedRoute: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner or a blank page while auth state is being determined
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex justify-center items-center">
        <div className="text-sky-400 text-xl">Verifying Admin Access...</div> {/* Basic loading indicator */}
      </div>
    );
  }

  if (!isAuthenticated) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // User is authenticated but not an admin
    // Redirect to a general page like dashboard or a specific "unauthorized" page
    // Optionally, provide feedback (though alert is generally not preferred in React apps)
    console.warn(`Admin access denied for user: ${user?.username || 'Unknown user'}. Redirecting.`);
    // You might want to create a dedicated /unauthorized page for a better UX
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />; // User is authenticated and is an admin
};

export default AdminProtectedRoute;
