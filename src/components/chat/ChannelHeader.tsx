import React from 'react';
import { Hash, Video, Phone, UserPlus, Shield, Trash2 } from 'lucide-react';
import { socketService } from '@/lib/services/socket.service';

interface ChannelHeaderProps {
  channel: any;
  channelId: string;
  activeTab: 'chat' | 'tasks';
  setActiveTab: (tab: 'chat' | 'tasks') => void;
  isPrivileged: boolean;
  isCallOngoing: boolean;
  setIsAudioOnlyMode: (val: boolean) => void;
  setIsCallOngoing: (val: boolean) => void;
  setIsCallActive: (val: boolean) => void;
  onAddMemberClick?: () => void;
  onRoleAssignmentClick?: () => void;
}

export function ChannelHeader({
  channel,
  channelId,
  activeTab,
  setActiveTab,
  isPrivileged,
  isCallOngoing,
  setIsAudioOnlyMode,
  setIsCallOngoing,
  setIsCallActive,
  onAddMemberClick,
  onRoleAssignmentClick
}: ChannelHeaderProps) {
  return (
    <div className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 shrink-0 z-20">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center gap-2 group cursor-pointer border-r border-white/10 pr-2 sm:pr-4 min-w-0">
          <Hash className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
          <span className="text-[15px] font-bold text-slate-200 truncate max-w-[100px] sm:max-w-xs">{channel.name}</span>
        </div>

        {/* TABS Toggle */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-md">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${activeTab === 'chat' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${activeTab === 'tasks' ? 'bg-indigo-500/20 text-indigo-400 shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            Tasks
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* Admin/Owner Channel Controls */}
        {isPrivileged && channel.name.toLowerCase() !== 'general' && (
          <div className="flex items-center gap-0 sm:gap-1 border-r border-white/10 pr-1 sm:pr-3 mr-1">
            <button 
              onClick={onAddMemberClick}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-md transition-all group relative"
            >
              <UserPlus className="w-4 h-4" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">Add Member</span>
            </button>
            <button 
              onClick={onRoleAssignmentClick}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-md transition-all group relative"
            >
              <Shield className="w-4 h-4" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">Role Assignment</span>
            </button>
            <button 
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all group relative"
            >
              <Trash2 className="w-4 h-4" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">Delete Channel</span>
            </button>
          </div>
        )}

        {/* Owner Restricted Call Area */}
        {isPrivileged ? (
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white/5 border border-white/5 rounded-lg p-0.5 sm:p-1">
            <button 
              onClick={() => { 
                socketService.sendMessage(channelId, "@@SYSTEM_CALL_TYPE:VIDEO");
                setIsAudioOnlyMode(false); 
                setIsCallOngoing(true); 
                setIsCallActive(true); 
              }}
              className={`p-1.5 rounded-md transition-all group relative ${isCallOngoing ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              <Video className="w-4 h-4" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                {isCallOngoing ? "Call in progress" : "Start Video Call"}
              </span>
            </button>
            <button 
              onClick={() => { 
                socketService.sendMessage(channelId, "@@SYSTEM_CALL_TYPE:AUDIO");
                setIsAudioOnlyMode(true); 
                setIsCallOngoing(true); 
                setIsCallActive(true); 
              }}
              className={`p-1.5 rounded-md transition-all group relative ${isCallOngoing ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              <Phone className="w-4 h-4" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                {isCallOngoing ? "Call in progress" : "Start Audio Call"}
              </span>
            </button>
          </div>
        ) : isCallOngoing ? (
          // Member View: Call indicator
          <div className="text-xs font-medium text-slate-500 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
            <span className="text-emerald-400 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Call Active</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
