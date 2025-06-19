import React, { useState, useEffect, useCallback } from 'react';

// Placeholder for getAuthToken - should be from a shared auth context/service
const getAuthToken = (): string | null => {
  // console.warn("AdminDashboardPage: Using placeholder getAuthToken.");
  return localStorage.getItem('userToken');
};

interface AdminUserView {
  id: string | number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  // Add status if available, e.g., is_active
}

const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllUsers = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Admin actions require authentication.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // This API endpoint (/api/admin/users) is conceptual and needs to be implemented in the backend
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 403) throw new Error('Access Denied: You do not have permission to view users.');
        throw new Error('Failed to fetch users list');
      }
      const data: AdminUserView[] = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : 'Could not fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleToggleAdminStatus = async (userId: string | number, currentIsAdmin: boolean) => {
    // Placeholder for API call: PUT /api/admin/users/:userId/toggle-admin
    alert(`Placeholder: Toggle admin status for user ${userId} to ${!currentIsAdmin}. API call not implemented.`);
    // On success, call fetchAllUsers() to refresh the list.
  };

  const handleToggleUserActiveStatus = async (userId: string | number, currentIsActive: boolean) => {
    // Placeholder for API call: PUT /api/admin/users/:userId/toggle-active
    alert(`Placeholder: Toggle active status for user ${userId} to ${!currentIsActive}. API call not implemented.`);
    // On success, call fetchAllUsers() to refresh the list.
  };


  if (isLoading) {
    return <div className="p-8 text-center">Loading users...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Admin Dashboard - User Management</h1>

      {users.length === 0 ? (
        <p className="text-slate-600">No users found or unable to load users.</p>
      ) : (
        <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Username</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Is Admin?</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.is_admin ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleToggleAdminStatus(user.id, user.is_admin)} className="text-blue-600 hover:text-blue-900">
                      {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                    {/* Assuming an is_active field, otherwise this button is conceptual */}
                    {/* <button onClick={() => handleToggleUserActiveStatus(user.id, true)} className="text-red-600 hover:text-red-900">Deactivate</button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
