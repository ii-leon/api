import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import api from '../lib/api'
import { toast } from 'react-hot-toast'

const EXCHANGE_RATE = 1450
const MIN_IQD = 1000

type PaymentMethod = 'zaincash' | 'fast_pay' | 'bank_transfer' | 'usdt'
type TopUpStep = 'method' | 'amount' | 'processing' | 'success' | 'failed' | 'cancelled'

export default function TopUp() {
  const { wallet, fetchWallet } = useStore()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<TopUpStep>('method')
  const [paymentId, setPaymentId] = useState('')
  const [countdown, setCountdown] = useState(920) // 15 minutes 20 seconds

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const amountIQD = parseFloat(amount) || 0
  const amountUSD = amountIQD / EXCHANGE_RATE

  // Countdown timer for processing
  useEffect(() => {
    if (step !== 'processing' || countdown <= 0) return
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [step, countdown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const paymentMethods = [
    { id: 'zaincash' as PaymentMethod, label: 'ZainCash', labelAr: 'زين كاش', color: '#7B2D8E', desc: 'ادفع عبر محفظة زين كاش',
      icon: <svg viewBox="0 0 100 100" className="w-16 h-16"><rect width="100" height="100" fill="#7B2D8E" rx="20"/><path d="M50 25c-15 0-28 10-28 25s13 25 28 25 28-10 28-25S65 25 50 25zm0 40c-8 0-15-7-15-15s7-15 15-15 15 7 15 15-7 15-15 15z" fill="white"/><circle cx="50" cy="50" r="8" fill="white"/></svg>
    },
    { id: 'fast_pay' as PaymentMethod, label: 'FastPay', labelAr: 'فاست باي', color: '#FF6B00', desc: 'دفع سريع بالبطاقة البنكية',
      icon: <svg viewBox="0 0 100 100" className="w-16 h-16"><rect width="100" height="100" fill="#FF6B00" rx="20"/><path d="M55 20L35 50h20L45 80" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    },
    { id: 'bank_transfer' as PaymentMethod, label: 'تحويل بنكي', labelAr: 'تحويل بنكي', color: '#1E3A5F', desc: 'تحويل مباشر من حسابك البنكي',
      icon: <svg viewBox="0 0 100 100" className="w-16 h-16"><rect width="100" height="100" fill="#1E3A5F" rx="20"/><path d="M50 20L20 40v5h60v-5L50 20z" fill="white"/><rect x="25" y="45" width="8" height="25" fill="white"/><rect x="46" y="45" width="8" height="25" fill="white"/><rect x="67" y="45" width="8" height="25" fill="white"/><rect x="15" y="70" width="70" height="8" fill="white"/></svg>
    },
    { id: 'usdt' as PaymentMethod, label: 'USDT', labelAr: 'ي إس دي تي', color: '#26A17B', desc: 'ادفع بالعملات الرقمية',
      icon: <svg viewBox="0 0 100 100" className="w-16 h-16"><rect width="100" height="100" fill="#26A17B" rx="20"/><circle cx="50" cy="50" r="30" stroke="white" strokeWidth="6" fill="none"/><text x="50" y="60" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">$</text></svg>
    },
  ]

  const handleTopUp = async () => {
    if (amountIQD < MIN_IQD) {
      toast.error('الحد الأدنى للشحن هو 1,000 د.ع')
      return
    }

    setStep('processing')
    setCountdown(300)
    setLoading(true)

    try {
      if (selectedMethod === 'zaincash') {
        const { data } = await api.post('/payment/zaincash', {
          amountIqd: amountIQD,
        })
        setPaymentId(data.transactionId || '')
        if (data.paymentUrl) {
          // Open ZainCash in new tab
          window.open(data.paymentUrl, '_blank')
          return
        }
      } else if (selectedMethod === 'fast_pay') {
        const { data } = await api.post('/payment/fast-pay', { amountIqd: amountIQD })
        setPaymentId(data.transactionId || '')
        if (data.paymentUrl) {
          window.open(data.paymentUrl, '_blank')
          return
        }
      } else if (selectedMethod === 'bank_transfer') {
        await api.post('/wallet/topup', {
          amountIqd: amountIQD,
          referenceNumber: 'manual-' + Date.now(),
        })
        setPaymentId('BANK-' + Date.now())
      } else if (selectedMethod === 'usdt') {
        await api.post('/payment/usdt', { amountUsd: amountUSD })
        setPaymentId('USDT-' + Date.now())
      }

      // Stay in processing state - user can check status or cancel
      fetchWallet()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ')
      setStep('failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      // Try to cancel the payment if we have a payment ID
      if (paymentId) {
        await api.post('/payment/cancel', { paymentId }).catch(() => {})
      }
      setStep('cancelled')
      toast.success('تم إلغاء العملية')
    } catch {
      setStep('cancelled')
    }
  }

  const handleCheckStatus = async () => {
    try {
      const { data } = await api.get(`/payment/status/${paymentId}`)
      if (data.status === 'completed') {
        setStep('success')
        fetchWallet()
      } else if (data.status === 'failed') {
        setStep('failed')
      }
      // If still pending, stay in processing
    } catch {
      // Stay in processing
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#1E293B]">شحن المحفظة</h1>
        <p className="text-[#64748B] text-sm mt-1">اختر طريقة الدفع المناسبة</p>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-br from-[#1E3A5F] to-[#152A45] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70 text-sm">الرصيد الحالي</span>
          <div className="flex items-center gap-2 bg-[#00D4AA]/20 px-3 py-1.5 rounded-full text-xs text-[#00D4AA]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            مؤمن
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-lg text-white/70">IQD</span>
          <span className="text-[32px] font-bold">{formatNumber(wallet?.balance ? Math.round(wallet.balance * 1450) : 0)}</span>
        </div>
      </div>

      {/* Method Selection */}
      {step === 'method' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-[#1E293B]">اختر طريقة الدفع</h2>
          <div className="grid grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => { setSelectedMethod(method.id); setStep('amount') }}
                className="p-5 bg-white border-2 border-[#E2E8F0] rounded-xl hover:border-[#00D4AA] transition-all text-center group"
              >
                <div className="flex justify-center mb-3">{method.icon}</div>
                <p className="font-semibold text-[#1E293B] mb-1">{method.label}</p>
                <p className="text-xs text-[#64748B]">{method.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Amount Input */}
      {step === 'amount' && (
        <div className="space-y-4">
          <button onClick={() => setStep('method')} className="text-sm text-[#00D4AA] hover:text-[#00B894]">← العودة</button>
          <h2 className="font-semibold text-[#1E293B]">أدخل المبلغ</h2>
          
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
            <div className="relative mb-4">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                min={MIN_IQD}
                className="w-full text-4xl font-bold text-center py-4 border-b-2 border-[#E2E8F0] focus:border-[#00D4AA] outline-none transition-colors bg-transparent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] font-medium">IQD</span>
            </div>
            
            {amountIQD > 0 && (
              <p className="text-center text-sm text-[#64748B] mb-4">≈ ${amountUSD.toFixed(2)} USD</p>
            )}

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[5000, 10000, 25000, 50000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(String(val))}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    amountIQD === val ? 'bg-[#00D4AA] text-[#1E3A5F]' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {formatNumber(val)}
                </button>
              ))}
            </div>

            <button
              onClick={handleTopUp}
              disabled={!amount || amountIQD < MIN_IQD || loading}
              className="w-full py-4 bg-[#00D4AA] text-[#1E3A5F] rounded-xl font-semibold mt-6 hover:bg-[#00B894] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              شحن {formatNumber(amountIQD)} IQD
            </button>
          </div>
        </div>
      )}

      {/* Processing */}
      {step === 'processing' && (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-[#E2E8F0] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#00D4AA] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">جارٍ المعالجة</h2>
          <p className="text-[#64748B] text-sm mb-4">يرجى إتمام الدفع في النافذة الجديدة</p>
          
          <div className="bg-[#F8FAFC] rounded-lg p-4 mb-6 inline-block">
            <p className="text-[#64748B] text-sm">الوقت المتبقي: <span className="font-bold text-[#1E3A5F]">{formatTime(countdown)}</span></p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleCheckStatus}
              className="px-6 py-3 bg-[#F1F5F9] text-[#1E3A5F] rounded-lg font-medium hover:bg-[#E2E8F0] transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              تحديث الحالة
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-[#E74C3C]/10 text-[#E74C3C] rounded-lg font-medium hover:bg-[#E74C3C]/20 transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              إلغاء
            </button>
          </div>

          <p className="text-xs text-[#94A3B8] mt-6">
            تم فتح صفحة الدفع في نافذة جديدة. أكمل الدفع ثم عد هنا.
          </p>
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
          <div className="w-16 h-16 bg-[#27AE60]/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-[#27AE60]">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">تم الشحن بنجاح!</h2>
          <p className="text-[#64748B] text-sm mb-2">تم إضافة {formatNumber(amountIQD)} IQD إلى محفظتك</p>
          <p className="text-xs text-[#94A3B8] mb-6">رقم العملية: {paymentId}</p>
          <button onClick={() => { setStep('method'); setSelectedMethod(null); setAmount(''); setPaymentId('') }} className="px-6 py-3 bg-[#00D4AA] text-[#1E3A5F] rounded-lg font-semibold hover:bg-[#00B894] transition-colors">
            شحن مرة أخرى
          </button>
        </div>
      )}

      {/* Failed */}
      {step === 'failed' && (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
          <div className="w-16 h-16 bg-[#E74C3C]/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-[#E74C3C]">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">فشلت العملية</h2>
          <p className="text-[#64748B] text-sm mb-6">حدث خطأ أثناء الشحن. يرجى المحاولة مرة أخرى.</p>
          <button onClick={() => { setStep('method'); setSelectedMethod(null); setPaymentId('') }} className="px-6 py-3 bg-[#E74C3C] text-white rounded-lg font-semibold hover:bg-[#c0392b] transition-colors">
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Cancelled */}
      {step === 'cancelled' && (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
          <div className="w-16 h-16 bg-[#F39C12]/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-[#F39C12]">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">تم إلغاء العملية</h2>
          <p className="text-[#64748B] text-sm mb-6">لم يتم خصم أي مبلغ من حسابك</p>
          <button onClick={() => { setStep('method'); setSelectedMethod(null); setPaymentId('') }} className="px-6 py-3 bg-[#00D4AA] text-[#1E3A5F] rounded-lg font-semibold hover:bg-[#00B894] transition-colors">
            محاولة مرة أخرى
          </button>
        </div>
      )}
    </div>
  )
}
