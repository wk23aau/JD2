import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, User } from '../AuthContext'; // Assuming User type is exported from AuthContext

const GoogleAuthCallbackPage: React.FC = () => {
  const { handleGoogleLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true); // Local processing state
  const [processedEffect, setProcessedEffect] = useState(false); // To ensure useEffect logic runs once

  useEffect(() => {
    if (processedEffect || isLoading) return; // Wait for auth context to finish loading and run effect once

    const params = new URLSearchParams(location.search);

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userString = params.get('user');
    const oauthError = params.get('error');

    if (oauthError) {
      setError(`Google authentication failed: ${oauthError}. Please try again or log in with your credentials.`);
      setIsProcessing(false);
      setProcessedEffect(true);
      return;
    }

    if (token && userString) {
      try {
        const userData = JSON.parse(decodeURIComponent(userString)) as User;
        if (userData && typeof userData === 'object') {
          handleGoogleLogin(token, userData); // This might set isLoading in AuthContext
          // Navigation will occur once handleGoogleLogin completes and isAuthenticated updates,
          // or AuthContext's own useEffect listening to isAuthenticated triggers navigation.
          // For safety, we can navigate here too, ensuring it's after state update.
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error("User data is not valid.");
        }
      } catch (e) {
        console.error("Failed to parse user data or handle Google login:", e);
        setError('Authentication callback failed: Invalid user data received. Please try again.');
      }
    } else if (!oauthError) { // Only set this error if no other specific error was found
      setError('Authentication callback failed: Missing token or user information. Please try again.');
    }
    setIsProcessing(false);
    setProcessedEffect(true);
  }, [location.search, handleGoogleLogin, navigate, isLoading, processedEffect]);

  if (isProcessing || (isLoading && !processedEffect)) { // Show loading if locally processing or auth context is loading and effect hasn't run
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4">
        <div className="text-sky-400 text-xl">Processing Google Authentication...</div>
        <svg className="animate-spin mt-4 h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4 text-center">
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700">
          <h2 className="text-2xl font-semibold text-red-400 mb-4">Authentication Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md transition-colors duration-150"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If not processing and no error, it means navigation should be happening or completed.
  // A "Finalizing..." or redirect message can be shown if needed, but usually, navigation is quick.
  // If navigation hasn't happened and there's no error, it might be a temporary state before AuthContext updates.
  if (!error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4">
        <div className="text-sky-400 text-xl">Finalizing authentication...</div>
        {/* Optional: Add a spinner here too if handleGoogleLogin has async parts not covered by its isLoading */}
      </div>
    );
  }

  // Error display is handled by the existing 'if (error)' block
  return null; // Should be covered by error display or the finalizing message above
};

export default GoogleAuthCallbackPage;
