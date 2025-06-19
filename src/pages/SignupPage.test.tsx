import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, AuthContextType } from '../AuthContext'; // Adjust path
import SignupPage from './SignupPage'; // Adjust path
import { vi } from 'vitest';

// Mock AuthContext's useAuth hook
const mockSignup = vi.fn();
const mockUseAuth = (): Partial<AuthContextType> => ({
  signup: mockSignup,
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  isAdmin: false,
});

vi.mock('../AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../AuthContext')>()
    return {
        ...actual,
        useAuth: () => mockUseAuth(),
    }
});

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockUseAuth if its return value is changed in specific tests
  });

  const renderSignupPage = () => {
    return render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider> {/* Provide actual AuthProvider for context structure */}
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<div>Login Page Mock</div>} /> {/* For redirect testing */}
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('should render username, email, password, and confirm password fields', () => {
    renderSignupPage();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument(); // Use exact match for "Password"
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should allow typing into all fields', async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText(/username/i), 'newuser');
    expect(screen.getByLabelText(/username/i)).toHaveValue('newuser');

    await user.type(screen.getByLabelText(/email address/i), 'new@example.com');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('new@example.com');

    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('password123');

    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue('password123');
  });

  it('should display error if passwords do not match', async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('should call auth.signup on form submission if passwords match', async () => {
    const user = userEvent.setup();
    const localMockSignup = vi.fn().mockResolvedValue(undefined); // Async and resolves
     vi.mocked(useAuth).mockReturnValue({
        ...(mockUseAuth() as AuthContextType),
        signup: localMockSignup,
     });

    renderSignupPage();

    const username = 'testuser_signup';
    const email = 'signup@example.com';
    const password = 'password123';

    await user.type(screen.getByLabelText(/username/i), username);
    await user.type(screen.getByLabelText(/email address/i), email);
    await user.type(screen.getByLabelText(/^password$/i), password);
    await user.type(screen.getByLabelText(/confirm password/i), password); // Matching password
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(localMockSignup).toHaveBeenCalledTimes(1);
      expect(localMockSignup).toHaveBeenCalledWith({
        username,
        email,
        password,
      });
    });
  });

  it('should display error message if signup API call fails', async () => {
    const user = userEvent.setup();
    const errorMessage = "Email already exists";
    const localMockSignup = vi.fn().mockRejectedValue(new Error(errorMessage));
     vi.mocked(useAuth).mockReturnValue({
        ...(mockUseAuth() as AuthContextType),
        signup: localMockSignup,
     });

    renderSignupPage();

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email address/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
