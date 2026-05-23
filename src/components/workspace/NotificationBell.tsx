"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/notificationStore';
import { socketService } from '@/lib/services/socket.service';
import { INotification, NotificationType } from '@/types/notification.types';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const { 
        notifications, 
        unreadCount, 
        fetchNotifications, 
        addNotification, 
        markAsRead, 
        markAllAsRead,
        isLoading
    } = useNotificationStore();

    useEffect(() => {
        // Initial fetch
        fetchNotifications(1, 20);

        // Socket listener
        const handleNewNotification = (notification: INotification) => {
            addNotification(notification);
            toast.message(notification.title, {
                description: notification.message,
                icon: <Bell className="w-4 h-4 text-indigo-400" />
            });
        };

        socketService.onNewNotification(handleNewNotification);

        return () => {
            socketService.offNewNotification(handleNewNotification);
        };
    }, []);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleNotificationClick = (notification: INotification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        setIsOpen(false);

        const { type, metadata } = notification;
        const workspaceId = metadata?.workspaceId;

        // Skip redirection if no workspace context or if it's a deletion message
        if (!workspaceId || notification.message.toLowerCase().includes('deleted') || notification.message.toLowerCase().includes('removed')) {
            return;
        }

        switch (type) {
            case NotificationType.TASK:
                router.push(`/workspace/${workspaceId}/kanban`);
                break;
            case NotificationType.MESSAGE:
            case NotificationType.MENTION:
            case NotificationType.CHANNEL:
                if (metadata?.channelId) {
                    router.push(`/workspace/${workspaceId}/chat/${metadata.channelId}`);
                } else {
                    router.push(`/workspace/${workspaceId}/chat`);
                }
                break;
            case NotificationType.WORKSPACE:
                router.push(`/workspace/${workspaceId}`);
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative flex items-center" ref={dropdownRef}>
            {/* Bell Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
                    isOpen 
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                        : 'bg-slate-900/80 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
            >
                <Bell className="h-4 w-4" />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.9)]"
                        >
                            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full mt-3 -right-16 sm:right-0 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] bg-[#0c0f24]/95 backdrop-blur-2xl border border-indigo-500/20 shadow-[0_10px_50px_-10px_rgba(0,0,0,0.8),0_0_20px_-5px_rgba(99,102,241,0.3)] rounded-2xl z-[100] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#14193b]/50">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 group"
                                >
                                    <Check className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col p-2 gap-1 relative">
                            {isLoading && notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                    <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                                    <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Loading...</p>
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <div 
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`relative flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                                            !notification.isRead 
                                                ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20' 
                                                : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        {!notification.isRead && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                        )}
                                        
                                        <div className="shrink-0 mt-0.5 relative">
                                            {notification.senderId?.avatar ? (
                                                <img src={notification.senderId.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-md" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/20">
                                                    {notification.senderId?.name ? notification.senderId.name.charAt(0).toUpperCase() : "S"}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#14193b] rounded-full flex items-center justify-center border border-white/10 shadow-sm">
                                                {/* Icon based on type could go here. Defaulting to Bell for now */}
                                                <Bell className="w-2.5 h-2.5 text-indigo-400" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col flex-1 min-w-0 pr-2">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <span className={`text-sm font-bold truncate ${!notification.isRead ? 'text-white' : 'text-slate-300'}`}>
                                                    {notification.title}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap pt-0.5">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }).replace('about ', '')}
                                                </span>
                                            </div>
                                            <p className={`text-xs leading-relaxed line-clamp-2 ${!notification.isRead ? 'text-indigo-100/80' : 'text-slate-400'}`}>
                                                <span className="font-semibold text-white mr-1">{notification.senderId?.name}</span>
                                                {notification.message.replace(`${notification.senderId?.name} `, '')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                                        <Bell className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-1">All caught up</h4>
                                    <p className="text-xs text-slate-400">You don't have any new notifications at the moment.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
