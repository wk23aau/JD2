import React, { ReactNode } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, User } from './AuthContext'; // Adjust path if necessary
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock global fetch
global.fetch = vi.fn();

const createFetchResponse = (ok: boolean, data: any, status: number = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response);
};

// Test component to consume and display context values
const TestConsumerComponent = () => {
  const auth = useAuth();
  if (auth.isLoading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="isAdmin">{auth.isAdmin.toString()}</div>
      <div data-testid="token">{auth.token}</div>
      <div data-testid="username">{auth.user?.username}</div>
      <button onClick={() => auth.login({ email: 'test@example.com', password: 'password' })}>Login</button>
      <button onClick={() => auth.signup({ username: 'newuser', email: 'new@example.com', password: 'password' })}>Signup</button>
      <button onClick={auth.logout}>Logout</button>
    </div>
  );
};

const renderWithAuthProvider = (ui: ReactNode) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
};

describe('AuthContext and AuthProvider', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('initializes with no user/token if localStorage is empty and not loading', async () => {
    renderWithAuthProvider(<TestConsumerComponent />);
    await waitFor(() => expect(screen.getByText('false')).toBeInTheDocument()); // Wait for loading to finish

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
    expect(screen.getByTestId('token').textContent).toBe('');
    expect(screen.getByTestId('username').textContent).toBe('');
  });

  it('initializes with user/token if found in localStorage', async () => {
    const testToken = 'test-token';
    const testUser: User = { id: 1, username: 'testuser', email: 'test@test.com', isAdmin: true };
    localStorageMock.setItem('token', testToken);
    localStorageMock.setItem('userInfo', JSON.stringify(testUser));

    renderWithAuthProvider(<TestConsumerComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });
    expect(screen.getByTestId('isAdmin').textContent).toBe('true');
    expect(screen.getByTestId('token').textContent).toBe(testToken);
    expect(screen.getByTestId('username').textContent).toBe(testUser.username);
  });

  it('login function updates context and localStorage on successful API call', async () => {
    const loginData = { email: 'test@example.com', password: 'password' };
    const responseToken = 'logged-in-token';
    const responseUser: User = { id: 2, username: 'loggedinuser', email: loginData.email, isAdmin: false };
    (fetch as vi.Mock).mockReturnValueOnce(createFetchResponse(true, { token: responseToken, user: responseUser }));

    renderWithAuthProvider(<TestConsumerComponent />);
    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument()); // Ensure component is loaded

    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });
    expect(screen.getByTestId('token').textContent).toBe(responseToken);
    expect(screen.getByTestId('username').textContent).toBe(responseUser.username);
    expect(localStorageMock.getItem('token')).toBe(responseToken);
    expect(JSON.parse(localStorageMock.getItem('userInfo')!)).toEqual(responseUser);
  });

  it('login function handles failed API call and clears auth state', async () => {
    (fetch as vi.Mock).mockReturnValueOnce(createFetchResponse(false, { message: 'Invalid credentials' }, 401));

    renderWithAuthProvider(<TestConsumerComponent />);
    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument());

    await act(async () => {
      // The login function in AuthContext throws an error, so we expect it.
      // Components using it would catch this error to display messages.
      try {
        await screen.getByText('Login').click();
      } catch (e) {
        // Error is expected to be thrown by auth.login
        expect((e as Error).message).toBe('Invalid credentials');
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    });
    expect(screen.getByTestId('token').textContent).toBe('');
    expect(screen.getByTestId('username').textContent).toBe('');
    expect(localStorageMock.getItem('token')).toBeNull();
    expect(localStorageMock.getItem('userInfo')).toBeNull();
  });

  it('logout function clears context and localStorage', async () => {
    // Setup initial logged-in state
    const testToken = 'test-token-logout';
    const testUser: User = { id: 3, username: 'logoutuser', email: 'logout@test.com' };
    localStorageMock.setItem('token', testToken);
    localStorageMock.setItem('userInfo', JSON.stringify(testUser));

    renderWithAuthProvider(<TestConsumerComponent />);

    await waitFor(() => { // Wait for initial load from localStorage
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });

    act(() => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    });
    expect(screen.getByTestId('token').textContent).toBe('');
    expect(screen.getByTestId('username').textContent).toBe('');
    expect(localStorageMock.getItem('token')).toBeNull();
    expect(localStorageMock.getItem('userInfo')).toBeNull();
  });

  it('signup function calls register API successfully (no auto-login)', async () => {
    const signupData = { username: 'newuser', email: 'new@example.com', password: 'password' };
    (fetch as vi.Mock).mockReturnValueOnce(createFetchResponse(true, { message: 'User registered successfully' })); // Backend might return some data

    renderWithAuthProvider(<TestConsumerComponent />);
    await waitFor(() => expect(screen.getByText('Signup')).toBeInTheDocument());


    await act(async () => {
        await screen.getByText('Signup').click();
    });

    expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.anything());
    // Verify that state remains logged out as signup doesn't auto-login
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(localStorageMock.getItem('token')).toBeNull();
  });

  it('signup function handles failed API call', async () => {
    (fetch as vi.Mock).mockReturnValueOnce(createFetchResponse(false, { message: 'Email already exists' }, 409));

    renderWithAuthProvider(<TestConsumerComponent />);
    await waitFor(() => expect(screen.getByText('Signup')).toBeInTheDocument());

    await act(async () => {
      try {
        await screen.getByText('Signup').click();
      } catch (e) {
        expect((e as Error).message).toBe('Email already exists');
      }
    });

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
  });

});
