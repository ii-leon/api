import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { Link } from 'react-router-dom'

const EXCHANGE_RATE = 1450

export default function Dashboard() {
  const { wallet, transactions, fetchWallet, fetchTransactions, user } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchWallet(), fetchTransactions(1, 10)])
      setLoading(false)
    }
    loadData()
  }, [fetchWallet, fetchTransactions])

  const formatNumber = (num: number | undefined | null) => {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const balanceIQD = wallet?.balance ? Math.round(wallet.balance * EXCHANGE_RATE) : 0
  const balanceDisplay = formatNumber(balanceIQD)

  const recentTransactions = transactions.slice(0, 5)

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthTransactions = transactions.filter(tx => {
    const d = new Date(tx.createdAt)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const stats = {
    transfersThisMonth: thisMonthTransactions.filter(tx =>
      ['p2p_debit', 'p2p_credit', 'transfer_in', 'transfer_out'].includes(tx.type)
    ).length,
    totalIn: transactions
      .filter(tx => ['topup', 'p2p_credit', 'refund', 'transfer_in'].includes(tx.type) && tx.status === 'completed')
      .reduce((sum, tx) => sum + Math.round(tx.amount * EXCHANGE_RATE), 0),
    totalOut: transactions
      .filter(tx => ['p2p_debit', 'withdrawal', 'transfer_out'].includes(tx.type) && tx.status === 'completed')
      .reduce((sum, tx) => sum + Math.round(tx.amount * EXCHANGE_RATE), 0),
    topupCount: thisMonthTransactions.filter(tx => tx.type === 'topup').length,
  }

  const getTxType = (tx: any) => {
    if (tx.status === 'pending') return 'pending'
    if (['topup', 'p2p_credit', 'refund', 'transfer_in'].includes(tx.type)) return 'incoming'
    return 'outgoing'
  }

  const getTxLabel = (tx: any) => {
    const map: Record<string, string> = {
      topup: 'شحن المحفظة', transfer_in: 'تحويل وارد', transfer_out: 'تحويل صادر',
      p2p_credit: 'استلام', p2p_debit: 'إرسال', withdrawal: 'سحب', refund: 'استرداد',
    }
    return tx.description || map[tx.type] || tx.type
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Welcome Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B]">مرحباً، {user?.fullName || user?.username || 'المستخدم'}</h1>
          <p className="text-[#64748B] text-sm mt-1">إدارة أموالك بسهولة وأمان</p>
        </div>
        <button className="relative bg-white border border-[#E2E8F0] rounded-lg p-3 hover:bg-[#F1F5F9] transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#64748B]">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="absolute top-2 left-2 w-2 h-2 bg-[#E74C3C] rounded-full border-2 border-white"></span>
        </button>
      </header>

      {/* Balance Card */}
      <section>
        <div className="bg-gradient-to-br from-[#1E3A5F] to-[#152A45] rounded-2xl p-8 text-white shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/80 text-sm">الرصيد المتاح</span>
            <div className="flex items-center gap-2 bg-[#00D4AA]/20 px-3 py-1.5 rounded-full text-xs text-[#00D4AA]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>مؤمن</span>
            </div>
          </div>
          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-lg text-white/70">IQD</span>
            <span className="text-[42px] font-bold tracking-tight">{loading ? '---' : balanceDisplay}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
            <span>${wallet?.balance?.toFixed(2) || '0.00'}</span>
            {wallet?.isFrozen && (
              <span className="bg-[#E74C3C]/30 text-white px-2 py-0.5 rounded text-xs">مجمدة</span>
            )}
          </div>
          <div className="flex gap-3">
            <Link to="/topup" className="flex items-center gap-2 bg-[#00D4AA] text-[#1E3A5F] px-6 py-3 rounded-lg font-semibold hover:bg-[#00B894] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              إيداع
            </Link>
            <Link to="/topup" className="flex items-center gap-2 bg-white/15 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/25 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              شحن
            </Link>
            <Link to="/transfer" className="flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <path d="M7 23l-4-4 4-4"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              تحويل
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#27AE60]/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#27AE60]">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div>
              <span className="text-[24px] font-bold text-[#1E293B] block">{loading ? '---' : stats.transfersThisMonth}</span>
              <span className="text-[13px] text-[#64748B]">تحويل هذا الشهر</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#27AE60]/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#27AE60]">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div>
              <span className="text-[24px] font-bold text-[#1E293B] block">{loading ? '---' : formatNumber(stats.totalIn)}</span>
              <span className="text-[13px] text-[#64748B]">إجمالي الوارد (IQD)</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F39C12]/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#F39C12]">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div>
              <span className="text-[24px] font-bold text-[#1E293B] block">{loading ? '---' : stats.topupCount}</span>
              <span className="text-[13px] text-[#64748B]">شحن هذا الشهر</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-[#1E293B]">آخر المعاملات</h2>
          <Link to="/analytics" className="text-[#2E5A8F] text-sm font-medium hover:text-[#1E3A5F]">عرض الكل</Link>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 border-4 border-[#E2E8F0] border-t-[#00D4AA] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#64748B] text-sm">جاري التحميل...</p>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 text-[#94A3B8] mx-auto mb-3">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <p className="text-[#64748B] text-sm">لا توجد معاملات بعد</p>
              <p className="text-[#94A3B8] text-xs mt-1">ابدأ بإيداع أو تحويل أموال</p>
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const type = getTxType(tx)
              return (
                <div key={tx.id} className="flex items-center gap-4 py-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    type === 'incoming' ? 'bg-[#27AE60]/10 text-[#27AE60]' :
                    type === 'pending' ? 'bg-[#F39C12]/10 text-[#F39C12]' :
                    'bg-[#E74C3C]/10 text-[#E74C3C]'
                  }`}>
                    {type === 'incoming' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M17 1l4 4-4 4"/>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[#1E293B] truncate">{getTxLabel(tx)}</span>
                      {tx.status === 'pending' && (
                        <span className="px-1.5 py-0.5 bg-[#F39C12]/15 text-[#F39C12] text-[10px] rounded font-medium shrink-0">قيد الانتظار</span>
                      )}
                    </div>
                    <span className="text-[#94A3B8] text-xs block mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString('ar')} - {new Date(tx.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`font-semibold text-[15px] shrink-0 ${
                    type === 'incoming' ? 'text-[#27AE60]' :
                    type === 'pending' ? 'text-[#F39C12]' :
                    'text-[#E74C3C]'
                  }`}>
                    {type === 'incoming' ? '+' : type === 'pending' ? '' : '-'}{formatNumber(Math.round(tx.amount * EXCHANGE_RATE))} IQD
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
