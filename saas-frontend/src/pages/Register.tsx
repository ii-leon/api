import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import api from '../lib/api'
import { toast } from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', password: '', fullName: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const register = useStore((s) => s.register)
  const navigate = useNavigate()

  useEffect(() => {
    if (!form.email || form.email.length < 5) { setEmailAvailable(null); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setEmailAvailable(null); return }
    setCheckingEmail(true)
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/check-email?email=${encodeURIComponent(form.email)}`)
        setEmailAvailable(data.available)
      } catch { setEmailAvailable(null) } finally { setCheckingEmail(false) }
    }, 500)
    return () => clearTimeout(timer)
  }, [form.email])

  useEffect(() => {
    if (!form.username || form.username.length < 3) { setUsernameAvailable(null); return }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { setUsernameAvailable(null); return }
    setCheckingUsername(true)
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/check-username?username=${encodeURIComponent(form.username)}`)
        setUsernameAvailable(data.available)
      } catch { setUsernameAvailable(null) } finally { setCheckingUsername(false) }
    }, 500)
    return () => clearTimeout(timer)
  }, [form.username])

  const getPasswordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[@$!%*?&#]/.test(pwd)) score++
    return score
  }

  const strengthLabel = (score: number) => {
    if (score <= 2) return { label: 'ضعيفة', color: 'text-[#E74C3C]', bg: 'bg-[#E74C3C]', width: '33%' }
    if (score <= 4) return { label: 'متوسطة', color: 'text-[#F39C12]', bg: 'bg-[#F39C12]', width: '66%' }
    return { label: 'قوية', color: 'text-[#27AE60]', bg: 'bg-[#27AE60]', width: '100%' }
  }

  const isFormValid = useCallback(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const hasMinLength = form.password.length >= 8
    const hasUpper = /[A-Z]/.test(form.password)
    const hasLower = /[a-z]/.test(form.password)
    const hasNumber = /\d/.test(form.password)
    const hasSpecial = /[@$!%*?&#]/.test(form.password)
    const strongPassword = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial

    return (
      form.email.length > 0 && emailRegex.test(form.email) && emailAvailable === true &&
      form.username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(form.username) && usernameAvailable === true &&
      strongPassword
    )
  }, [form, emailAvailable, usernameAvailable])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return
    setLoading(true)
    try {
      await register({ email: form.email, username: form.username, password: form.password, fullName: form.fullName || undefined })
      toast.success('تم إنشاء الحساب بنجاح!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(form.password)
  const strength = strengthLabel(passwordStrength)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00D4AA] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-[#1E3A5F]">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1E3A5F]">bpayit <span className="text-[#00D4AA]">IRAQ</span></h1>
          <p className="text-[#64748B] mt-2">إنشاء حساب جديد</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#E2E8F0]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">الاسم الكامل (اختياري)</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#00D4AA] focus:ring-2 focus:ring-[#00D4AA]/20 transition-all"
                  placeholder="اسمك الكامل"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#94A3B8]">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">البريد الإلكتروني *</label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full px-4 py-3 bg-[#F8FAFC] border rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 transition-all pr-10 ${
                    emailAvailable === true ? 'border-[#27AE60] focus:ring-[#27AE60]/20' :
                    emailAvailable === false ? 'border-[#E74C3C] focus:ring-[#E74C3C]/20' :
                    'border-[#E2E8F0] focus:border-[#00D4AA] focus:ring-[#00D4AA]/20'
                  }`}
                  placeholder="example@email.com"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingEmail ? (
                    <div className="w-5 h-5 border-2 border-[#94A3B8] border-t-transparent rounded-full animate-spin"></div>
                  ) : emailAvailable === true ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#27AE60]">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : emailAvailable === false ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#E74C3C]">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#94A3B8]">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  )}
                </div>
              </div>
              {emailAvailable === false && <p className="text-xs text-[#E74C3C] mt-1">البريد الإلكتروني مسجل مسبقاً</p>}
              {emailAvailable === true && <p className="text-xs text-[#27AE60] mt-1">البريد الإلكتروني متاح</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">اسم المستخدم *</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className={`w-full px-4 py-3 bg-[#F8FAFC] border rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 transition-all pr-10 ${
                    usernameAvailable === true ? 'border-[#27AE60] focus:ring-[#27AE60]/20' :
                    usernameAvailable === false ? 'border-[#E74C3C] focus:ring-[#E74C3C]/20' :
                    'border-[#E2E8F0] focus:border-[#00D4AA] focus:ring-[#00D4AA]/20'
                  }`}
                  placeholder="اسم المستخدم"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername ? (
                    <div className="w-5 h-5 border-2 border-[#94A3B8] border-t-transparent rounded-full animate-spin"></div>
                  ) : usernameAvailable === true ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#27AE60]">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : usernameAvailable === false ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#E74C3C]">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#94A3B8]">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                </div>
              </div>
              {usernameAvailable === false && <p className="text-xs text-[#E74C3C] mt-1">اسم المستخدم غير متاح</p>}
              {usernameAvailable === true && <p className="text-xs text-[#27AE60] mt-1">اسم المستخدم متاح</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">كلمة المرور *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#00D4AA] focus:ring-2 focus:ring-[#00D4AA]/20 transition-all pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E3A5F] transition-colors"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {/* Password Strength */}
              {form.password && (
                <div className="mt-2">
                  <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className={`h-full ${strength.bg} rounded-full transition-all`} style={{ width: strength.width }}></div>
                  </div>
                  <p className={`text-xs mt-1 ${strength.color}`}>قوة كلمة المرور: {strength.label}</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full py-3.5 bg-[#00D4AA] hover:bg-[#00B894] disabled:opacity-50 disabled:cursor-not-allowed text-[#1E3A5F] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
              )}
              {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
            <Link
              to="/login"
              className="w-full py-3.5 border-2 border-[#E2E8F0] text-[#1E3A5F] rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#F8FAFC] hover:border-[#00D4AA]/30 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              لدي حساب بالفعل؟ تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
