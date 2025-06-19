import React, { Suspense, lazy, useEffect } from 'react'; // Added useEffect
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom'; // Added useLocation
import MainHeader from './components/layout/MainHeader';
import MainFooter from './components/layout/MainFooter';
import LoadingSpinner from './components/shared/LoadingSpinner'; // Assuming this exists
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import { trackPageView } from './services/analyticsService'; // Added import

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Auth context/state would typically be managed here or in a dedicated provider
// For now, just basic routing structure.

const AnalyticsPageViewTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null; // This component does not render anything
};

const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader />
      <main className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner message="Loading page..."/></div>}>
          <Outlet /> {/* Nested routes will render here */}
        </Suspense>
      </main>
      <MainFooter />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AnalyticsPageViewTracker /> {/* Added page view tracker */}
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<LandingPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/editor" element={<EditorPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/editor/:cvId" element={<EditorPage />} /> {/* For editing existing CV */}
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {/* Routes without MainHeader/MainFooter (e.g., full-screen login/signup) */}
        <Route path="/login" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen"><LoadingSpinner message="Loading..."/></div>}>
            <LoginPage />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen"><LoadingSpinner message="Loading..."/></div>}>
            <SignupPage />
          </Suspense>
        } />
      </Routes>
    </Router>
  );
};

export default App;
