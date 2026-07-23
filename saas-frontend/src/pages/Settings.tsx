import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import { toast } from 'react-hot-toast'

export default function Settings() {
  const { user, updateSettings, logout } = useStore()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    twoFactorEnabled: false,
    darkMode: false,
    language: 'ar',
  })
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      setSettings({
        emailNotifications: user.emailNotifications ?? true,
        pushNotifications: user.pushNotifications ?? false,
        twoFactorEnabled: user.twoFactorEnabled ?? false,
        darkMode: user.darkMode ?? false,
        language: user.language ?? 'ar',
      })
    }
  }, [user])

  const handleToggle = async (key: keyof typeof settings) => {
    const newValue = !settings[key]
    setSettings(prev => ({ ...prev, [key]: newValue }))
    try {
      await updateSettings({ [key]: newValue })
      toast.success('تم تحديث الإعدادات')
    } catch {
      setSettings(prev => ({ ...prev, [key]: !newValue }))
      toast.error('حدث خطأ أثناء التحديث')
    }
  }

  const handleLanguageChange = async (lang: string) => {
    setSettings(prev => ({ ...prev, language: lang }))
    try {
      await updateSettings({ language: lang })
      toast.success('تم تغيير اللغة')
    } catch {
      toast.error('حدث خطأ أثناء التغيير')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }
    setSaving(true)
    try {
      await fetch('/api/v1/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      toast.success('تم تغيير كلمة المرور بنجاح')
      setShowPasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-[28px] font-bold text-[#1E293B]">الإعدادات</h1>
        <p className="text-[#64748B] text-sm mt-1">إدارة حسابك وتفضيلاتك</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
        <h2 className="font-semibold text-[#1E293B] mb-4">الملف الشخصي</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-[#00D4AA] text-[#1E3A5F] rounded-full flex items-center justify-center text-xl font-bold">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-[#1E293B]">{user?.fullName || user?.username || 'المستخدم'}</p>
            <p className="text-sm text-[#64748B]">{user?.email || ''}</p>
            <p className="text-xs text-[#00D4AA] mt-1">الدور: {user?.role === 'admin' ? 'مدير' : user?.role === 'super_admin' ? 'مدير عام' : 'مستخدم'}</p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
        <h2 className="font-semibold text-[#1E293B] mb-4">الأمان</h2>
        <div className="space-y-4">
          {/* 2FA */}
          <div className="flex items-center justify-between py-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1E3A5F]/10 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#1E3A5F]">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm text-[#1E293B]">المصادقة الثنائية</p>
                <p className="text-xs text-[#64748B]">طبقة حماية إضافية لحسابك</p>
              </div>
            </div>
            <button onClick={() => handleToggle('twoFactorEnabled')} className={`relative w-12 h-6 rounded-full transition-colors ${settings.twoFactorEnabled ? 'bg-[#00D4AA]' : 'bg-[#E2E8F0]'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.twoFactorEnabled ? 'right-7' : 'right-1'}`}></span>
            </button>
          </div>

          {/* Change Password */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F39C12]/10 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#F39C12]">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm text-[#1E293B]">تغيير كلمة المرور</p>
                <p className="text-xs text-[#64748B]">آخر تغيير: غير معروف</p>
              </div>
            </div>
            <button onClick={() => setShowPasswordModal(true)} className="px-4 py-2 bg-[#F1F5F9] text-[#1E3A5F] rounded-lg text-sm font-medium hover:bg-[#E2E8F0] transition-colors">
              تغيير
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
        <h2 className="font-semibold text-[#1E293B] mb-4">الإشعارات</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#27AE60]/10 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#27AE60]">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm text-[#1E293B]">إشعارات البريد الإلكتروني</p>
                <p className="text-xs text-[#64748B]">استلام إشعارات عبر البريد</p>
              </div>
            </div>
            <button onClick={() => handleToggle('emailNotifications')} className={`relative w-12 h-6 rounded-full transition-colors ${settings.emailNotifications ? 'bg-[#00D4AA]' : 'bg-[#E2E8F0]'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.emailNotifications ? 'right-7' : 'right-1'}`}></span>
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8E44AD]/10 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#8E44AD]">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm text-[#1E293B]">الإشعارات الفورية</p>
                <p className="text-xs text-[#64748B]">إشعارات مباشرة على الجهاز</p>
              </div>
            </div>
            <button onClick={() => handleToggle('pushNotifications')} className={`relative w-12 h-6 rounded-full transition-colors ${settings.pushNotifications ? 'bg-[#00D4AA]' : 'bg-[#E2E8F0]'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.pushNotifications ? 'right-7' : 'right-1'}`}></span>
            </button>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
        <h2 className="font-semibold text-[#1E293B] mb-4">اللغة</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: 'ar', name: 'العربية' },
            { code: 'en', name: 'English' },
            { code: 'ku', name: 'کوردی' },
            { code: 'tr', name: 'Türkçe' },
          ].map(({ code, name }) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                settings.language === code
                  ? 'bg-[#00D4AA] text-[#1E3A5F]'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="w-full py-3 bg-[#E74C3C]/10 text-[#E74C3C] border border-[#E74C3C]/20 rounded-xl font-semibold hover:bg-[#E74C3C]/20 transition-colors">
        تسجيل الخروج
      </button>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-center mb-6">تغيير كلمة المرور</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">كلمة المرور الحالية</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">كلمة المرور الجديدة</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">تأكيد كلمة المرور</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg font-medium hover:bg-[#E2E8F0] transition-colors">إلغاء</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-[#00D4AA] text-[#1E3A5F] rounded-lg font-semibold hover:bg-[#00B894] transition-colors disabled:opacity-50">
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
