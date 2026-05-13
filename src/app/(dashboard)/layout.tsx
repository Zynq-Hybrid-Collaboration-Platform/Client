"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  MessageSquare, Hash, Plus, Settings,
  Search, Bell, User, X, Check, Copy,
  Building2, Sparkles, Globe, Loader2,
  Mic, Video, Music, Volume2, Trash2,
  LogOut, HelpCircle, Menu, UserPlus, Lock, Shield
} from 'lucide-react';
import { WorkspaceService } from '@/lib/services/workspace.service';
import { ChannelService } from '@/lib/services/channel.service';
import { api } from '@/lib/api';
import { socketService } from '@/lib/services/socket.service';
import { AnimatePresence, motion } from 'framer-motion';
import type { IUserSafe } from '@/types/auth';
import dynamic from 'next/dynamic';

const AddChannelMemberDropdown = dynamic(() => import('@/components/chat/AddChannelMemberDropdown').then(mod => mod.AddChannelMemberDropdown), { ssr: false });
const ChannelRoleAssignmentDropdown = dynamic(() => import('@/components/chat/ChannelRoleAssignmentDropdown').then(mod => mod.ChannelRoleAssignmentDropdown), { ssr: false });
const InviteLinkModal = dynamic(() => import('@/components/chat/InviteLinkModal'), { ssr: false });
const WorkspaceSettingsModal = dynamic(() => import('@/components/workspace/settings/WorkspaceSettingsModal'), { ssr: false });
const NotificationBell = dynamic(() => import('@/components/workspace/NotificationBell'), { 
  loading: () => <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />,
  ssr: false 
});
const UserProfileModal = dynamic(() => import('@/components/workspace/UserProfileModal'), { ssr: false });
import { toast } from 'sonner';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setLoading = useAuthStore((state) => state.setLoading);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = React.useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [channels, setChannels] = React.useState<any[]>([]);
  const [isChannelsLoading, setIsChannelsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [channelToAddMemberId, setChannelToAddMemberId] = React.useState<string | null>(null);
  const [channelToAssignRolesId, setChannelToAssignRolesId] = React.useState<string | null>(null);
  const [isInviteLinkModalOpen, setIsInviteLinkModalOpen] = React.useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = React.useState(false);
  const [profileModalUserId, setProfileModalUserId] = React.useState<string | undefined>(undefined);

  // Extract workspace & channel context from URL dynamically
  const activeWorkspaceId = pathname?.split('/workspace/')[1]?.split('/')[0] || pathname?.split('/')[2];
  const channelMatch = pathname?.match(/\/channel\/([^\/]+)/);
  const activeChannelId = channelMatch ? channelMatch[1] : null;

  const [workspacesDetails, setWorkspacesDetails] = React.useState<Record<string, any>>({});

  // 0. Fetch full workspace details to get avatarUrls (since auth/me doesn't include them)
  React.useEffect(() => {
    if (!user?.workspaces) return;
    const fetchDetails = async () => {
      let changed = false;
      const newDetails = { ...workspacesDetails };
      
      await Promise.all(user.workspaces.map(async (w) => {
        if (!newDetails[w.workspaceId]) {
          try {
            const res = await api.get(`/workspaces/${w.workspaceId}`);
            if (res.data?.data?.workspace) {
              newDetails[w.workspaceId] = res.data.data.workspace;
              changed = true;
            }
          } catch (e) {}
        }
      }));

      if (changed) setWorkspacesDetails(newDetails);
    };
    fetchDetails();
  }, [user?.workspaces]);

  const activeWorkspace = workspacesDetails[activeWorkspaceId] || user?.workspaces?.find(w => w.workspaceId === activeWorkspaceId);
  const displayName = activeWorkspace ? activeWorkspace.name : "Workspace";

  // 1. ALWAYS refresh user roles from backend on mount.
  // Prevents stale localStorage role data from incorrectly granting admin UI to members.
  React.useEffect(() => {
    const refreshSession = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.data.user) {
          setUser(res.data.data.user);
        }
      } catch (err) {
        // If refresh fails, localStorage data is still used as fallback
        console.warn("Session refresh failed, using cached data");
      } finally {
        setLoading(false);
      }
    };
    refreshSession();
  }, []); // Run once on every mount — always get fresh roles from server

  // 2. Fetch Channels for active workspace
  React.useEffect(() => {
    // 🚨 THE FIX: Block 'join', 'setup', or any other non-ID words
    if (!activeWorkspaceId || activeWorkspaceId === 'join' || activeWorkspaceId === 'setup') {
      setChannels([]);
      return;
    }

    const fetchChannels = async () => {
      try {
        setIsChannelsLoading(true);
        const res = await api.get(`/channels/workspace/${activeWorkspaceId}`);
        setChannels(res.data.data.channels || []);
      } catch (err) {
        console.error("Failed to fetch channels", err);
      } finally {
        setIsChannelsLoading(false);
      }
    };
    fetchChannels();

    socketService.onChannelCreated((newChannel: any) => {
      if (newChannel.workspaceId === activeWorkspaceId) {
        setChannels(prev => {
          if (prev.some(c => c._id === newChannel._id || c.id === newChannel._id)) return prev;
          return [...prev, newChannel];
        });
      }
    });
  }, [activeWorkspaceId]);

  // 3. Real-Time Identity & Presence Synchronization
  React.useEffect(() => {
    // Listen for profile updates (name, avatar, bio)
    const handleProfileUpdate = (data: any) => {
      if (data.userId === user?.id) {
        // Update local store if it's the current user
        setUser({ ...user!, ...data, id: user!.id });
      }
      // Workspace sidebar and message list will naturally re-render or 
      // we can trigger a re-fetch if needed.
    };

    // Listen for status changes (online/offline)
    const handleStatusChange = (data: { userId: string, status: string }) => {
      if (data.userId === user?.id) {
        setUser({ ...user!, status: data.status });
      }
      // Other components (sidebar member list) should listen to this too
    };

    // Listen for role updates
    const handleRoleUpdate = (data: { userId: string, role: string, workspaceId: string }) => {
      if (data.userId === user?.id && data.workspaceId === activeWorkspaceId) {
        setUser({
          ...user!,
          workspaces: user!.workspaces.map(w => 
            w.workspaceId === data.workspaceId ? { ...w, role: data.role } : w
          )
        });
        toast.info(`Your role in this workspace has been updated to ${data.role}`);
      }
    };

    // Listen for account deletion/removal
    const handleMemberRemoved = (data: { userId: string, workspaceId: string }) => {
      if (data.userId === user?.id) {
        if (data.workspaceId === activeWorkspaceId) {
          toast.error("You have been removed from this workspace");
          router.push('/workspace');
        } else {
          // Update workspaces list
          setUser({
            ...user!,
            workspaces: user!.workspaces.filter(w => w.workspaceId !== data.workspaceId)
          });
        }
      }
    };

    socketService.onUserProfileUpdated(handleProfileUpdate);
    socketService.onUserStatusChanged(handleStatusChange);
    socketService.onMemberRoleUpdated(handleRoleUpdate);
    socketService.onMemberRemoved(handleMemberRemoved);

    // 4. Custom Event Listener for opening profiles from children (ChatRoom, TaskBoard etc.)
    const handleOpenProfileEvent = (e: any) => {
      const { userId } = e.detail;
      setProfileModalUserId(userId);
      setIsUserProfileModalOpen(true);
    };

    window.addEventListener('open-user-profile', handleOpenProfileEvent);

    return () => {
      socketService.offUserProfileUpdated(handleProfileUpdate);
      socketService.offUserStatusChanged(handleStatusChange);
      socketService.offMemberRoleUpdated(handleRoleUpdate);
      socketService.offMemberRemoved(handleMemberRemoved);
      window.removeEventListener('open-user-profile', handleOpenProfileEvent);
    };
  }, [user, activeWorkspaceId]);

  // Join workspace room for real-time presence
  React.useEffect(() => {
    if (activeWorkspaceId && activeWorkspaceId !== 'join' && activeWorkspaceId !== 'setup') {
      socketService.joinWorkspace(activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  const handleDeleteWorkspace = () => {
    if (!activeWorkspaceId) return;
    
    toast.error('Delete Workspace?', {
      description: `This will permanently delete "${displayName}" and all its channels.`,
      action: {
        label: 'Delete Permanently',
        onClick: async () => {
          try {
            setIsDeleting(true);
            await api.delete(`/workspaces/${activeWorkspaceId}`);
            const res = await api.get('/auth/me');
            if (res.data.success && res.data.data.user) {
              setUser(res.data.data.user);
            }
            router.push('/workspace'); // Redirect to selection page
            toast.success('Workspace deleted successfully.');
          } catch (err) {
            console.error("Failed to delete workspace", err);
            toast.error('Failed to delete workspace.');
          } finally {
            setIsDeleting(false);
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  const handleDeleteChannel = (channelIdToDelete: string, channelName?: string) => {
    toast.error('Delete channel?', {
      description: `Are you sure you want to permanently delete #${channelName || 'this channel'}?`,
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await ChannelService.deleteChannel(channelIdToDelete);
            setChannels(prev => prev.filter(c => (c._id || c.id) !== channelIdToDelete));
            if (activeChannelId === channelIdToDelete) {
              router.push(`/workspace/${activeWorkspaceId}`);
            }
            toast.success('Channel deleted successfully.');
          } catch (err) {
            console.error("Failed to delete channel", err);
            toast.error('Failed to delete channel.');
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  // Permissions Logic
  // ONLY check workspace-level role — this is the backend-enforced source of truth.
  // Do NOT use org role here — a user can be org admin in their own org but just a member in this workspace.
  const activeOrgId = (activeWorkspace as any)?.orgId || user?.organizations?.[0]?.orgId;
  const isPrivileged = !!user?.workspaces?.some(w => w.workspaceId === activeWorkspaceId && (w.role === 'admin' || w.role === 'owner'));
  const isOrgFounder = !!user?.workspaces?.some(w => w.workspaceId === activeWorkspaceId && (w.role === 'admin' || w.role === 'owner'));

  // Loading State (Premium Spinner)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-slate-500/20 border-t-white rounded-full"
        />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Syncing session...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-slate-300 overflow-hidden font-sans relative">

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[40] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ─── FAR LEFT SIDEBAR (WORKSPACES) ─── */}
      <aside className={`absolute md:relative z-[50] md:z-20 h-full w-20 bg-black/60 backdrop-blur-xl border-r border-slate-800/60 flex flex-col items-center py-4 gap-4 shrink-0 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Home / Direct Messages placeholder */}
        <div className="group relative">
          <button className="w-12 h-12 bg-slate-900 rounded-3xl hover:rounded-xl transition-all duration-300 flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white">
            <MessageSquare className="w-6 h-6" />
          </button>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-full transition-all duration-300 group-hover:h-5"></div>
        </div>

        <div className="w-8 h-[2px] bg-slate-800 rounded-full shrink-0"></div>

        {/* Workspace List (Dynamic) */}
        <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar w-full items-center shrink-0 max-h-[240px]">
          {user?.workspaces?.map((ws) => {
            const isActive = pathname?.includes(ws.workspaceId);
            // Helper for initials
            const initials = ws.name
              .split(' ')
              .map(word => word[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            // Generate a deterministic gradient class based on the workspace ID's character sum
            const gradients = [
              "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
              "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600",
              "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500",
              "bg-gradient-to-br from-rose-400 via-red-500 to-orange-500",
              "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
              "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-400"
            ];
            const hash = Array.from(ws.workspaceId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
            const gradientClass = gradients[hash % gradients.length];

            return (
              <div key={ws.workspaceId} className="group relative shrink-0">
                <Link href={`/workspace/${ws.workspaceId}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <button
                    style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: "1px" }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-all duration-300 ${isActive
                      ? `${gradientClass} shadow-[0_0_20px_rgba(255,255,255,0.3)] text-white ring-2 ring-white/30 scale-105 overflow-hidden`
                      : `${gradientClass} opacity-70 hover:opacity-100 hover:scale-[1.02] text-white/90 overflow-hidden`
                      }`}>
                    {workspacesDetails[ws.workspaceId]?.avatarUrl ? (
                      <img src={workspacesDetails[ws.workspaceId].avatarUrl} alt={ws.name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </button>
                </Link>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full transition-all duration-300"></div>
                )}
                {!isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white opacity-0 group-hover:opacity-100 group-hover:h-5 rounded-r-full transition-all duration-300"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Workspace / Create Workspace */}
        <div className="group/btn relative mt-auto">
          <div className="absolute left-[60px] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity z-50">
            {isOrgFounder ? 'Create Workspace' : 'Join Workspace'}
            <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 border-[4px] border-transparent border-r-slate-800"></div>
          </div>
          {isOrgFounder ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-12 h-12 bg-slate-900/80 border border-white/[0.06] rounded-xl hover:rounded-lg transition-all duration-300 flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5"
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : (
            <Link href="/workspace/join">
              <button className="w-12 h-12 bg-slate-900/80 border border-white/[0.06] rounded-xl hover:rounded-lg transition-all duration-300 flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5">
                <Plus className="w-5 h-5" />
              </button>
            </Link>
          )}
        </div>

        <div className="w-8 h-[1px] bg-slate-800/80 my-2"></div>

        <button 
          onClick={() => {
            if (isPrivileged) setIsSettingsModalOpen(true);
            else toast.error("Only workspace admins can access settings");
          }}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all mb-1 group"
        >
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
        </button>
        <button className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all mb-1 group">
          <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => {
            toast('Ready to leave?', {
              description: 'Are you sure you want to log out of SYNQ?',
              action: {
                label: 'Log Out',
                onClick: () => {
                  setUser(null);
                  router.push('/login');
                  toast.success('Successfully logged out.');
                }
              },
              cancel: {
                label: 'Cancel',
                onClick: () => {}
              }
            });
          }}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-all mb-4 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
      </aside>

      {/* ─── CREATE WORKSPACE MODAL ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-[420px] bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-0 shadow-2xl overflow-hidden"
            >
              {/* Top accent line */}
              <div className="h-[2px] bg-white/20" />

              <CreateWorkspaceForm
                onSuccess={(newUser: IUserSafe) => {
                  setUser(newUser);
                }}
                onClose={() => setIsModalOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── CREATE CHANNEL MODAL ─── */}
      <AnimatePresence>
        {isChannelModalOpen && activeWorkspaceId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChannelModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-[420px] bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-0 shadow-2xl overflow-hidden"
            >
              <div className="h-[2px] bg-white/20" />
              <CreateChannelForm
                workspaceId={activeWorkspaceId}
                onSuccess={(newChannel: any) => {
                  setChannels(prev => {
                    if (prev.some(c => c._id === newChannel._id || c.id === newChannel._id)) return prev;
                    return [...prev, newChannel];
                  });
                  setIsChannelModalOpen(false);
                  // Instantly navigate to the newly created channel to provide immediate UI feedback limit refresh
                  router.push(`/workspace/${activeWorkspaceId}/channel/${newChannel._id || newChannel.id}`);
                }}
                onClose={() => setIsChannelModalOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── INVITE MEMBER MODAL ─── */}
      <AnimatePresence>
        {isInviteModalOpen && activeWorkspaceId && activeOrgId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <InviteMemberForm
                workspaceId={activeWorkspaceId}
                orgId={activeOrgId}
                onClose={() => setIsInviteModalOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── WORKSPACE INVITE LINK MODAL (PHASE 2) ─── */}
      <AnimatePresence>
        {isInviteLinkModalOpen && activeWorkspaceId && (
          <InviteLinkModal 
            workspaceId={activeWorkspaceId}
            isOwner={isOrgFounder}
            onClose={() => setIsInviteLinkModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── WORKSPACE SETTINGS MODAL ─── */}
      <AnimatePresence>
        {isSettingsModalOpen && activeWorkspaceId && (
          <WorkspaceSettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            workspaceId={activeWorkspaceId}
            workspace={activeWorkspace}
          />
        )}
      </AnimatePresence>

      {/* ─── ADD CHANNEL MEMBER DROPDOWN ─── */}
      {channelToAddMemberId && activeOrgId && (
        <AddChannelMemberDropdown
          isOpen={!!channelToAddMemberId}
          onClose={() => setChannelToAddMemberId(null)}
          orgId={activeOrgId}
          channelId={channelToAddMemberId}
          workspaceId={activeWorkspaceId}
          onMemberAdded={(updatedChannel) => {
            // Update channel list to reflect new membership
            setChannels(prev => prev.map(c => 
              (c._id || c.id) === channelToAddMemberId ? updatedChannel : c
            ));
          }}
          existingMemberIds={channels.find(c => (c._id || c.id) === channelToAddMemberId)?.members?.map((m: any) => m._id?.toString() || m.id?.toString() || m.toString()) || []}
        />
      )}

      {/* ─── USER PROFILE MODAL ─── */}
      <AnimatePresence>
        {isUserProfileModalOpen && activeWorkspaceId && (
          <UserProfileModal 
            isOpen={isUserProfileModalOpen}
            onClose={() => setIsUserProfileModalOpen(false)}
            userId={profileModalUserId}
            workspaceId={activeWorkspaceId}
          />
        )}
      </AnimatePresence>

      {/* ─── ROLE ASSIGNMENT DROPDOWN ─── */}
      {channelToAssignRolesId && activeOrgId && (
        <ChannelRoleAssignmentDropdown
          isOpen={!!channelToAssignRolesId}
          onClose={() => setChannelToAssignRolesId(null)}
          orgId={activeOrgId}
          channelId={channelToAssignRolesId}
          initialAllowedRoles={channels.find(c => (c._id || c.id) === channelToAssignRolesId)?.allowedRoles || []}
          onChannelUpdated={(updatedChannel) => {
            setChannels(prev => prev.map(c => 
              (c._id || c.id) === channelToAssignRolesId ? updatedChannel : c
            ));
          }}
        />
      )}


      {/* ─── INNER SIDEBAR (CHANNELS) ─── */}
      {activeWorkspaceId && (
        <aside className={`absolute md:relative z-[45] md:z-10 h-full w-64 left-20 md:left-0 bg-black/40 backdrop-blur-xl border-r border-slate-800/60 flex flex-col py-4 shrink-0 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[200%] md:translate-x-0'}`}>

          {/* Workspace Header */}
          <div className="h-16 border-b border-slate-800/60 flex items-center px-4 hover:bg-slate-900/40 cursor-pointer transition-all shrink-0 relative group">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-100 truncate text-lg leading-tight">{displayName}</span>
              {isOrgFounder && (
                <button 
                  onClick={() => setIsInviteLinkModalOpen(true)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400/80 hover:text-indigo-400 uppercase tracking-widest mt-0.5 transition-colors group/invite"
                >
                  <UserPlus className="w-3 h-3 group-hover/invite:scale-110 transition-transform" />
                  Invite People
                </button>
              )}
            </div>
          </div>

          {/* Channel Categories */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            <div className="flex flex-col items-center justify-center mb-6 mt-4 px-4">
              <div className="flex items-center justify-center gap-3 mb-3">
                {isOrgFounder && (
                  <button
                    onClick={() => handleDeleteWorkspace()}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/20 group"
                    title="Delete Workspace"
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isPrivileged) setIsChannelModalOpen(true);
                    else alert("Only workspace admins can create new channels.");
                  }}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5 hover:border-white/20 group"
                  title="Create Channel"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] select-none">Channels</span>
            </div>

            {isChannelsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            ) : channels.length > 0 ? (
              channels.map(channel => {
                const isMember = channel.name.toLowerCase() === 'general' || isPrivileged || (channel.members && channel.members.some((m: any) => {
                  const mId = typeof m === 'object' && m !== null 
                    ? (m._id?.toString() || m.id?.toString() || m.userId?.toString() || (m.userId && m.userId._id?.toString())) 
                    : m?.toString();
                  const uId = user?.id?.toString() || (user as any)?._id?.toString() || (user as any)?.userId?.toString();
                  return mId && uId && mId.toLowerCase() === uId.toLowerCase();
                }));

                const Icon = !isMember ? Lock :
                  channel.type === 'VOICE' ? Mic :
                    channel.type === 'VIDEO' ? Video :
                      channel.type === 'AUDIO' ? Music : Hash;

                return (
                  <div
                    key={channel._id || channel.id}
                    onClick={(e) => {
                      if (!isMember) {
                        e.preventDefault();
                        // Instead of redirecting, just show a temporary text alert natively hovering
                        const lockBtn = e.currentTarget;
                        const originalText = lockBtn.querySelector('span')?.innerText;
                        const span = lockBtn.querySelector('span');
                        if (span && originalText) {
                          span.innerText = "Private (Ask Admin)";
                          span.classList.add("text-rose-400");
                          setTimeout(() => {
                            span.innerText = originalText;
                            span.classList.remove("text-rose-400");
                          }, 2000);
                        }
                        return;
                      }
                      setIsMobileMenuOpen(false);
                      router.push(`/workspace/${activeWorkspaceId}/channel/${channel._id || channel.id}`);
                    }}
                    className={`group/channel flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer ${isMember ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-500'}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <Icon className={`w-4 h-4 shrink-0 ${!isMember ? 'opacity-70' : ''}`} />
                      <span className="text-sm font-medium truncate">{channel.name}</span>
                    </div>

                    {isPrivileged && channel.name.toLowerCase() !== 'general' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover/channel:opacity-100 transition-opacity pl-2">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setChannelToAddMemberId(channel._id || channel.id); 
                          }} 
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-indigo-400 transition-colors group/btn relative"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-[10px] text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover/btn:opacity-100 whitespace-nowrap z-50 pointer-events-none">Add Member</span>
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setChannelToAssignRolesId(channel._id || channel.id);
                          }} 
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-amber-400 transition-colors group/btn relative"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-[10px] text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover/btn:opacity-100 whitespace-nowrap z-50 pointer-events-none">Role Assignment</span>
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDeleteChannel(channel._id || channel.id, channel.name); 
                          }} 
                          className="p-1 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded transition-colors group/btn relative"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-[10px] text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover/btn:opacity-100 whitespace-nowrap z-50 pointer-events-none">Delete Channel</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-6 opacity-50 text-center px-4">
                <Hash className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-500">No channels yet.</p>
              </div>
            )}
          </nav>

        </aside>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative z-10">

        {/* Channel Header */}
        <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-4 md:px-6 bg-black/70 backdrop-blur-xl z-20 shrink-0 shadow-sm relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg bg-white/5 border border-white/5 active:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Optional: Add channel specific name here later */}
          </div>

          <div className="flex items-center gap-5">

            <div className="flex items-center bg-black/60 backdrop-blur-xl border border-white/5 rounded-full px-3 py-1.5 w-24 sm:w-48 lg:w-72 focus-within:border-indigo-500/50 focus-within:bg-[#111] focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-inner group shrink">
              <Search className="h-4 w-4 text-slate-500 sm:mr-2 group-focus-within:text-indigo-400 transition-colors shrink-0" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm text-slate-200 w-full placeholder:text-slate-600 hidden sm:block" />
            </div>
            <NotificationBell />
            <div 
              onClick={() => {
                setProfileModalUserId(undefined);
                setIsUserProfileModalOpen(true);
              }}
              className="flex items-center gap-3 pl-3 border-l border-white/10 cursor-pointer group"
            >
              <div className="relative">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-[#0a0a0a] group-hover:border-indigo-500/50 transition-all shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 border-2 border-[#0a0a0a] group-hover:border-indigo-500/50 transition-all shadow-sm">
                    <span className="text-white text-sm font-bold leading-none">{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${user?.status === 'online' ? 'bg-emerald-500' : 'bg-gray-500'} border-2 border-[#000] rounded-full`}></div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content passed below */}
        <div className="flex-1 overflow-auto relative z-10 custom-scrollbar flex flex-col bg-transparent">
          {children}
        </div>
      </main>
    </div>
  );
}

function CreateWorkspaceForm({
  onSuccess,
  onClose
}: {
  onSuccess: (user: IUserSafe) => void;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = React.useState<string | null>(null);
  const [newWorkspaceId, setNewWorkspaceId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto-generate slug from name
  React.useEffect(() => {
    const generatedSlug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    setSlug(generatedSlug);
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Create Workspace
      // Use the first organization where the user is an admin
      const orgAdmin = user?.organizations?.find(o => o.role === 'admin');

      const wsRes = await WorkspaceService.createWorkspace({
        name,
        orgId: orgAdmin?.orgId
      });
      const workspaceId = wsRes.data.workspace._id || wsRes.data.workspace.id;
      setNewWorkspaceId(workspaceId);

      // 2. Generate Invite Code for this workspace
      const inviteRes = await api.post(`/workspaces/${workspaceId}/invites`, {
        expiresIn: "7d",
        maxUses: 100
      });

      setCreatedInvite(inviteRes.data.data.invite.code);

      // 3. Refresh user data to get the new workspace in the sidebar
      const userRes = await api.get('/auth/me');
      onSuccess(userRes.data.data.user);

    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create workspace');
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdInvite) return;
    navigator.clipboard.writeText(createdInvite);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdInvite) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Space Launched!</h2>
          <p className="text-slate-400 text-center text-sm px-4">Your new workspace is ready. Use this invite code to bring in your team.</p>
        </div>

        <div className="mt-8 flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl justify-between group/code transition-all hover:border-white/20">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold ml-1 mb-1">Invite Code</span>
            <code className="text-2xl font-mono font-bold text-white px-1 tracking-wider">
              {createdInvite}
            </code>
          </div>
          <button
            onClick={copyToClipboard}
            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/10 group-hover/code:scale-105 active:scale-95"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <button
          onClick={() => {
            if (newWorkspaceId) {
              router.push(`/workspace/${newWorkspaceId}`);
              onClose();
            } else {
              window.location.reload();
            }
          }}
          className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-all shadow-xl active:scale-[0.98] mt-4"
        >
          Go to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 relative">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-all z-20"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center justify-center mb-8 text-center pt-4">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 relative group">
          <Building2 className="w-6 h-6 text-white relative z-10" />
        </div>
        <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">Launch Your Space</h2>
        <p className="text-slate-400 text-sm max-w-[280px]">Establish your team's headquarters on SYNQ.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-shake">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 block mb-1">Workspace Name</label>
          <div className="relative group">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Galaxy Design"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 block mb-1">Workspace Slug</label>
          <div className="relative group flex items-center">
            <div className="absolute left-3 text-slate-500 font-medium pointer-events-none select-none text-sm border-r border-white/10 pr-2 py-1">synq.com/</div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="galaxy"
              className="w-full pl-[95px] px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <button
          disabled={isLoading || !name.trim()}
          className="w-full py-2.5 mt-2 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
              />
              <span>Launching...</span>
            </>
          ) : (
            "Initialize Workspace"
          )}
        </button>
      </form>
    </div>
  );
}

function CreateChannelForm({
  workspaceId,
  onSuccess,
  onClose
}: {
  workspaceId: string;
  onSuccess: (channel: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<'TEXT' | 'VOICE' | 'AUDIO' | 'VIDEO'>('TEXT');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const res = await ChannelService.createChannel({
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type,
        workspaceId
      });

      onSuccess(res.data.channel);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create channel');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 relative">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-all z-20"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center justify-center mb-8 text-center pt-4">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 relative group">
          <Hash className="w-6 h-6 text-white relative z-10" />
        </div>
        <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">Create Channel</h2>
        <p className="text-slate-400 text-sm max-w-[280px]">Set up a new space for your team to connect.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-shake">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 block mb-1">Channel Name</label>
          <div className="relative group flex items-center">
            <div className="absolute left-3 text-slate-500 font-medium pointer-events-none select-none text-sm border-r border-white/10 pr-2 py-1">
              #
            </div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-channel"
              className="w-full pl-[40px] px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <button
          disabled={isLoading || !name.trim()}
          className="w-full py-2.5 mt-2 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
              />
              <span>Creating...</span>
            </>
          ) : (
            "Create Channel"
          )}
        </button>
      </form>
    </div>
  );
}

function InviteMemberForm({
  workspaceId,
  orgId,
  onClose
}: {
  workspaceId: string;
  orgId: string;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [inviteCode, setInviteCode] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.post('/invites', {
        organizationId: orgId,
        workspaceId,
        expiresInHours: 168,
        maxUses: 100
      });
      setInviteCode(res.data.data.invite.code);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate invite');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 relative">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-all z-20"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center justify-center mb-6 text-center pt-4">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 relative group">
          <UserPlus className="w-6 h-6 text-indigo-400 relative z-10" />
        </div>
        <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">Invite Members</h2>
        <p className="text-slate-400 text-sm max-w-[280px]">Generate a code to invite team members securely.</p>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-shake">
          {error}
        </div>
      )}

      {!inviteCode ? (
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3 rounded-md bg-white text-black font-semibold text-sm hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full" />
          ) : (
            "Generate Invite Link"
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl justify-between group/code transition-all hover:border-white/20">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold ml-1 mb-1">Invite Code</span>
              <code className="text-2xl font-mono font-bold text-white px-1 tracking-wider">
                {inviteCode}
              </code>
            </div>
            <button
              onClick={copyToClipboard}
              className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/10 group-hover/code:scale-105 active:scale-95"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 mt-2 rounded-md bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
