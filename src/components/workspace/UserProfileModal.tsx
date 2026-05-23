"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Shield, ShieldAlert, Settings, Bell, Lock, Globe, Trash2, Camera, Loader2, Edit3, Save, LogOut, Clock, ShieldCheck, Sparkles, Eye, EyeOff, Check } from 'lucide-react';
import { UserService } from '@/lib/services/user.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  workspaceId: string;
}

export default function UserProfileModal({ isOpen, onClose, userId, workspaceId }: Props) {
  const currentUser = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const logout = useAuthStore(s => s.logout);
  const isOwn = !userId || userId === currentUser?.id;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState('member');
  const [tab, setTab] = useState<'profile' | 'settings' | 'security'>('profile');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editData, setEditData] = useState({ name: '', username: '', bio: '', timezone: 'UTC' });
  const [pwData, setPwData] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [notifs, setNotifs] = useState({ email: true, inApp: true });

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setTab('profile');
      setEditing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, userId, workspaceId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const uid = isOwn ? currentUser!.id : userId!;
      const [p, r] = await Promise.all([
        isOwn ? UserService.getProfile() : UserService.getPublicProfile(uid),
        UserService.getMemberRole(workspaceId, uid),
      ]);
      setProfile(p);
      setRole(r);
      if (isOwn) {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setEditData({ 
          name: p.name || '', 
          username: p.username || '', 
          bio: p.bio || '', 
          timezone: p.timezone || browserTz || 'UTC' 
        });
        setNotifs(p.notificationPreferences || { email: true, inApp: true });
      }
    } catch {
      toast.error('Failed to load profile');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: tz
      }).format(new Date());
    } catch {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(new Date());
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return; }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/messages/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Backend returns: { data: { attachment: { url, name, fileType, publicId } } }
      const url = res.data?.data?.attachment?.url 
                || res.data?.data?.url 
                || res.data?.attachment?.url 
                || res.data?.url;

      if (!url) throw new Error('No URL returned');

      const updated = await UserService.updateProfile({ avatar: url });
      setProfile(updated);
      setUser(updated);
      toast.success('Avatar updated!');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await UserService.updateProfile(editData);
      setProfile(updated);
      setUser(updated);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwData.next !== pwData.confirm) { toast.error('Passwords do not match'); return; }
    if (pwData.next.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await UserService.changePassword({ currentPassword: pwData.current, newPassword: pwData.next });
      toast.success('Password changed successfully!');
      setPwData({ current: '', next: '', confirm: '' });
      setTab('profile'); // Switch back to profile overview
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const toggleNotif = async (key: 'email' | 'inApp') => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    try { await UserService.updateNotifications(updated); }
    catch { setNotifs(notifs); toast.error('Failed to update'); }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete your account? This cannot be undone.')) return;
    try {
      await UserService.deleteAccount();
      toast.success('Account deleted');
      logout(); onClose();
    } catch (err: any) { toast.error(err?.message || 'Failed to delete account'); }
  };

  const changeRole = async (r: string) => {
    try {
      await UserService.updateMemberRole(workspaceId, userId!, r);
      setRole(r); toast.success(`Role updated to ${r}`);
    } catch (err: any) { toast.error(err?.message || 'Failed to update role'); }
  };

  const roleBadge = (r: string) => {
    if (r === 'owner') return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
    if (r === 'admin') return 'bg-purple-400/10 text-purple-400 border-purple-400/20';
    return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
  };
  const roleIcon = (r: string) => {
    if (r === 'owner') return <ShieldAlert className="w-3.5 h-3.5" />;
    if (r === 'admin') return <ShieldCheck className="w-3.5 h-3.5" />;
    return <User className="w-3.5 h-3.5" />;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0d0d0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto md:h-[600px]">

          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Sidebar */}
          <div className="w-full md:w-56 bg-white/[0.03] border-b md:border-b-0 md:border-r border-white/[0.07] p-5 flex flex-row md:flex-col gap-2">
            <div className="hidden md:flex items-center gap-3 px-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">Profile</span>
            </div>

            {[
              { id: 'profile', label: 'Overview', icon: User },
              ...(isOwn ? [
                { id: 'settings', label: 'Preferences', icon: Settings },
                { id: 'security', label: 'Security', icon: Lock },
              ] : []),
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id as any)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}

            {isOwn && (
              <button onClick={logout}
                className="md:mt-auto flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
              <h2 className="text-lg font-bold text-white capitalize">{tab}</h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-gray-500 text-sm">Loading profile...</p>
                </div>
              ) : !profile ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Profile not found</p>
                </div>
              ) : (
                <>
                  {/* PROFILE TAB */}
                  {tab === 'profile' && (
                    <div className="space-y-6">
                      {/* Avatar + Info */}
                      <div className="flex items-start gap-5">
                        <div className="relative shrink-0 group">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5">
                            <div className="w-full h-full rounded-[14px] bg-black overflow-hidden">
                              {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                                  {profile.name?.[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          {isOwn && (
                            <>
                              <button onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white shadow-lg transition-all disabled:opacity-50">
                                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                              </button>
                              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                            </>
                          )}
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0d0d0f] ${profile.status === 'online' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${roleBadge(role)}`}>
                              {roleIcon(role)} {role}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm">@{profile.username}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                            {profile.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{profile.email}</span>}
                            <span className="flex items-center gap-1" title={profile.timezone || 'UTC'}>
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(profile.timezone || 'UTC')} ({profile.timezone || 'UTC'})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio / Edit */}
                      <div className="bg-white/[0.04] rounded-2xl p-5 border border-white/[0.07]">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                            <Edit3 className="w-4 h-4 text-indigo-400" /> About
                          </h4>
                          {isOwn && (
                            <button onClick={() => setEditing(!editing)}
                              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                              {editing ? 'Cancel' : 'Edit Profile'}
                            </button>
                          )}
                        </div>

                        {editing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { label: 'Display Name', key: 'name', placeholder: 'Your name' },
                                { label: 'Username', key: 'username', placeholder: 'username' },
                              ].map(({ label, key, placeholder }) => (
                                <div key={key} className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">{label}</label>
                                  <input value={(editData as any)[key]}
                                    onChange={e => setEditData({ ...editData, [key]: e.target.value })}
                                    placeholder={placeholder}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all" />
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase">Bio</label>
                              <textarea value={editData.bio}
                                onChange={e => setEditData({ ...editData, bio: e.target.value })}
                                rows={3} maxLength={300}
                                placeholder="Tell people about yourself..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all resize-none" />
                              <p className="text-[10px] text-gray-600 text-right">{editData.bio.length}/300</p>
                            </div>
                            <button onClick={saveProfile} disabled={saving}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Save Changes
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 leading-relaxed">
                            {profile.bio || <span className="italic text-gray-600">No bio set.</span>}
                          </p>
                        )}
                      </div>

                      {/* Role Management for admins viewing others */}
                      {!isOwn && (currentUser?.workspaces?.some((w: any) => w.workspaceId === workspaceId && (w.role === 'admin' || w.role === 'owner'))) && (
                        <div className="bg-white/[0.04] rounded-2xl p-5 border border-white/[0.07]">
                          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-purple-400" /> Manage Role
                          </h4>
                          <div className="flex gap-2">
                            {['member', 'admin'].map(r => (
                              <button key={r} onClick={() => changeRole(r)}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${role === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SETTINGS TAB */}
                  {tab === 'settings' && (
                    <div className="space-y-5">
                      {/* Timezone */}
                      <div className="bg-white/[0.04] rounded-2xl p-5 border border-white/[0.07]">
                        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4">
                          <Globe className="w-4 h-4 text-blue-400" /> Localization
                        </h4>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Timezone</label>
                          <select value={editData.timezone}
                            onChange={async e => {
                              const tz = e.target.value;
                              setEditData(d => ({ ...d, timezone: tz }));
                              try {
                                await UserService.updateProfile({ timezone: tz });
                                toast.success('Timezone updated');
                              } catch { toast.error('Failed to update timezone'); }
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all appearance-none">
                            {[
                              ['UTC', 'UTC (GMT+0)'], ['Asia/Kolkata', 'Asia/Kolkata (GMT+5:30)'],
                              ['Asia/Dubai', 'Asia/Dubai (GMT+4)'], ['Europe/London', 'Europe/London (GMT+0)'],
                              ['America/New_York', 'America/New_York (GMT-5)'], ['America/Los_Angeles', 'America/Los_Angeles (GMT-8)'],
                              ['Asia/Tokyo', 'Asia/Tokyo (GMT+9)'], ['Australia/Sydney', 'Australia/Sydney (GMT+10)'],
                            ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Notifications */}
                      <div className="bg-white/[0.04] rounded-2xl p-5 border border-white/[0.07]">
                        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4">
                          <Bell className="w-4 h-4 text-amber-400" /> Notifications
                        </h4>
                        {[
                          { key: 'email' as const, label: 'Email Notifications', desc: 'Receive updates via email' },
                          { key: 'inApp' as const, label: 'In-App Notifications', desc: 'Desktop & push alerts' },
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                            <div>
                              <p className="text-sm font-semibold text-white">{label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                            </div>
                            <button onClick={() => toggleNotif(key)}
                              className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 ${notifs[key] ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full transition-all duration-300 shadow ${notifs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECURITY TAB */}
                  {tab === 'security' && (
                    <div className="space-y-5">
                      <div className="bg-white/[0.04] rounded-2xl p-5 border border-white/[0.07]">
                        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-5">
                          <Lock className="w-4 h-4 text-indigo-400" /> Change Password
                        </h4>
                        <div className="space-y-3">
                          {[
                            { key: 'current' as const, label: 'Current Password' },
                            { key: 'next' as const, label: 'New Password' },
                            { key: 'confirm' as const, label: 'Confirm New Password' },
                          ].map(({ key, label }) => (
                            <div key={key} className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase">{label}</label>
                              <div className="relative">
                                <input
                                  type={showPw[key] ? 'text' : 'password'}
                                  value={pwData[key]}
                                  onChange={e => setPwData(d => ({ ...d, [key]: e.target.value }))}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all" />
                                <button type="button"
                                  onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                                  {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          ))}
                          {pwData.next && pwData.confirm && (
                            <p className={`text-xs flex items-center gap-1 ${pwData.next === pwData.confirm ? 'text-emerald-400' : 'text-red-400'}`}>
                              {pwData.next === pwData.confirm ? <Check className="w-3 h-3" /> : '✗'} 
                              {pwData.next === pwData.confirm ? 'Passwords match' : 'Passwords do not match'}
                            </p>
                          )}
                          <button onClick={changePassword}
                            disabled={saving || !pwData.current || !pwData.next || !pwData.confirm || pwData.next !== pwData.confirm}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            Update Password
                          </button>
                        </div>
                      </div>

                      <div className="bg-red-500/5 rounded-2xl p-5 border border-red-500/10">
                        <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-2">
                          <Trash2 className="w-4 h-4" /> Danger Zone
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">Once deleted, your account cannot be recovered.</p>
                        <button onClick={deleteAccount}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 transition-all">
                          Permanently Delete Account
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
