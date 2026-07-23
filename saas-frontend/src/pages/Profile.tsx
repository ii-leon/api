import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import api from '../lib/api'
import { toast } from 'react-hot-toast'
import { User, Camera, Save, Loader2, Shield, Calendar, Mail, AtSign, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Profile() {
  const { user } = useStore()
  const { t } = useTranslation()
  const [form, setForm] = useState({ fullName: '', email: '', username: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({ fullName: user.fullName || '', email: user.email, username: user.username })
    }
  }, [user])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patch('/users/me', { fullName: form.fullName })
      toast.success(t('profile.profileUpdated'))
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('profile.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('profile.passwordMismatch'))
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error(t('profile.passwordMinLength'))
      return
    }
    setChangingPassword(true)
    try {
      await api.patch('/users/me/password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      toast.success(t('profile.passwordChanged'))
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('profile.passwordFailed'))
    } finally {
      setChangingPassword(false)
    }
  }

  const field = 'w-full px-4 py-3 bg-surface/50 rounded-xl border border-surface-lighter/50 text-white placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all'
  const disabledField = `${field} opacity-60 cursor-not-allowed bg-surface/30`

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-surface-light rounded-2xl border border-surface-lighter overflow-hidden">
        {/* Cover Gradient */}
        <div className="h-32 bg-gradient-to-br from-primary via-accent to-primary/50 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6TTMwIDMwdjJIMnYyaDI5ek0yNCAyNHYySDJ2MmgyM3oiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        </div>

        {/* Avatar & Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-primary p-0.5">
                <div className="w-full h-full rounded-2xl bg-surface-light flex items-center justify-center">
                  <span className="text-3xl font-bold bg-gradient-to-br from-accent to-primary bg-clip-text text-transparent">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg">
                <Camera size={14} />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-right sm:pb-1">
              <h1 className="text-xl font-bold text-white">{user?.fullName || user?.username}</h1>
              <p className="text-slate-400 text-sm">@{user?.username}</p>
            </div>

            {/* Stats */}
            <div className="flex gap-6 sm:pb-1">
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Shield size={12} className="text-accent" />
                  <span>{t('profile.role')}</span>
                </div>
                <span className="text-sm font-semibold text-white capitalize">{user?.role || 'user'}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Calendar size={12} className="text-accent" />
                  <span>{t('profile.joined')}</span>
                </div>
                <span className="text-sm font-semibold text-white">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-surface-light rounded-2xl border border-surface-lighter p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <User size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-white">{t('profile.personalInfo')}</h2>
            <p className="text-xs text-slate-400">{t('profile.personalInfoDesc')}</p>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <User size={14} className="text-slate-500" />
              {t('profile.fullName')}
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={field}
              placeholder={t('profile.fullNamePlaceholder')}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <Mail size={14} className="text-slate-500" />
              {t('profile.email')}
            </label>
            <input
              type="email"
              value={form.email}
              disabled
              className={disabledField}
            />
            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <Lock size={10} />
              {t('profile.emailCannotChange')}
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <AtSign size={14} className="text-slate-500" />
              {t('profile.username')}
            </label>
            <input
              type="text"
              value={form.username}
              disabled
              className={disabledField}
            />
            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <Lock size={10} />
              {t('profile.usernameCannotChange')}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-accent/20"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {t('profile.saveChanges')}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-surface-light rounded-2xl border border-surface-lighter p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Shield size={20} className="text-warning" />
          </div>
          <div>
            <h2 className="font-semibold text-white">{t('profile.changePassword')}</h2>
            <p className="text-xs text-slate-400">{t('profile.changePasswordDesc')}</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <Lock size={14} className="text-slate-500" />
              {t('profile.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={`${field} pr-12`}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <Lock size={14} className="text-slate-500" />
              {t('profile.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={`${field} pr-12`}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordForm.newPassword.length > 0 && (
              <div className="flex items-center gap-4 mt-2">
                {[
                  { check: passwordForm.newPassword.length >= 8, label: '8+' },
                  { check: /[A-Z]/.test(passwordForm.newPassword), label: 'A-Z' },
                  { check: /[a-z]/.test(passwordForm.newPassword), label: 'a-z' },
                  { check: /\d/.test(passwordForm.newPassword), label: '0-9' },
                ].map(({ check, label }) => (
                  <span key={label} className={`text-xs px-2 py-0.5 rounded-md ${check ? 'bg-success/20 text-success' : 'bg-surface text-slate-500'}`}>
                    {check && <CheckCircle size={10} className="inline mr-1" />}
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <Lock size={14} className="text-slate-500" />
              {t('profile.confirmPassword')}
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className={field}
              required
              minLength={8}
            />
            {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
              <p className="flex items-center gap-1.5 text-xs text-success mt-2">
                <CheckCircle size={12} />
                {t('profile.passwordsMatch')}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
              className="px-6 py-3 bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-warning/20"
            >
              {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              {t('profile.changePassword')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
