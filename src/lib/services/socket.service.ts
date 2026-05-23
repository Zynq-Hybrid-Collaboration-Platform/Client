import { io, Socket } from "socket.io-client";

class SocketService {
  public socket: Socket | null = null;
  private activeChannelId: string | null = null;
  private activeWorkspaceId: string | null = null;

  // Central callback registry: event name → array of callbacks
  // ALL listeners are stored here so they survive reconnections.
  private registry: Map<string, ((data: any) => void)[]> = new Map();

  // 1. Connect to the server
  connect() {
    if (!this.socket) {
      // Resolve backend URL — NEXT_PUBLIC_BACKEND_URL must be set in production hosting env vars
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                         process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
                         "http://localhost:5000";

      let token = null;
      if (typeof window !== "undefined") {
        const storageStr = localStorage.getItem("synq-auth-storage");
        if (storageStr) {
          try {
            const parsed = JSON.parse(storageStr);
            token = parsed.state.accessToken;
          } catch (e) {}
        }
      }

      this.socket = io(backendUrl, {
        // Backend now supports polling + websocket (updated server.ts)
        // polling first allows fallback if websocket upgrade fails on load balancers
        transports: ["polling", "websocket"],
        withCredentials: true,
        autoConnect: true,
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on("connect", () => {
        console.log("✅ Socket connected with ID:", this.socket?.id);

        // CRITICAL: Re-register ALL stored event listeners after every connect/reconnect.
        // Without this, all listeners (messages, tasks, statuses) are lost when the
        // socket reconnects (e.g. Render backend wakes from sleep, network blip etc.)
        this.registry.forEach((callbacks, event) => {
          this.socket?.off(event);
          this.socket?.on(event, (data: any) => {
            this.registry.get(event)?.forEach(cb => cb(data));
          });
        });

        // Re-join active channel on reconnection
        if (this.activeChannelId) {
          this.socket?.emit("join-channel", this.activeChannelId);
          console.log(`🔄 Auto-rejoined channel: ${this.activeChannelId}`);
        }
        // Re-join active workspace room on reconnection
        // REQUIRED: status and task events now emit to workspace_${id} room
        if (this.activeWorkspaceId) {
          this.socket?.emit("join-workspace", this.activeWorkspaceId);
          console.log(`🔄 Auto-rejoined workspace: ${this.activeWorkspaceId}`);
        }
      });

      this.socket.on("connect_error", (err) => {
        console.error("❌ Socket connection error:", err.message);
      });
    }
    return this.socket;
  }

  // Internal: add a callback to the registry + attach to live socket if connected
  private addListener(event: string, callback: (data: any) => void) {
    if (!this.registry.has(event)) {
      this.registry.set(event, []);
    }
    const callbacks = this.registry.get(event)!;
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }

    // If socket is already connected, re-attach the socket listener immediately
    if (this.socket && this.socket.connected) {
      this.socket.off(event);
      this.socket.on(event, (data: any) => {
        this.registry.get(event)?.forEach(cb => cb(data));
      });
    }
    // If not connected yet, the connect handler above will register it when ready
  }

  // Internal: remove a callback from the registry
  private removeListener(event: string, callback: (data: any) => void) {
    const callbacks = this.registry.get(event);
    if (callbacks) {
      const filtered = callbacks.filter(cb => cb !== callback);
      this.registry.set(event, filtered);
      if (filtered.length === 0) {
        this.socket?.off(event);
        this.registry.delete(event);
      }
    }
  }

  // 2. Disconnect from the server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("❌ Socket disconnected");
    }
  }

  // 3. Join a specific channel
  joinChannel(channelId: string) {
    this.activeChannelId = channelId;
    if (this.socket) {
      this.socket.emit("join-channel", channelId);
      console.log(`🚪 Joined channel: ${channelId}`);
    }
  }

  // 3b. Join workspace room — required for status:created/updated/deleted
  // and task:created/updated/deleted (backend now emits to workspace_${id})
  joinWorkspace(workspaceId: string) {
    this.activeWorkspaceId = workspaceId;
    if (this.socket) {
      this.socket.emit("join-workspace", workspaceId);
      console.log(`🏢 Joined workspace: ${workspaceId}`);
    }
  }

  leaveWorkspace(workspaceId: string) {
    if (this.socket) {
      this.socket.emit("leave-workspace", workspaceId);
    }
    if (this.activeWorkspaceId === workspaceId) {
      this.activeWorkspaceId = null;
    }
  }

  // 4. Send a message
  sendMessage(channelId: string, content: string, type: string = "TEXT", attachments: any[] = [], replyTo?: string) {
    if (this.socket) {
      this.socket.emit("send-message", { channelId, content, type, attachments, replyTo });
    }
  }

  // 4a. Pin/Unpin Message
  pinMessage(channelId: string, messageId: string, isPinned: boolean) {
    if (this.socket) {
      this.socket.emit("pin-message", { channelId, messageId, isPinned });
    }
  }

  // 4b. React to Message
  reactMessage(channelId: string, messageId: string, emoji: string) {
    if (this.socket) {
      this.socket.emit("react-message", { channelId, messageId, emoji });
    }
  }

  // 4c. Delete Message
  deleteMessage(channelId: string, messageId: string) {
    if (this.socket) {
      this.socket.emit("delete-message", { channelId, messageId });
    }
  }

  // --- Message Events ---
  onNewMessage(callback: (message: any) => void) { this.addListener("new-message", callback); }
  offNewMessage(callback: (message: any) => void) { this.removeListener("new-message", callback); }

  onMessageEdited(callback: (message: any) => void) { this.addListener("message-edited", callback); }
  offMessageEdited(callback: (message: any) => void) { this.removeListener("message-edited", callback); }

  onMessageDeleted(callback: (data: { messageId: string }) => void) { this.addListener("message-deleted", callback); }
  offMessageDeleted(callback: (data: { messageId: string }) => void) { this.removeListener("message-deleted", callback); }

  onMessagePinned(callback: (message: any) => void) { this.addListener("message-pinned", callback); }
  offMessagePinned(callback: (message: any) => void) { this.removeListener("message-pinned", callback); }

  onMessageReaction(callback: (data: { messageId: string, reactions: any[] }) => void) { this.addListener("message-reaction", callback); }
  offMessageReaction(callback: (data: { messageId: string, reactions: any[] }) => void) { this.removeListener("message-reaction", callback); }

  onChannelCreated(callback: (channel: any) => void) { this.addListener("channel-created", callback); }

  // --- Task Events ---
  onTaskCreated(callback: (data: { task: any }) => void) { this.addListener("task:created", callback); }
  offTaskCreated(callback: (data: { task: any }) => void) { this.removeListener("task:created", callback); }

  onTaskUpdated(callback: (data: { task: any }) => void) { this.addListener("task:updated", callback); }
  offTaskUpdated(callback: (data: { task: any }) => void) { this.removeListener("task:updated", callback); }

  onTaskDeleted(callback: (data: { taskId: string, channelId: string }) => void) { this.addListener("task:deleted", callback); }
  offTaskDeleted(callback: (data: { taskId: string, channelId: string }) => void) { this.removeListener("task:deleted", callback); }

  // --- Status Events ---
  onStatusCreated(callback: (data: { status: any }) => void) { this.addListener("status:created", callback); }
  offStatusCreated(callback: (data: { status: any }) => void) { this.removeListener("status:created", callback); }

  onStatusUpdated(callback: (data: { status: any }) => void) { this.addListener("status:updated", callback); }
  offStatusUpdated(callback: (data: { status: any }) => void) { this.removeListener("status:updated", callback); }

  onStatusDeleted(callback: (data: { statusId: string, workspaceId: string }) => void) { this.addListener("status:deleted", callback); }
  offStatusDeleted(callback: (data: { statusId: string, workspaceId: string }) => void) { this.removeListener("status:deleted", callback); }

  // --- User & Profile Events ---
  onUserProfileUpdated(callback: (data: { userId: string, name: string, avatar: string, bio: string, username: string }) => void) {
    this.addListener("user:profile-updated", callback);
  }
  offUserProfileUpdated(callback: (data: { userId: string, name: string, avatar: string, bio: string, username: string }) => void) {
    this.removeListener("user:profile-updated", callback);
  }

  onUserStatusChanged(callback: (data: { userId: string, status: string }) => void) {
    this.addListener("user:status-changed", callback);
  }
  offUserStatusChanged(callback: (data: { userId: string, status: string }) => void) {
    this.removeListener("user:status-changed", callback);
  }

  onMemberRoleUpdated(callback: (data: { userId: string, role: string, workspaceId: string }) => void) {
    this.addListener("member:role-updated", callback);
  }
  offMemberRoleUpdated(callback: (data: { userId: string, role: string, workspaceId: string }) => void) {
    this.removeListener("member:role-updated", callback);
  }

  onMemberRemoved(callback: (data: { userId: string, workspaceId: string }) => void) {
    this.addListener("member:removed", callback);
  }
  offMemberRemoved(callback: (data: { userId: string, workspaceId: string }) => void) {
    this.removeListener("member:removed", callback);
  }

  // --- Notification Events ---
  onNewNotification(callback: (notification: any) => void) { this.addListener("new-notification", callback); }
  offNewNotification(callback: (notification: any) => void) { this.removeListener("new-notification", callback); }
}

// Export a single instance shared across the whole app
export const socketService = new SocketService();