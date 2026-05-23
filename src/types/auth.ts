export interface IUserSafe {
    id: string;
    name: string;
    email: string;
    username: string;
    avatar: string;
    status: string;
    bio?: string;
    timezone?: string;
    notificationPreferences?: {
      email: boolean;
      inApp: boolean;
    };
    organizations: Array<{ orgId: string; role: string; joinedAt: string }>;
    workspaces: Array<{ workspaceId: string; name: string; joinedAt: string; role?: string }>;
}
