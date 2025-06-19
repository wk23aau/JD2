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
      navigate(location.pathname, { replace: true, state: { ...location.state, message: undefined } });
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
