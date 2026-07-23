import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { getBaseUrl } from '../lib/api'

// Create a public API instance without auth interceptors
const publicApi = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

interface CheckoutSession {
  sessionId: string
  merchantName: string
  merchantId: string
  amount: number | string
  currency: string
  amountIqd: number | string
  description: string
  orderId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  expiresAt: string
  createdAt: string
}

type PaymentMethod = 'card' | 'wallet' | 'zaincash'
type CheckoutStep = 'loading' | 'form' | 'processing' | 'success' | 'failed' | 'expired'

export default function SecureCheckout() {
  const { token: urlToken } = useParams<{ token: string }>()
  const [step, setStep] = useState<CheckoutStep>('loading')
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [error, setError] = useState('')
  
  // Form states
  const [activeTab, setActiveTab] = useState<PaymentMethod>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [email, setEmail] = useState('')
  const [walletEmail, setWalletEmail] = useState('')
  const [walletPassword, setWalletPassword] = useState('')
  const [zaincashPhone, setZaincashPhone] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [loading, setLoading] = useState(false)

  // Extract token from URL params
  const token = urlToken || ''

  // Validate and load session
  useEffect(() => {
    const loadSession = async () => {
      if (!token) {
        setError('رابط الدفع غير صالح')
        setStep('failed')
        return
      }

      try {
        // Decode JWT payload (without verification - server will verify)
        const payload = JSON.parse(atob(token.split('.')[1]))
        
        // Check expiry
        if (payload.exp * 1000 < Date.now()) {
          setError('انتهت صلاحية رابط الدفع')
          setStep('expired')
          return
        }

        // Fetch session from backend
        const { data } = await publicApi.get(`/checkout/session/${payload.sub || payload.sessionId}`, {
          headers: { 'X-Checkout-Token': token }
        })

        if (data.status === 'completed') {
          setPaymentId(data.paymentId || data.sessionId)
          setStep('success')
          return
        }

        if (data.status === 'expired' || data.status === 'failed') {
          setError(data.status === 'expired' ? 'انتهت صلاحية الجلسة' : 'فشلت المعالجة')
          setStep('failed')
          return
        }

        setSession(data)
        setStep('form')
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('جلسة الدفع غير موجودة')
        } else if (err.response?.status === 410) {
          setError('انتهت صلاحية جلسة الدفع')
          setStep('expired')
        } else {
          setError('حدث خطأ أثناء التحقق من الجلسة')
        }
        setStep('failed')
      }
    }

    loadSession()
  }, [token])

  // Format card number
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  // Format expiry
  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  // Validate form
  const validateForm = useCallback((): boolean => {
    if (activeTab === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) return false
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return false
      if (cardCvv.length < 3) return false
      if (!cardName.trim()) return false
      if (!email || !email.includes('@')) return false
    } else if (activeTab === 'wallet') {
      if (!walletEmail || !walletEmail.includes('@')) return false
      if (!walletPassword || walletPassword.length < 6) return false
    } else if (activeTab === 'zaincash') {
      if (zaincashPhone.replace(/\s/g, '').length < 10) return false
    }
    return true
  }, [activeTab, cardNumber, cardExpiry, cardCvv, cardName, email, walletEmail, walletPassword, zaincashPhone])

  // Handle payment
  const handlePayment = async () => {
    if (!validateForm() || !session) return

    setLoading(true)
    setStep('processing')

    try {
      const paymentData: any = {
        sessionId: session.sessionId,
        token,
        method: activeTab,
        amount: session.amount,
        currency: session.currency,
      }

      if (activeTab === 'card') {
        paymentData.card = {
          number: cardNumber.replace(/\s/g, ''),
          expiry: cardExpiry,
          cvv: cardCvv,
          name: cardName,
          email,
        }
      } else if (activeTab === 'wallet') {
        paymentData.wallet = {
          email: walletEmail,
          password: walletPassword,
        }
      } else if (activeTab === 'zaincash') {
        paymentData.zaincash = {
          phone: zaincashPhone.replace(/\s/g, ''),
        }
      }

      const { data } = await publicApi.post('/checkout/pay', paymentData, {
        headers: { 'X-Checkout-Token': token }
      })

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }

      setPaymentId(data.paymentId || data.transactionId)
      setStep('success')
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشلت المعالجة')
      setStep('failed')
    } finally {
      setLoading(false)
    }
  }

  // Detect card type
  const getCardType = () => {
    const num = cardNumber.replace(/\s/g, '')
    if (num.startsWith('4')) return 'visa'
    if (num.startsWith('5') || num.startsWith('2')) return 'mastercard'
    return null
  }

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="max-w-[480px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00D4AA] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#1E3A5F]">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-[#1E3A5F]">bpayit <span className="text-[#00D4AA]">IRAQ</span></span>
          </div>
          <div className="flex items-center gap-2 text-[#27AE60] text-xs font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>اتصال آمن</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[480px]">
          
          {/* Loading State */}
          {step === 'loading' && (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-16 h-16 border-4 border-[#E2E8F0] border-t-[#00D4AA] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#64748B]">جاري تحميل صفحة الدفع...</p>
            </div>
          )}

          {/* Error/Failed State */}
          {(step === 'failed' || step === 'expired') && (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-16 h-16 bg-[#E74C3C]/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-[#E74C3C]">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#1E293B] mb-2">
                {step === 'expired' ? 'انتهت الصلاحية' : 'فشلت المعالجة'}
              </h2>
              <p className="text-[#64748B] text-sm mb-6">{error}</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-[#F1F5F9] text-[#1E3A5F] rounded-lg font-medium hover:bg-[#E2E8F0] transition-colors"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-16 h-16 bg-[#27AE60]/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-[#27AE60]">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#1E293B] mb-2">تم الدفع بنجاح!</h2>
              <p className="text-[#64748B] text-sm mb-4">
                تم خصم {formatNumber(Number(session?.amountIqd || 0))} IQD من حسابك
              </p>
              <div className="bg-[#F1F5F9] rounded-lg p-4 text-right mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#64748B]">رقم المعاملة</span>
                  <span className="font-mono text-[#1E3A5F]">{paymentId.slice(0, 20)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">التاجر</span>
                  <span>{session?.merchantName || '—'}</span>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-3 bg-[#27AE60] text-white rounded-lg font-semibold hover:bg-[#219a52] transition-colors"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Payment Form */}
          {step === 'form' && session && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Merchant Info */}
              <div className="bg-[#1E3A5F] p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl font-bold">{session.merchantName[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{session.merchantName}</p>
                    <p className="text-white/60 text-xs">{session.description}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">المبلغ المطلوب</span>
                  <div className="text-left">
                    <p className="text-2xl font-bold">{formatNumber(Number(session.amountIqd))} IQD</p>
                    <p className="text-white/60 text-xs">≈ ${Number(session.amount).toFixed(2)} USD</p>
                  </div>
                </div>
              </div>

              {/* Payment Tabs */}
              <div className="p-6">
                <div className="flex gap-2 mb-6 bg-[#F1F5F9] p-1 rounded-xl">
                  {[
                    { key: 'card', label: 'بطاقة', icon: 'M1 4h22v16H1z M1 10h22' },
                    { key: 'wallet', label: 'محفظة', icon: 'M21 12V7H5a2 2 0 0 1 0-4h14v4 M3 5v14a2 2 0 0 0 2 2h16v-5' },
                    { key: 'zaincash', label: 'زين كاش', icon: 'M12 8v8M8 12h8 M22 4H2v16h20V4z' },
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as PaymentMethod)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                        activeTab === key ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#64748B]'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d={icon}/>
                      </svg>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Card Form */}
                {activeTab === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1E293B] mb-2">رقم البطاقة</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={e => setCardNumber(formatCardNumber(e.target.value).substring(0, 19))}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full pl-24 pr-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${getCardType() === 'visa' ? 'bg-[#1A1F71] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>VISA</span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${getCardType() === 'mastercard' ? 'bg-[#EB001B] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>MC</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[#1E293B] mb-2">تاريخ الانتهاء</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1E293B] mb-2">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1E293B] mb-2">اسم حامل البطاقة</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={e => setCardName(e.target.value)}
                        placeholder="الاسم كما يظهر على البطاقة"
                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1E293B] mb-2">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                      />
                    </div>
                  </div>
                )}

                {/* Wallet Form */}
                {activeTab === 'wallet' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-[#1E3A5F] to-[#152A45] rounded-xl p-4 text-white">
                      <p className="text-white/70 text-xs mb-2">ادفع من محفظتك</p>
                      <p className="text-sm">سيتم خصم المبلغ من رصيد محفظتك</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1E293B] mb-2">البريد الإلكتروني للمحفظة</label>
                      <input
                        type="email"
                        value={walletEmail}
                        onChange={e => setWalletEmail(e.target.value)}
                        placeholder="أدخل البريد الإلكتروني لحسابك"
                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1E293B] mb-2">كلمة مرور المحفظة</label>
                      <input
                        type="password"
                        value={walletPassword}
                        onChange={e => setWalletPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور للتأكيد"
                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                      />
                    </div>
                  </div>
                )}

                {/* ZainCash Form */}
                {activeTab === 'zaincash' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl p-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#FF6B00] shrink-0">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <p className="text-[13px] text-[#64748B]">سيتم توجيهك لصفحة زين كاش لإتمام الدفع</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1E293B] mb-2">رقم الهاتف</label>
                      <input
                        type="tel"
                        value={zaincashPhone}
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g, '').substring(0, 10)
                          if (v.length > 4) v = v.substring(0, 4) + ' ' + v.substring(4)
                          if (v.length > 8) v = v.substring(0, 8) + ' ' + v.substring(8)
                          setZaincashPhone(v)
                        }}
                        placeholder="78XX XXX XXXX"
                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                      />
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && step === 'form' && (
                  <div className="flex items-center gap-2 p-3 bg-[#E74C3C]/10 border border-[#E74C3C]/20 rounded-lg mt-4">
                    <span className="text-[#E74C3C] text-sm">{error}</span>
                  </div>
                )}

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={loading || !validateForm()}
                  className="w-full py-4 bg-[#1E3A5F] text-white rounded-xl font-semibold text-base mt-6 hover:bg-[#152A45] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  دفع {formatNumber(Number(session.amountIqd))} IQD
                </button>

                {/* Security Badges */}
                <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-[#27AE60]">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    SSL 256-bit
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-[#27AE60]">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    PCI DSS
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-[#27AE60]">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    3D Secure
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-4">
        <div className="max-w-[480px] mx-auto px-6 text-center">
          <p className="text-[11px] text-[#94A3B8]">
            © 2024 bpayit IRAQ - جميع الحقوق محفوظة | بوابة دفع آمنة ومعتمدة
          </p>
        </div>
      </footer>
    </div>
  )
}
