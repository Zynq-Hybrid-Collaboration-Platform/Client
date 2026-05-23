"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Hash, Mic, Video, Music, User, CheckSquare, X, CornerDownLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface WorkspaceSearchBarProps {
  workspaceId: string | null | undefined;
  channels: any[];
}

export function WorkspaceSearchBar({ workspaceId, channels }: WorkspaceSearchBarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Results states
  const [membersResults, setMembersResults] = useState<any[]>([]);
  const [channelsResults, setChannelsResults] = useState<any[]>([]);
  const [tasksResults, setTasksResults] = useState<any[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Debounce the search query locally
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // 2. Fetch all workspace tasks once when search bar is focused, to enable instant search
  const loadWorkspaceTasks = async () => {
    if (!workspaceId || workspaceId === 'join' || workspaceId === 'setup' || tasksLoaded) return;
    try {
      const response = await api.get(`/tasks/workspace/${workspaceId}`);
      if (response.data?.success && response.data?.data?.tasks) {
        setAllTasks(response.data.data.tasks);
        setTasksLoaded(true);
      }
    } catch (err) {
      console.warn("Could not load tasks for searching", err);
    }
  };

  // 3. Close search on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Keyboard Listener for Shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 5. Execute Search logic when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setMembersResults([]);
      setChannelsResults([]);
      setTasksResults([]);
      setIsSearching(false);
      setSelectedIndex(0);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      const cleanQuery = debouncedQuery.toLowerCase().trim();

      // Search A: Local Channels Filter
      const matchedChannels = channels.filter(c => 
        c.name.toLowerCase().includes(cleanQuery)
      );
      setChannelsResults(matchedChannels);

      // Search B: Local Tasks Filter (using tasks loaded on focus)
      const matchedTasks = allTasks.filter(t => 
        t.title.toLowerCase().includes(cleanQuery) || 
        (t.description && t.description.toLowerCase().includes(cleanQuery))
      );
      setTasksResults(matchedTasks);

      // Search C: Server-side Members Fetch
      if (workspaceId && workspaceId !== 'join' && workspaceId !== 'setup') {
        try {
          const res = await api.get(`/workspaces/${workspaceId}/members`, {
            params: { search: debouncedQuery, limit: 10 }
          });
          if (res.data?.success && res.data?.data?.members) {
            setMembersResults(res.data.data.members);
          } else {
            setMembersResults([]);
          }
        } catch (err) {
          console.error("Failed to query members from server", err);
          setMembersResults([]);
        }
      }

      setIsSearching(false);
      setSelectedIndex(0);
    };

    performSearch();
  }, [debouncedQuery, channels, allTasks, workspaceId]);

  // 6. Combine all lists for flat array navigation
  const flatResults = [
    ...channelsResults.map(item => ({ type: 'channel', data: item })),
    ...tasksResults.map(item => ({ type: 'task', data: item })),
    ...membersResults.map(item => ({ type: 'member', data: item }))
  ];

  // 7. Navigation handlers
  const handleSelectResult = (result: { type: string; data: any }) => {
    setIsOpen(false);
    setQuery('');
    
    if (result.type === 'channel') {
      router.push(`/workspace/${workspaceId}/channel/${result.data._id || result.data.id}`);
    } else if (result.type === 'member') {
      // Fire custom event to open the user profile modal natively
      const userId = result.data._id || result.data.id || result.data.userId;
      window.dispatchEvent(new CustomEvent('open-user-profile', { detail: { userId } }));
    } else if (result.type === 'task') {
      // Navigate to the channel where this task belongs
      if (result.data.channelId) {
        // Direct to tasks tab
        sessionStorage.setItem(`activeTab_${result.data.channelId}`, 'tasks');
        router.push(`/workspace/${workspaceId}/channel/${result.data.channelId}`);
        toast.info(`Opened task: "${result.data.title}"`);
      } else {
        toast.error("Channel details missing for this task");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, flatResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % Math.max(1, flatResults.length));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelectResult(flatResults[selectedIndex]);
      }
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-[140px] sm:max-w-[200px] lg:max-w-[300px]">
      {/* Outer Input Bar */}
      <div 
        className={`flex items-center bg-black/60 backdrop-blur-xl border rounded-full px-3 py-1.5 focus-within:border-indigo-500/50 focus-within:bg-[#111] focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-inner group ${
          isOpen ? 'border-indigo-500/50 bg-[#111] ring-1 ring-indigo-500/50' : 'border-white/5'
        }`}
      >
        <Search className="h-4 w-4 text-slate-500 mr-2 group-focus-within:text-indigo-400 transition-colors shrink-0" />
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Search... (Cmd+K)" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            loadWorkspaceTasks();
          }}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-sm text-slate-200 w-full placeholder:text-slate-600"
        />
        {query && (
          <button 
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }} 
            className="p-0.5 hover:bg-white/10 rounded-full text-slate-500 hover:text-slate-200 transition-all ml-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full mt-2 left-0 right-0 lg:-left-24 lg:-right-24 min-w-[280px] max-w-[480px] bg-[#0c0c0e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[420px]"
          >
            {/* Shortcut hints */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5 text-[10px] text-slate-500 select-none">
              <span>Navigate with <kbd className="bg-white/5 px-1 py-0.5 rounded text-slate-400">↑</kbd> <kbd className="bg-white/5 px-1 py-0.5 rounded text-slate-400">↓</kbd></span>
              <span>Open with <kbd className="bg-white/5 px-1 py-0.5 rounded text-slate-400">Enter</kbd></span>
            </div>

            {/* Results body */}
            <div className="flex-1 overflow-y-auto p-2 no-scrollbar space-y-3">
              {isSearching && (
                <div className="flex items-center justify-center p-8 gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Searching workspace...</span>
                </div>
              )}

              {!isSearching && !query.trim() && (
                <div className="p-4 text-center text-xs text-slate-500 space-y-1">
                  <p className="font-medium text-slate-400">Search Workspace</p>
                  <p>Type to search Channels, Tasks, or Members</p>
                </div>
              )}

              {!isSearching && query.trim() && flatResults.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  <p>No results found for &ldquo;{query}&rdquo;</p>
                </div>
              )}

              {!isSearching && flatResults.length > 0 && (
                <div className="space-y-3">
                  {/* CATEGORY: CHANNELS */}
                  {channelsResults.length > 0 && (
                    <div>
                      <h4 className="px-3 py-1 text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest">
                        Channels ({channelsResults.length})
                      </h4>
                      <div className="mt-1 space-y-0.5">
                        {channelsResults.map((chan, idx) => {
                          const flatIdx = flatResults.findIndex(r => r.type === 'channel' && r.data._id === chan._id);
                          const isSelected = flatIdx === selectedIndex;
                          const ChannelIcon = chan.type === 'VOICE' ? Mic :
                                              chan.type === 'VIDEO' ? Video :
                                              chan.type === 'AUDIO' ? Music : Hash;
                          return (
                            <button
                              key={chan._id || chan.id}
                              onClick={() => handleSelectResult({ type: 'channel', data: chan })}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                                isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <ChannelIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                <span className="text-xs font-semibold truncate">{chan.name}</span>
                              </div>
                              {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-white/70" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CATEGORY: TASKS */}
                  {tasksResults.length > 0 && (
                    <div>
                      <h4 className="px-3 py-1 text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest">
                        Tasks ({tasksResults.length})
                      </h4>
                      <div className="mt-1 space-y-0.5">
                        {tasksResults.map((task, idx) => {
                          const flatIdx = flatResults.findIndex(r => r.type === 'task' && r.data._id === task._id);
                          const isSelected = flatIdx === selectedIndex;
                          return (
                            <button
                              key={task._id || task.id}
                              onClick={() => handleSelectResult({ type: 'task', data: task })}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                                isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <CheckSquare className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold truncate">{task.title}</p>
                                  <p className={`text-[10px] truncate ${isSelected ? 'text-white/60' : 'text-slate-500'}`}>
                                    {task.description || "No description"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  task.statusId === 'todo' ? 'bg-slate-800 text-slate-400' :
                                  task.statusId === 'done' ? 'bg-emerald-500/10 text-emerald-400' :
                                  'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {task.statusId || "Task"}
                                </span>
                                {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-white/70" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CATEGORY: MEMBERS */}
                  {membersResults.length > 0 && (
                    <div>
                      <h4 className="px-3 py-1 text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">
                        Members ({membersResults.length})
                      </h4>
                      <div className="mt-1 space-y-0.5">
                        {membersResults.map((user, idx) => {
                          const flatIdx = flatResults.findIndex(r => r.type === 'member' && r.data._id === user._id);
                          const isSelected = flatIdx === selectedIndex;
                          return (
                            <button
                              key={user._id || user.id}
                              onClick={() => handleSelectResult({ type: 'member', data: user })}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                                isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                    <User className="w-3 h-3 text-slate-400" />
                                  </div>
                                )}
                                <div className="truncate">
                                  <p className="text-xs font-semibold truncate">{user.name}</p>
                                  <p className={`text-[10px] truncate ${isSelected ? 'text-white/60' : 'text-slate-500'}`}>{user.email}</p>
                                </div>
                              </div>
                              {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-white/70" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
