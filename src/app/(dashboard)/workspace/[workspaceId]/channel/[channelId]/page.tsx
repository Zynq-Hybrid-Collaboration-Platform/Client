"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Info, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ChatRoom = dynamic(() => import('@/components/chat/ChatRoom'), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-black/50">
      <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
    </div>
  ),
  ssr: false
});

const CallRoom = dynamic(() => import('@/components/chat/CallRoom'), {
  ssr: false
});

const KanbanBoard = dynamic(() => import('@/components/tasks/KanbanBoard'), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-black/50">
      <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
    </div>
  ),
  ssr: false
});
import { useAuthStore } from '@/store/authStore';
import { OrganizationService } from '@/lib/services/organization.service';
import { WorkspaceService } from '@/lib/services/workspace.service';
import { socketService } from '@/lib/services/socket.service';

import { useChannelCallTracker } from '@/hooks/useChannelCallTracker';
import { CallNotificationBanner } from '@/components/chat/CallNotificationBanner';
import { ChannelHeader } from '@/components/chat/ChannelHeader';
import { AddChannelMemberDropdown } from '@/components/chat/AddChannelMemberDropdown';
import { ChannelRoleAssignmentDropdown } from '@/components/chat/ChannelRoleAssignmentDropdown';

export default function ChannelPage() {
  const { workspaceId, channelId } = useParams();
  const [channel, setChannel] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [resolvedOrgId, setResolvedOrgId] = React.useState<string | null>(null);
  
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [isRoleAssignmentOpen, setIsRoleAssignmentOpen] = React.useState(false);

  // Tab state tracking
  const [activeTab, setActiveTab] = React.useState<'chat' | 'tasks'>(() => {
    if (typeof window !== 'undefined') {
       return (sessionStorage.getItem(`activeTab_${channelId}`) as 'chat' | 'tasks') || 'chat';
    }
    return 'chat';
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
       sessionStorage.setItem(`activeTab_${channelId}`, activeTab);
    }
  }, [activeTab, channelId]);

  // Call state tracking
  const [isCallActive, setIsCallActive] = React.useState(false); 
  const [isCallVisible, setIsCallVisible] = React.useState(false);
  const [isCallExpanded, setIsCallExpanded] = React.useState(false); // Fullscreen mode
  
  // Persist call active state across refreshes
  React.useEffect(() => {
    const saved = sessionStorage.getItem(`call_active_${channelId}`);
    if (saved === 'true') setIsCallActive(true);
  }, [channelId]);

  React.useEffect(() => {
    if (isCallActive) {
      sessionStorage.setItem(`call_active_${channelId}`, 'true');
      setIsCallExpanded(true); // Default to fullscreen when call starts
      setIsCallVisible(true);
    } else {
      sessionStorage.removeItem(`call_active_${channelId}`);
      setIsCallExpanded(false);
      setIsCallVisible(false);
    }
  }, [isCallActive, channelId]);

  const [workspaceMembers, setWorkspaceMembers] = React.useState<any[]>([]);
  
  const user = useAuthStore((state) => state.user);
  // ONLY check workspace-level role — this is the backend-enforced source of truth.
  const isPrivileged = !!user?.workspaces?.some((w: any) => (w.workspaceId === workspaceId || w._id === workspaceId) && (w.role === 'admin' || w.role === 'owner'));

  // React hook managing all the complex socket connections and variables
  const callTracker = useChannelCallTracker(
    channelId as string,
    channel?.type || '',
    isPrivileged || false,
    isCallActive,
    setIsCallActive
  );

  // Reset the call state if they switch to a different channel in the sidebar
  React.useEffect(() => {
    setIsCallActive(false);
  }, [channelId]);

  // Ensure socket is connected globally for this channel
  // CRITICAL FIX: joinChannel must happen AFTER socket is confirmed connected.
  // In production, connect() is async — emitting join-channel before the
  // handshake completes causes the event to be silently dropped on the server.
  // Also join workspace room — backend now emits status/task events to workspace_${id}
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const socket = socketService.connect();

    const doJoin = () => {
      socketService.joinChannel(channelId as string);
      // Join workspace room for Kanban statuses and task events
      if (workspaceId) {
        socketService.joinWorkspace(workspaceId as string);
      }
    };

    if (socket.connected) {
      // Already connected (e.g. navigating between channels)
      doJoin();
    } else {
      // Wait for the connection handshake to complete first
      socket.once('connect', doJoin);
    }

    return () => {
      socket.off('connect', doJoin);
    };
  }, [channelId, workspaceId]);

  React.useEffect(() => {
    const fetchChannelData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch channel list and current channel
        const res = await api.get(`/channels/workspace/${workspaceId}`);
        const currentChannel = res.data.data.channels.find((c: any) => c._id === channelId || c.id === channelId);
        setChannel(currentChannel);

        // 2. Fetch workspace/org details & members (Wrap in sub-try to prevent crash)
        try {
          const workspaceRes = await WorkspaceService.getWorkspaceById(workspaceId as string);
          const workspaceInfo = workspaceRes.data?.workspace || workspaceRes.data || workspaceRes.workspace || workspaceRes;
          
          // Use a more robust check for Org ID
          const orgId = workspaceInfo?.organizationId?._id || 
                        workspaceInfo?.organizationId || 
                        workspaceInfo?.orgId?._id || 
                        workspaceInfo?.orgId || 
                        channel?.organizationId || 
                        workspaceId;
                        
          setResolvedOrgId(String(orgId));

          const membersRes = await OrganizationService.getOrganizationMembers(orgId as string);
          if (membersRes) {
            const memberData = membersRes.data || membersRes.members || (Array.isArray(membersRes) ? membersRes : null);
            if (memberData) setWorkspaceMembers(Array.isArray(memberData) ? memberData : memberData.members || []);
          }
        } catch (memberErr) {
          console.warn("Non-critical: Failed to fetch address book/org details", memberErr);
        }
      } catch (err) {
        console.error("Failed to fetch channel or members (ignoring for UI)", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId && channelId) {
      fetchChannelData();
    }
  }, [workspaceId, channelId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black text-slate-400">
        <Info className="w-12 h-12 mb-4 opacity-20" />
        <p>Channel not found.</p>
      </div>
    );
  }

  // --- UNIFIED CHANNEL UI ---
  // We use a Split Screen layout: Chat on the left, Call on the right.
  return (
    <div className="flex w-full h-full relative overflow-hidden bg-transparent">
      
      {/* 🚀 Interactive Call Notification Banner (For Members) */}
      <CallNotificationBanner 
        isCallOngoing={callTracker.isCallOngoing}
        isCallActive={isCallActive}
        isCallVisible={isCallVisible}
        bannerState={callTracker.bannerState}
        isAudioOnlyMode={callTracker.isAudioOnlyMode}
        channel={channel}
        setBannerState={callTracker.setBannerState}
        setIsAudioOnlyMode={callTracker.setIsAudioOnlyMode}
        setIsCallActive={setIsCallActive}
        setIsCallVisible={setIsCallVisible}
      />

      {/* 💬 Left Panel: Chat Room / Tasks */}
      <div className={`flex flex-col h-full bg-transparent transition-all duration-500 ease-in-out 
        ${(isCallExpanded && isCallVisible) ? 'w-0 opacity-0 pointer-events-none' : 
          (isCallActive && isCallVisible) ? 'w-full md:w-1/2 lg:w-2/3 md:border-r border-white/10 hidden md:flex' : 'w-full'}`}>
        
        {/* Unified Channel Header & Owner Call Controls */}
        <ChannelHeader 
          channel={channel}
          channelId={channelId as string}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isPrivileged={isPrivileged || false}
          isCallOngoing={callTracker.isCallOngoing}
          setIsAudioOnlyMode={callTracker.setIsAudioOnlyMode}
          setIsCallOngoing={callTracker.setIsCallOngoing}
          setIsCallActive={setIsCallActive}
          onAddMemberClick={() => setIsAddMemberOpen(true)}
          onRoleAssignmentClick={() => setIsRoleAssignmentOpen(true)}
        />

        {/* Modals for Channel Header */}
        {resolvedOrgId && (
          <AddChannelMemberDropdown
            isOpen={isAddMemberOpen}
            onClose={() => setIsAddMemberOpen(false)}
            orgId={resolvedOrgId}
            channelId={channelId as string}
            workspaceId={workspaceId as string}
            onMemberAdded={(updatedChannel) => setChannel(updatedChannel)}
            existingMemberIds={channel?.members?.map((m: any) => m._id?.toString() || m.id?.toString() || m.toString()) || []}
          />
        )}
        {resolvedOrgId && (
          <ChannelRoleAssignmentDropdown
            isOpen={isRoleAssignmentOpen}
            onClose={() => setIsRoleAssignmentOpen(false)}
            orgId={resolvedOrgId}
            channelId={channelId as string}
            initialAllowedRoles={channel?.allowedRoles || []}
            onChannelUpdated={(updatedChannel) => setChannel(updatedChannel)}
          />
        )}

        <div className="flex-1 min-h-0 relative z-10 w-full overflow-hidden">
           {activeTab === 'tasks' ? (
             <KanbanBoard channelId={channelId as string} isPrivileged={isPrivileged || false} />
           ) : (
             <ChatRoom channelId={channelId as string} channel={channel} workspaceMembers={workspaceMembers} />
           )}
        </div>
      </div>

      {/* 📹 Right Panel: Call Room Grid */}
      <AnimatePresence>
        {isCallActive && channel && (
          <motion.div 
            initial={{ width: 0, opacity: 0, x: 50 }}
            animate={{ 
              width: !isCallVisible ? 0 : (isCallExpanded ? "100%" : "480px"), 
              opacity: !isCallVisible ? 0 : 1, 
              x: !isCallVisible ? 50 : 0 
            }}
            exit={{ width: 0, opacity: 0, x: 50 }}
            className={`h-full bg-[#050505] relative z-40 shrink-0 border-l border-white/5 overflow-hidden flex flex-col transition-all duration-500 ease-in-out ${!isCallVisible ? 'pointer-events-none' : ''}`}
          >
            <div className="h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-4 shrink-0 z-50">
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                   Active Call
                 </div>
                 {isCallExpanded && (
                   <button 
                     onClick={() => setIsCallExpanded(false)}
                     className="px-2.5 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 rounded-full border border-white/10 transition-all"
                   >
                     Exit Fullscreen
                   </button>
                 )}
               </div>
               
               <div className="flex items-center gap-2">
                 {!isCallExpanded && (
                   <button 
                     onClick={() => setIsCallExpanded(true)}
                     className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-all text-xs font-semibold"
                     title="Fullscreen mode"
                   >
                     <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 3 6 6M9 21l-6-6M21 3v6h-6M3 21v-6h6" />
                     </motion.svg>
                   </button>
                 )}
                 <button onClick={() => { setIsCallVisible(false); }} className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-all text-xs font-semibold flex items-center gap-1.5">
                   <X className="w-3.5 h-3.5" /> Hide Grid
                 </button>
               </div>
            </div>
            <div className="flex-1 mt-14 relative h-[calc(100%-3.5rem)]">
               <CallRoom 
                 channelId={channelId as string} 
                 isAudioOnly={callTracker.isAudioOnlyMode} 
                 channel={channel} 
                 workspaceMembers={workspaceMembers}
                 isExpanded={isCallExpanded}
                 isHidden={!isCallVisible}
                 onClose={() => setIsCallActive(false)} 
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}