"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { webrtcService } from "@/lib/services/webrtc.service";
import VideoPlayer from "./VideoPlayer";
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertCircle, MonitorUp, MonitorOff } from "lucide-react";
import { CallRoomProps } from "@/types/call.types";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";


export default function CallRoom({ channelId, isAudioOnly, channel, workspaceMembers, isExpanded, onClose, isHidden }: CallRoomProps & { isExpanded?: boolean; isHidden?: boolean }) {
  const user = useAuthStore((state) => state.user);
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const isPrivileged = (channel?.organizationId && user?.organizations?.some(org => String(org.orgId) === String(channel.organizationId) && (org.role === 'admin' || org.role === 'owner'))) ||
    user?.workspaces?.some((w: any) => (w.workspaceId === workspaceId || w._id === workspaceId) && (w.role === 'admin' || w.role === 'owner'));

  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  // Persistent media state
  const [isVideoOn, setIsVideoOn] = useState(() => {
    const saved = sessionStorage.getItem(`call_video_${channelId}`);
    return saved !== null ? saved === 'true' : !isAudioOnly;
  });
  const [isMicOn, setIsMicOn] = useState(() => {
    const saved = sessionStorage.getItem(`call_mic_${channelId}`);
    return saved !== null ? saved === 'true' : true;
  });

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [participants, setParticipants] = useState<any>(new Map());
  const [connectionStates, setConnectionStates] = useState<Map<string, RTCPeerConnectionState>>(new Map());

  useEffect(() => {
    // Sync local state if isAudioOnly prop changes (e.g. late sync)
    setIsVideoOn(!isAudioOnly);
  }, [isAudioOnly]);

  const [wasVideoOnBeforeHide, setWasVideoOnBeforeHide] = useState(false);

  useEffect(() => {
    if (isHidden) {
      setWasVideoOnBeforeHide(isVideoOn);
      if (isVideoOn) {
        webrtcService.toggleMedia('video', false);
        setIsVideoOn(false);
      }
    } else if (isHidden === false) {
      if (wasVideoOnBeforeHide) {
        webrtcService.toggleMedia('video', true);
        setIsVideoOn(true);
      }
    }
  }, [isHidden]);

  useEffect(() => {
    let mounted = true;

    const initializeCall = async () => {
      try {
        // 1. Prepare room ID in service for potential early toggles
        webrtcService.currentRoomId = channelId;

        // 2. Ask for Camera/Mic permissions
        // Use the PERSISTENT states for initialization
        const stream = await webrtcService.startLocalMedia(true, true, { 
          startVideoMuted: !isVideoOn,
          startAudioMuted: !isMicOn 
        });
        
        // Safety check: if user left the page during permission request, cleanup
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        setLocalStream(stream);

        // 3. NOW Join the signaling room (Once localStream is ready for others to see)
        webrtcService.joinCall(channelId);
        setHasJoined(true);
      } catch (err) {
        console.error("Camera permissions denied or failed", err);
        if (mounted) {
          setError("Camera or microphone access was denied. Please allow permissions in your browser settings to join.");
        }
      }
    };

    initializeCall();

    // 3. Listen for people arriving
    webrtcService.onRemoteStreamAdd = (socketId, stream) => {
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.set(socketId, stream);
        return newMap;
      });
    };

    // 4. Listen for people leaving
    webrtcService.onRemoteStreamRemove = (socketId) => {
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.delete(socketId);
        return newMap;
      });
    };

    // 5. If forced close signal from owner
    webrtcService.onCallForcedEnd = () => {
      onClose?.();
    };

    // 6. Listen for Participant Metadata (User ID + Media State changes)
    webrtcService.onParticipantMetadataUpdate = (newParticipants) => {
      if (mounted) {
        setParticipants(new Map(newParticipants)); // Force new Map reference to trigger names sync
      }
    };

    // 7. Listen for Connection State Changes
    webrtcService.onConnectionStateChange = (socketId, state) => {
      if (mounted) {
        setConnectionStates((prev) => {
          const newMap = new Map(prev);
          newMap.set(socketId, state);
          return newMap;
        });
      }
    };

    // 8. Listen for Errors
    webrtcService.onError = (message) => {
      toast.error("Call Error", {
        description: message,
        icon: <AlertCircle className="w-4 h-4 text-red-500" />
      });
      if (message.includes("full")) {
        onClose?.();
      }
    };

    // 9. Cleanup when unmounting (leaving the page)
    return () => {
      mounted = false;
      webrtcService.onCallForcedEnd = null;
      webrtcService.onParticipantMetadataUpdate = null;
      webrtcService.onConnectionStateChange = null;
      webrtcService.onError = null;
      webrtcService.leaveCall();
      setLocalStream(null);
      setRemoteStreams(new Map());
    };
  }, [channelId]);

  // --- Handlers ---
  
  const toggleVideo = () => {
    const newState = !isVideoOn;
    webrtcService.toggleMedia('video', newState);
    setIsVideoOn(newState);
    sessionStorage.setItem(`call_video_${channelId}`, String(newState));
  };

  const toggleMic = () => {
    const newState = !isMicOn;
    webrtcService.toggleMedia('audio', newState);
    setIsMicOn(newState);
    sessionStorage.setItem(`call_mic_${channelId}`, String(newState));
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      webrtcService.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      const stream = await webrtcService.startScreenShare();
      if (stream) {
        setIsScreenSharing(true);
        // Keep state synced if user stops sharing via browser's native completely native popup stop button
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          webrtcService.stopScreenShare();
          setIsScreenSharing(false);
        });
      }
    }
  };

  const handleLeaveCall = () => {
    if (isPrivileged) {
      webrtcService.forceEndCallGlobally();
    } else {
      webrtcService.leaveCall();
    }
    onClose?.();
  };

  // --- Render States ---

  // State 1: Permission Denied Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0a] text-white p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 text-red-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold mb-2 tracking-tight">Permission Denied</h3>
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-white text-black font-medium px-6 py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // State 2: Waiting for Permissions
  if (!hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0a] text-white">
        <div className="w-10 h-10 border-[3px] border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Requesting camera access...</p>
      </div>
    );
  }

  // State 3: Active Call UI
  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] p-4 relative overflow-hidden">
      
      {/* 📹 The Video Grid */}
      <div className={`flex-1 grid gap-4 auto-rows-max max-h-[calc(100%-80px)] overflow-y-auto custom-scrollbar content-center px-4 
        ${isExpanded 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' 
          : 'grid-cols-1'}`}>
        {/* Local User */}
        {localStream && (
          <VideoPlayer stream={localStream} isLocal={true} currentUser={user} isVideoOff={!isVideoOn} />
        )}

        {/* Remote Users */}
        {Array.from(remoteStreams.entries()).map(([socketId, stream]) => {
           const pInfo = participants.get(socketId);
           return (
             <VideoPlayer 
               key={socketId} 
               stream={stream} 
               isLocal={false} 
               participant={pInfo} 
               channel={channel} 
               workspaceMembers={workspaceMembers}
               isVideoOff={pInfo ? !pInfo.cameraEnabled : false} 
               connectionState={connectionStates.get(socketId)}
             />
           );
        })}
      </div>

      {/* 🎛️ Control Bar (Sits at the bottom) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#111]/90 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50">
        
        {/* Mic Toggle */}
        <button 
          onClick={toggleMic}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          className={`p-3.5 rounded-xl transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button 
          onClick={toggleVideo}
          title={isVideoOn ? "Turn off Camera" : "Turn on Camera"}
          className={`p-3.5 rounded-xl transition-all ${isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share Toggle */}
        <button 
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
          className={`p-3.5 rounded-xl transition-all ${isScreenSharing ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
        </button>

        <div className="w-px h-8 bg-white/10 mx-2" />
        
        {/* Disconnect */}
        <button 
          onClick={handleLeaveCall}
          title="Leave Call"
          className="p-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-900/40 active:scale-95"
        >
          <PhoneOff className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
}