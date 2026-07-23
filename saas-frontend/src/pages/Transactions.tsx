import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'

export default function Transactions() {
  const { transactions, transactionTotal, fetchTransactions } = useStore()
  const [page, setPage] = useState(1)
  const limit = 20
  const totalPages = Math.ceil(transactionTotal / limit)

  useEffect(() => {
    fetchTransactions(page, limit)
  }, [page, fetchTransactions, limit])

  const isIncoming = (type: string) => ['topup', 'transfer_in', 'p2p_credit', 'refund'].includes(type)

  const txLabel = (type: string) => {
    const labels: Record<string, string> = {
      topup: 'شحن المحفظة',
      transfer_in: 'استلام',
      transfer_out: 'إرسال',
      p2p_credit: 'استلام',
      p2p_debit: 'إرسال',
      withdrawal: 'سحب',
      refund: 'استرداد',
      ai_deduction: 'استخدام AI',
    }
    return labels[type] || type
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">سجل المعاملات</h1>
      <p className="text-slate-400 mb-6">{transactionTotal} معاملة</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg">لا توجد معاملات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  isIncoming(tx.type) ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {isIncoming(tx.type) ? '↓' : '↑'}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{tx.description || txLabel(tx.type)}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString('ar-IQ')} {new Date(tx.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-left">
                  <p className={`text-lg font-bold ${isIncoming(tx.type) ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncoming(tx.type) ? '+' : '-'}${tx.amount?.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">الرصيد: ${tx.balanceAfter?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">صفحة {page} من {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-30 hover:bg-gray-200 transition-colors"
              >
                السابق
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-30 hover:bg-gray-200 transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
