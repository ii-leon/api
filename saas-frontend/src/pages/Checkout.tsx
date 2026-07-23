import { useState } from 'react'
import { useStore } from '../lib/store'
import api from '../lib/api'

type PaymentMethod = 'card' | 'wallet' | 'zaincash'
type CheckoutStep = 'form' | 'processing' | 'success' | 'failed'

export default function Checkout() {
  const { wallet, fetchWallet } = useStore()
  const [activeTab, setActiveTab] = useState<PaymentMethod>('card')
  const [step, setStep] = useState<CheckoutStep>('form')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [email, setEmail] = useState('')
  const [walletId, setWalletId] = useState('**** **** **** 5678')
  const [walletPassword, setWalletPassword] = useState('')
  const [zaincashPhone, setZaincashPhone] = useState('')
  const [error, setError] = useState('')
  const [paymentId, setPaymentId] = useState('')

  const amountIQD = 250000
  const amountUSD = (amountIQD / 1450).toFixed(2)

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

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted.substring(0, 19))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardExpiry(formatExpiry(e.target.value))
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.substring(0, 10)
    if (value.length > 4) value = value.substring(0, 4) + ' ' + value.substring(4)
    if (value.length > 8) value = value.substring(0, 8) + ' ' + value.substring(8)
    setZaincashPhone(value)
  }

  const validateForm = (): boolean => {
    if (activeTab === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setError('أدخل رقم البطاقة بشكل صحيح')
        return false
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setError('أدخل تاريخ الانتهاء بشكل صحيح')
        return false
      }
      if (cardCvv.length < 3) {
        setError('أدخل رقم CVV بشكل صحيح')
        return false
      }
      if (!cardName.trim()) {
        setError('أدخل اسم حامل البطاقة')
        return false
      }
      if (!email || !email.includes('@')) {
        setError('أدخل البريد الإلكتروني بشكل صحيح')
        return false
      }
    } else if (activeTab === 'wallet') {
      if (!walletPassword || walletPassword.length < 6) {
        setError('أدخل كلمة مرور المحفظة')
        return false
      }
    } else if (activeTab === 'zaincash') {
      if (zaincashPhone.replace(/\s/g, '').length < 10) {
        setError('أدخل رقم الهاتف بشكل صحيح')
        return false
      }
    }
    setError('')
    return true
  }

  const handlePayment = async () => {
    if (!validateForm()) return

    setStep('processing')
    try {
      if (activeTab === 'card') {
        const { data } = await api.post('/payment/fast-pay', {
          amount: parseFloat(amountUSD),
          currency: 'IQD',
          amountIqd: amountIQD,
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiry: cardExpiry,
          cvv: cardCvv,
          cardHolder: cardName,
          email,
        })
        setPaymentId(data.transactionId || data.id || 'TXN-' + Date.now())
      } else if (activeTab === 'wallet') {
        await api.post('/wallet/transfer', {
          recipientUsername: 'merchant',
          amount: parseFloat(amountUSD),
        })
        setPaymentId('WALLET-' + Date.now())
      } else if (activeTab === 'zaincash') {
        const { data } = await api.post('/payment/zain-cash', {
          amount: parseFloat(amountUSD),
          currency: 'IQD',
          amountIqd: amountIQD,
          phone: zaincashPhone.replace(/\s/g, ''),
        })
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
          return
        }
        setPaymentId(data.transactionId || data.id || 'ZAIN-' + Date.now())
      }
      setStep('success')
      fetchWallet()
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء المعالجة')
      setStep('failed')
    }
  }

  const resetCheckout = () => {
    setStep('form')
    setCardNumber('')
    setCardExpiry('')
    setCardCvv('')
    setCardName('')
    setEmail('')
    setWalletPassword('')
    setZaincashPhone('')
    setError('')
    setPaymentId('')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-8 py-4">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-[#1E3A5F]">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="text-lg font-bold text-[#1E3A5F]">bpayit <span className="text-[#00D4AA]">IRAQ</span></span>
          </div>
          <div className="flex items-center gap-2 text-[#27AE60] text-[13px] font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            اتصال آمن
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 grid grid-cols-[1fr_400px] gap-8 max-w-[1200px] mx-auto p-8 w-full">
        {/* Left Column - Payment Form */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          {step === 'form' && (
            <>
              <h1 className="text-2xl font-bold mb-6">إتمام الدفع</h1>

              {/* Order Summary */}
              <div className="bg-[#F1F5F9] rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E2E8F0]">
                  <div className="w-12 h-12 bg-[#1E3A5F] text-white rounded-lg flex items-center justify-center font-semibold text-lg">م</div>
                  <div>
                    <span className="font-semibold text-[15px] block">متجر إلكتروني</span>
                    <span className="text-[13px] text-[#64748B]">merchant@example.com</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">اشتراك سنوي - خطة احترافية</span>
                  <span className="font-semibold text-[15px]">250,000 IQD</span>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="flex gap-2 mb-6 bg-[#F1F5F9] p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('card')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-[13px] font-medium transition-all ${
                    activeTab === 'card' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  بطاقة ائتمان
                </button>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-[13px] font-medium transition-all ${
                    activeTab === 'wallet' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
                  </svg>
                  محفظتي
                </button>
                <button
                  onClick={() => setActiveTab('zaincash')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-[13px] font-medium transition-all ${
                    activeTab === 'zaincash' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M12 8v8M8 12h8"/>
                  </svg>
                  زين كاش
                </button>
              </div>

              {/* Card Payment Form */}
              {activeTab === 'card' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">رقم البطاقة</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full pl-28 pr-4 py-3.5 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${cardNumber.startsWith('4') ? 'bg-[#1A1F71] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>VISA</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${(cardNumber.startsWith('5') || cardNumber.startsWith('2')) ? 'bg-[#EB001B] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>MC</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">تاريخ الانتهاء</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">CVV</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={handleCvvChange}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">اسم حامل البطاقة</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      placeholder="الاسم كما يظهر على البطاقة"
                      className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
                    />
                  </div>
                </div>
              )}

              {/* Wallet Payment Form */}
              {activeTab === 'wallet' && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-[#1E3A5F] to-[#152A45] rounded-xl p-6 text-white text-center">
                    <span className="text-[13px] text-white/70 block mb-2">رصيد محفظتك</span>
                    <span className="text-[28px] font-bold block mb-2">${wallet?.balance?.toFixed(2) || '125,847,500'}</span>
                    <span className="text-[13px] text-[#00D4AA]">✓ رصيد كافٍ</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">رقم المحفظة</label>
                    <input
                      type="text"
                      value={walletId}
                      onChange={e => setWalletId(e.target.value)}
                      className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">كلمة مرور المحفظة</label>
                    <input
                      type="password"
                      value={walletPassword}
                      onChange={e => setWalletPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
                    />
                  </div>
                </div>
              )}

              {/* ZainCash Payment Form */}
              {activeTab === 'zaincash' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl p-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#FF6B00] shrink-0">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <p className="text-[13px] text-[#64748B]">سيتم توجيهك إلى صفحة زين كاش لإتمام الدفع</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">رقم الهاتف (زين كاش)</label>
                    <input
                      type="tel"
                      value={zaincashPhone}
                      onChange={handlePhoneChange}
                      placeholder="07XX XXX XXXX"
                      className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#E74C3C]/10 border border-[#E74C3C]/20 rounded-xl mt-4">
                  <span className="text-[#E74C3C] text-sm">{error}</span>
                </div>
              )}

              <button onClick={handlePayment} className="w-full py-4 bg-[#1E3A5F] text-white rounded-xl font-semibold text-base mt-6 hover:bg-[#152A45] transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                دفع 250,000 IQD
              </button>

              {/* Trust Badges */}
              <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-[#27AE60]">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  تشفير SSL 256-بت
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-[#27AE60]">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  PCI DSS معتمد
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-[#27AE60]">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  حماية ضد الاحتيال
                </div>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-[#E2E8F0] rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold mb-2">جاري معالجة الدفع...</h2>
              <p className="text-[#64748B] text-sm">يرجى الانتظار، لا تغلق هذه الصفحة</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-[#27AE60]/15 rounded-full flex items-center justify-center mb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-[#27AE60]">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">تم الدفع بنجاح!</h2>
              <p className="text-[#64748B] text-sm mb-6">تم خصم 250,000 IQD من حسابك</p>
              <div className="w-full bg-[#F1F5F9] rounded-lg p-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">رقم المعاملة</span>
                  <span className="text-[#1E3A5F] font-mono">{paymentId.slice(0, 20)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">التاريخ والوقت</span>
                  <span>{new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <button onClick={resetCheckout} className="w-full py-3.5 bg-[#27AE60] text-white rounded-xl font-semibold text-[15px] hover:bg-[#219a52] transition-all hover:-translate-y-0.5">
                العودة للمتجر
              </button>
            </div>
          )}

          {step === 'failed' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-[#E74C3C]/15 rounded-full flex items-center justify-center mb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-[#E74C3C]">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">فشلت المعالجة</h2>
              <p className="text-[#64748B] text-sm mb-6">{error || 'حدث خطأ غير متوقع'}</p>
              <div className="flex gap-3 w-full">
                <button onClick={resetCheckout} className="flex-1 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl font-medium hover:bg-[#E2E8F0] transition-colors">إعادة المحاولة</button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Details */}
        <aside className="sticky top-8 h-fit">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-semibold mb-5">تفاصيل الطلب</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm py-3">
                <span className="text-[#64748B]">المتجر</span>
                <span className="font-medium">متجر إلكتروني</span>
              </div>
              <div className="flex justify-between text-sm py-3">
                <span className="text-[#64748B]">رقم الطلب</span>
                <span className="text-[#1E3A5F] font-mono">#ORD-2024-78542</span>
              </div>
              <div className="flex justify-between text-sm py-3">
                <span className="text-[#64748B]">المنتج</span>
                <span className="font-medium">اشتراك سنوي - خطة احترافية</span>
              </div>
              <div className="flex justify-between text-sm py-3">
                <span className="text-[#64748B]">المدة</span>
                <span className="font-medium">12 شهر</span>
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0] my-4"></div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>السعر الأصلي</span>
                <span>300,000 IQD</span>
              </div>
              <div className="flex justify-between text-sm text-[#27AE60]">
                <span>خصم 17%</span>
                <span>-50,000 IQD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>رسوم المعالجة</span>
                <span className="font-semibold">مجاني</span>
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0] my-4"></div>

            <div className="flex justify-between text-lg font-bold">
              <span>الإجمالي</span>
              <span className="text-[#1E3A5F]">250,000 IQD</span>
            </div>

            {/* Guarantee */}
            <div className="flex gap-3 bg-[#27AE60]/10 rounded-xl p-4 mt-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#27AE60] shrink-0">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div>
                <strong className="text-[13px] block">ضمان استرداد الأموال</strong>
                <span className="text-[12px] text-[#64748B] leading-relaxed">إذا لم تكن راضياً، يمكنك استرداد أموالك خلال 30 يوماً</span>
              </div>
            </div>

            {/* Help Links */}
            <div className="flex justify-center gap-4 mt-5 pt-4 border-t border-[#E2E8F0]">
              <a href="#" className="text-[12px] text-[#94A3B8] hover:text-[#1E3A5F]">سياسة الخصوصية</a>
              <a href="#" className="text-[12px] text-[#94A3B8] hover:text-[#1E3A5F]">شروط الخدمة</a>
              <a href="#" className="text-[12px] text-[#94A3B8] hover:text-[#1E3A5F]">المساعدة والدعم</a>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] px-8 py-4">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center text-[12px] text-[#94A3B8]">
          <p>© 2024 bpayit IRAQ - جميع الحقوق محفوظة</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#1E293B]">من نحن</a>
            <a href="#" className="hover:text-[#1E293B]">تواصل معنا</a>
            <a href="#" className="hover:text-[#1E293B]">الأسئلة الشائعة</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
