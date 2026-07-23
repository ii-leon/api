import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import api from '../lib/api'
import { toast } from 'react-hot-toast'

const EXCHANGE_RATE = 1450

export default function Transfer() {
  const { wallet, transfer, user, fetchWallet } = useStore()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipientValid, setRecipientValid] = useState<boolean | null>(null)
  const [recipientName, setRecipientName] = useState('')
  const [checkingRecipient, setCheckingRecipient] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!recipient || recipient.length < 3) {
      setRecipientValid(null)
      setRecipientName('')
      return
    }
    if (recipient === user?.username || recipient === user?.email) {
      setRecipientValid(false)
      setRecipientName('لا يمكنك التحويل لنفسك')
      return
    }

    setCheckingRecipient(true)
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/check?username=${encodeURIComponent(recipient)}`)
        if (data.exists) {
          setRecipientValid(true)
          setRecipientName(data.fullName || data.username)
        } else {
          setRecipientValid(false)
          setRecipientName('المستخدم غير موجود')
        }
      } catch {
        setRecipientValid(null)
        setRecipientName('')
      } finally {
        setCheckingRecipient(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [recipient, user?.username, user?.email])

  const formatNumber = (num: number | undefined | null) => {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 1000) {
      toast.error('الحد الأدنى للتحويل 1,000 د.ع')
      return
    }
    if (!recipientValid) {
      toast.error('أدخل اسم مستخدم صحيح')
      return
    }
    setShowConfirm(true)
  }

  const confirmTransfer = async () => {
    setShowConfirm(false)
    setLoading(true)
    try {
      const amt = parseFloat(amount)
      const amtUSD = amt / EXCHANGE_RATE
      await transfer(recipient, amtUSD)
      toast.success(`تم تحويل ${formatNumber(amt)} د.ع إلى ${recipientName || recipient}`)
      setRecipient('')
      setAmount('')
      setNote('')
      setRecipientValid(null)
      setRecipientName('')
      await fetchWallet()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const amt = parseFloat(amount) || 0
  const amtUSD = amt / EXCHANGE_RATE
  const balanceIQD = (wallet?.balance || 0) * EXCHANGE_RATE
  const remaining = balanceIQD - amt

  return (
    <div className="max-w-lg mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#1E293B]">تحويل أموال</h1>
        <p className="text-[#64748B] text-sm mt-1">أرسل الأموال لأي شخص بسهولة وأمان</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#1E3A5F] to-[#152A45] rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-sm">الرصيد المتاح</span>
          <div className="flex items-center gap-2 text-xs text-[#00D4AA]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            آمن
          </div>
        </div>
        <p className="text-2xl font-bold mt-2">{formatNumber(balanceIQD)} IQD</p>
        <p className="text-white/60 text-xs mt-1">${wallet?.balance?.toFixed(2) || '0.00'}</p>
      </div>

      {/* Transfer Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
        <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#27AE60]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>تحويل آمن ومشفر</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">اسم المستخدم أو البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                  recipientValid === true ? 'border-[#27AE60] focus:border-[#27AE60] focus:ring-[#27AE60]/20' :
                  recipientValid === false ? 'border-[#E74C3C] focus:border-[#E74C3C] focus:ring-[#E74C3C]/20' :
                  'border-[#E2E8F0] focus:border-[#00D4AA] focus:ring-[#00D4AA]/20'
                }`}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {checkingRecipient && (
                  <div className="w-4 h-4 border-2 border-[#64748B] border-t-transparent rounded-full animate-spin"></div>
                )}
                {!checkingRecipient && recipientValid === true && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#27AE60]">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {!checkingRecipient && recipientValid === false && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#E74C3C]">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                )}
              </div>
            </div>
            {recipientName && (
              <p className={`text-xs mt-2 ${recipientValid ? 'text-[#27AE60]' : 'text-[#E74C3C]'}`}>
                {recipientValid ? `✓ ${recipientName}` : recipientName}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">المبلغ (IQD)</label>
            <div className="flex">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1000"
                className="flex-1 px-4 py-3 border border-[#E2E8F0] rounded-r-lg text-sm focus:outline-none focus:border-[#00D4AA] focus:ring-2 focus:ring-[#00D4AA]/20"
              />
              <span className="px-4 py-3 bg-[#F1F5F9] border border-[#E2E8F0] border-r-0 rounded-l-lg text-sm font-medium text-[#64748B]">IQD</span>
            </div>
            {amt > 0 && <p className="text-xs text-[#64748B] mt-2">≈ ${amtUSD.toFixed(2)} USD</p>}
          </div>

          {/* Quick Amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[5000, 10000, 25000, 50000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  amt === val ? 'bg-[#00D4AA] text-[#1E3A5F]' : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                {formatNumber(val)}
              </button>
            ))}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">ملاحظة (اختياري)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أضف ملاحظة للتحويل"
              className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#00D4AA] focus:ring-2 focus:ring-[#00D4AA]/20"
            />
          </div>

          {/* Summary */}
          {amt > 0 && (
            <div className="bg-[#F8FAFC] rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">المبلغ</span>
                <span className="font-medium">{formatNumber(amt)} IQD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">المستلم</span>
                <span className="font-medium">{recipientName || recipient || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">رسوم التحويل</span>
                <span className="text-[#27AE60] font-medium">مجاني</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                <span className="text-[#64748B]">الرصيد بعد التحويل</span>
                <span className={`font-medium ${remaining >= 0 ? 'text-[#27AE60]' : 'text-[#E74C3C]'}`}>
                  {formatNumber(Math.round(remaining))} IQD
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !recipient || !amount || recipientValid !== true || amt < 1000}
            className="w-full py-3.5 bg-[#00D4AA] text-[#1E3A5F] rounded-lg font-semibold hover:bg-[#00B894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                إرسال الأموال
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 rotate-180">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-center mb-6 text-[#1E293B]">تأكيد التحويل</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">المبلغ</span>
                <span className="font-bold text-[#1E3A5F]">{formatNumber(amt)} IQD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">≈ بالدولار</span>
                <span>${amtUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">المستلم</span>
                <span className="font-medium">{recipientName || recipient}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg font-medium hover:bg-[#E2E8F0] transition-colors">إلغاء</button>
              <button onClick={confirmTransfer} className="flex-1 py-3 bg-[#00D4AA] text-[#1E3A5F] rounded-lg font-semibold hover:bg-[#00B894] transition-colors flex items-center justify-center gap-2">
                تأكيد
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 rotate-180">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
