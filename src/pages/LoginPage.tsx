import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Import useAuth

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const auth = useAuth(); // Use the AuthContext
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    // If user is already authenticated, redirect them from login page
    if (auth.isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [auth.isAuthenticated, navigate, from]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state after displaying it
      navigate(location.pathname, { replace: true, state: { ...location.state, message: undefined } });
    }

    // Check for OAuth error in URL params
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('oauth_error');
    if (oauthError) {
      let displayMessage = 'Google Sign-In failed. Please try again or use email/password.';
      if (oauthError === 'email_already_registered_local') {
        displayMessage = 'This email is already registered with an email/password. Please log in using your password or use a different Google account.';
      } else if (oauthError === 'access_denied_by_user') {
        displayMessage = 'Google Sign-In was cancelled or access was denied. Please try again if this was a mistake.';
      } else if (oauthError === 'user_not_found_post_auth') {
        displayMessage = 'There was an issue finding your user account after Google authentication. Please contact support.';
      } else if (oauthError === 'google_auth_failed') {
        displayMessage = 'An unexpected error occurred during Google Sign-In. Please try again.';
      }
      // You might want to add more specific messages based on other error codes from your backend
      setError(displayMessage);
      // Clean the URL: remove oauth_error query param
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (successMessage) setSuccessMessage(null);

    try {
      await auth.login({ email, password });
      // Navigate after successful login, AuthProvider handles state and localStorage
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. An unexpected error occurred.');
      }
      console.error('Login request error:', err);
    }
    // isLoading state is now managed by AuthContext
  };

  // If loading from context (e.g. initial auth check) or during login, show loading.
  // Or if already authenticated (e.g. navigated here by mistake or race condition)
  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex justify-center items-center">
        <div className="text-sky-400 text-xl">Loading...</div> {/* Basic loading indicator */}
      </div>
    );
  }

  // If user becomes authenticated while on this page (e.g. due to state update from another tab/auto-login)
  // This is an additional check, primary redirect is in useEffect.
  if (auth.isAuthenticated) {
    return <Navigate to={from} replace />;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 shadow-2xl rounded-xl p-8 border border-slate-700">
        <h2 className="text-4xl font-bold text-center text-sky-400 mb-8">
          Log In
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-700 text-red-300 p-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}
        {successMessage && !error && (
          <div className="bg-green-500/20 border border-green-700 text-green-300 p-3 rounded-md mb-6 text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-sky-300 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={auth.isLoading} // Use isLoading from context
              className="appearance-none block w-full px-4 py-3 rounded-md shadow-sm bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors duration-150 disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-sky-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={auth.isLoading} // Use isLoading from context
              className="appearance-none block w-full px-4 py-3 rounded-md shadow-sm bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors duration-150 disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={auth.isLoading} // Use isLoading from context
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {auth.isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Log In'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <a
              href={`${process.env.REACT_APP_API_BASE_URL || ''}/api/auth/google`}
              className="w-full flex items-center justify-center py-3 px-4 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-sky-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-all duration-150 ease-in-out"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-sky-400 hover:text-sky-300 transition-colors duration-150"
          >
            Sign Up
          </Link>
        </p>
         <p className="mt-2 text-center text-xs text-slate-500">
          <Link to="/" className="hover:text-sky-400 transition-colors duration-150">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
