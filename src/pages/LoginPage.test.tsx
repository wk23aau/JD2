import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, AuthContextType } from '../AuthContext'; // Adjust path
import LoginPage from './LoginPage'; // Adjust path
import { vi } from 'vitest';

// Mock AuthContext
const mockLogin = vi.fn();
const mockUseAuth = (): Partial<AuthContextType> => ({ // Return Partial for easier mocking
  login: mockLogin,
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  isAdmin: false,
});

// Mock module directly if useAuth is not easily overridable for a specific test
// For more complex scenarios, you might mock './AuthContext' entirely
// For this, we'll try to provide a mock value via context provider if direct component testing allows
// Or, more commonly, mock the hook:
vi.mock('../AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../AuthContext')>()
    return {
        ...actual,
        useAuth: () => mockUseAuth(),
    }
})


describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockUseAuth to its default state before each test if needed
    // For example, if a test modifies its return value for specific scenarios.
    // This example keeps it simple as LoginPage primarily uses `login`.
  });

  const renderLoginPage = () => {
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider> {/* AuthProvider is still needed to provide the actual context structure if not fully mocked */}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} /> {/* For redirect testing */}
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('should render email and password fields and a login button', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('should allow typing into email and password fields', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should call auth.login on form submission with form data', async () => {
    const user = userEvent.setup();
    // Redefine mockUseAuth for this specific test to ensure mockLogin is fresh
    const localMockLogin = vi.fn().mockResolvedValue(undefined); // Make it async and resolve
     vi.mocked(useAuth).mockReturnValue({
        ...(mockUseAuth() as AuthContextType), // get default mocks
        login: localMockLogin, // override with local mock
     });


    renderLoginPage();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(localMockLogin).toHaveBeenCalledTimes(1);
      expect(localMockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should display error message if login fails', async () => {
    const user = userEvent.setup();
    const errorMessage = "Invalid credentials";
    const localMockLogin = vi.fn().mockRejectedValue(new Error(errorMessage));
     vi.mocked(useAuth).mockReturnValue({
        ...(mockUseAuth() as AuthContextType),
        login: localMockLogin,
     });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // Test for redirection on successful login is implicitly handled by AuthContext tests
  // and LoginPage's useEffect for isAuthenticated. Direct navigation testing here
  // can be complex due to how navigate works internally with context updates.
  // We confirm login is called; AuthContext tests confirm state changes post-login.
});
