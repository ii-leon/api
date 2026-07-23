import { useState } from 'react'
import { useStore } from '../lib/store'
import api from '../lib/api'
import { toast } from 'react-hot-toast'

const EXCHANGE_RATE = 1450

export default function CreateCheckout() {
  useStore()
  const [merchantName, setMerchantName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'IQD'>('IQD')
  const [description, setDescription] = useState('')
  const [orderId, setOrderId] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const amountIQD = currency === 'USD' ? Math.round(parseFloat(amount || '0') * EXCHANGE_RATE) : parseFloat(amount || '0')
  const amountUSD = currency === 'IQD' ? parseFloat(amount || '0') / EXCHANGE_RATE : parseFloat(amount || '0')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!merchantName.trim()) {
      toast.error('أدخل اسم التاجر')
      return
    }
    if (amountIQD < 1000) {
      toast.error('الحد الأدنى 1,000 د.ع')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/checkout/create', {
        merchantName,
        amount: amountUSD,
        currency: 'IQD',
        amountIqd: amountIQD,
        description: description || `دفع لـ ${merchantName}`,
        orderId: orderId || `ORD-${Date.now()}`,
        callbackUrl: callbackUrl || undefined,
      })

      setResult(data)
      toast.success('تم إنشاء جلسة الدفع بنجاح')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('تم النسخ')
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B]">تم إنشاء جلسة الدفع</h1>
          <p className="text-[#64748B] text-sm mt-1">شارك الرابط التالي مع العميل لإجراء الدفع</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
          <h2 className="font-semibold text-[#1E293B] mb-4">رابط الدفع</h2>
          <div className="bg-[#F1F5F9] rounded-lg p-4 mb-4">
            <code className="text-xs text-[#1E3A5F] break-all leading-relaxed block" dir="ltr">
              {`${window.location.origin}/pay/${result.token}`}
            </code>
          </div>
          <button
            onClick={() => copyToClipboard(`${window.location.origin}/pay/${result.token}`)}
            className="w-full py-3 bg-[#00D4AA] text-[#1E3A5F] rounded-lg font-semibold hover:bg-[#00B894] transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            نسخ الرابط
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
          <h2 className="font-semibold text-[#1E293B] mb-4">تفاصيل الجلسة</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">رقم الجلسة</span>
              <span className="font-mono text-[#1E3A5F]">{result.sessionId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">التاجر</span>
              <span>{merchantName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">المبلغ</span>
              <span className="font-semibold">{formatNumber(amountIQD)} IQD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">الصلاحية</span>
              <span>30 دقيقة</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setResult(null)
            setMerchantName('')
            setAmount('')
            setDescription('')
            setOrderId('')
            setCallbackUrl('')
          }}
          className="w-full py-3 bg-[#F1F5F9] text-[#1E3A5F] rounded-lg font-medium hover:bg-[#E2E8F0] transition-colors"
        >
          إنشاء جلسة جديدة
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-[28px] font-bold text-[#1E293B]">إنشاء جلسة دفع</h1>
        <p className="text-[#64748B] text-sm mt-1">أنشئ رابط دفع آمن لعميلك</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0] space-y-5">
        {/* Merchant Name */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">اسم المتجر / التاجر</label>
          <input
            type="text"
            value={merchantName}
            onChange={e => setMerchantName(e.target.value)}
            placeholder="اسم المتجر"
            className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">المبلغ</label>
          <div className="flex gap-2">
            <div className="flex-1 flex">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                min={currency === 'IQD' ? '1000' : '1'}
                className="flex-1 px-4 py-3 border border-[#E2E8F0] rounded-r-lg text-sm focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
                required
              />
              <span className="px-4 py-3 bg-[#F1F5F9] border border-[#E2E8F0] border-r-0 rounded-l-lg text-sm font-medium text-[#64748B]">
                {currency}
              </span>
            </div>
            <div className="flex bg-[#F1F5F9] rounded-lg border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setCurrency('IQD')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${currency === 'IQD' ? 'bg-[#1E3A5F] text-white' : 'text-[#64748B]'}`}
              >
                IQD
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${currency === 'USD' ? 'bg-[#1E3A5F] text-white' : 'text-[#64748B]'}`}
              >
                USD
              </button>
            </div>
          </div>
          {amount && (
            <p className="text-xs text-[#64748B] mt-2">
              ≈ {currency === 'IQD' ? `$${amountUSD.toFixed(2)}` : `${formatNumber(amountIQD)} IQD`}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">الوصف (اختياري)</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="وصف الدفع"
            className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
          />
        </div>

        {/* Order ID */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">رقم الطلب (اختياري)</label>
          <input
            type="text"
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="ORD-12345"
            className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
          />
        </div>

        {/* Callback URL */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">رابط الإشعار (اختياري)</label>
          <input
            type="url"
            value={callbackUrl}
            onChange={e => setCallbackUrl(e.target.value)}
            placeholder="https://your-site.com/callback"
            className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F] focus:ring-2 focus:ring-[#2E5A8F]/10"
          />
          <p className="text-xs text-[#94A3B8] mt-1">سيتم إرسال إشعار POST عند اكتمال الدفع</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !merchantName || !amount}
          className="w-full py-3.5 bg-[#00D4AA] text-[#1E3A5F] rounded-lg font-semibold hover:bg-[#00B894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              إنشاء جلسة دفع آمنة
            </>
          )}
        </button>
      </form>

      {/* Security Info */}
      <div className="bg-[#1E3A5F]/5 border border-[#1E3A5F]/10 rounded-xl p-5">
        <h3 className="font-semibold text-[#1E3A5F] text-sm mb-3">مميزات الأمان</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            'تشفير JWT 256-bit',
            'صلاحية 30 دقيقة فقط',
            'رابط一次性 (يستخدم مرة واحدة)',
            'حماية CSRF',
            'تحقق من SSL',
            'سجل مراجعة كامل',
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[#64748B]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-[#27AE60] shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
