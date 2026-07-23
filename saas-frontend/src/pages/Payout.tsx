import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import { toast } from 'react-hot-toast'

export default function Payout() {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank_transfer')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const { wallet, payouts, fetchPayouts, requestPayout } = useStore()

  useEffect(() => {
    fetchPayouts()
  }, [fetchPayouts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (amt <= 0) return toast.error('المبلغ يجب أن يكون أكبر من صفر')
    if (wallet && amt > wallet.balance) return toast.error('الرصيد غير كافٍ')
    if (!details.trim()) return toast.error('تفاصيل الدفع مطلوبة')

    setLoading(true)
    try {
      await requestPayout(amt, method, { details: details.trim() })
      toast.success('تم إرسال طلب السحب!')
      setAmount('')
      setDetails('')
      fetchPayouts()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل الطلب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">سحب الأموال</h1>
      <p className="text-slate-400 mb-6">اسحب أموالك بأي طريقة تفضلها</p>

      {/* Balance */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-blue-100 text-sm">الرصيد المتاح</p>
        <p className="text-4xl font-bold mt-1">${wallet?.balance?.toFixed(2) || '0.00'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">طلب سحب جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ (USD)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="zain_cash">زين كاش</option>
                <option value="fast_pay">فاست باي</option>
                <option value="usdt">USDT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تفاصيل الدفع</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="رقم الحساب أو الهاتف"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !amount || !details}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
            >
              {loading ? 'جاري الإرسال...' : 'طلب سحب'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">سجل السحوبات</h2>
          <div className="space-y-3">
            {payouts.length === 0 ? (
              <p className="text-gray-400 text-center py-8">لا توجد طلبات سحب</p>
            ) : (
              payouts.map((p: any) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">${p.amount?.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      p.status === 'completed' ? 'bg-green-100 text-green-700' :
                      p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {p.status === 'completed' ? 'مكتمل' : p.status === 'pending' ? 'قيد الانتظار' : 'مرفوض'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{p.paymentMethod} - {new Date(p.createdAt).toLocaleDateString('ar-IQ')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
