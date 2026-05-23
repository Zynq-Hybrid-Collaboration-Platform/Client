import { api } from '../api';
import { IUserSafe } from '@/types/auth';

// Helper: normalise whatever the backend returns into a safe flat object
function shapeUser(raw: any): IUserSafe {
  return {
    id: raw.id || raw._id?.toString(),
    name: raw.name,
    email: raw.email,
    username: raw.username,
    avatar: raw.avatar,
    status: raw.status,
    bio: raw.bio || '',
    timezone: raw.timezone || 'UTC',
    notificationPreferences: raw.notificationPreferences || { email: true, inApp: true },
    organizations: raw.organizations || [],
    workspaces: raw.workspaces || [],
    createdAt: raw.createdAt,
  } as any;
}

export const UserService = {
  // Get own profile (full)
  getProfile: async () => {
    const response = await api.get('/users/profile');
    // sendSuccess wraps everything in { data: { user: ... } }
    const raw = response.data?.data?.user || response.data?.user;
    return shapeUser(raw) as IUserSafe;
  },

  // Update own profile
  updateProfile: async (data: { 
    name?: string; 
    username?: string; 
    bio?: string; 
    timezone?: string; 
    avatar?: string 
  }) => {
    const response = await api.patch('/users/profile', data);
    // Backend returns raw Mongoose doc inside { data: { user: doc } }
    const raw = response.data?.data?.user || response.data?.user;
    return shapeUser(raw) as IUserSafe;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.patch('/users/password', data);
    return response.data;
  },

  // Update notifications
  updateNotifications: async (data: { email?: boolean; inApp?: boolean }) => {
    const response = await api.patch('/users/notifications', data);
    return response.data?.data?.notificationPreferences || response.data?.notificationPreferences;
  },

  // Get any user's public profile
  getPublicProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    const raw = response.data?.data?.user || response.data?.user;
    return shapeUser(raw);
  },

  // Get member's role in a specific workspace
  // Falls back to 'owner' for org founders who may not be in workspace.members
  getMemberRole: async (workspaceId: string, userId: string) => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/members/${userId}/role`);
      return (response.data?.data?.role || response.data?.role || 'member') as string;
    } catch (err: any) {
      // api interceptor transforms error to { message, status }
      const status = err?.status || err?.response?.status;
      if (status === 404 || status === 403) return 'owner' as string;
      return 'member' as string;
    }
  },

  // Change member role (Admin/Owner only)
  updateMemberRole: async (workspaceId: string, userId: string, role: string) => {
    const response = await api.patch(`/workspaces/${workspaceId}/members/${userId}/role`, { role });
    return response.data?.data || response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete('/users/account');
    return response.data?.data || response.data;
  }
};
