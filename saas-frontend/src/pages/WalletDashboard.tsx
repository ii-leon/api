import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const EXCHANGE_RATE = 1450

type FilterType = 'all' | 'income' | 'expense' | 'pending'

export default function WalletDashboard() {
  const { wallet, transactions, fetchWallet, fetchTransactions, user } = useStore()
  const [showBalance, setShowBalance] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [copying, setCopying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage] = useState(1)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchWallet(), fetchTransactions(currentPage, 10)])
      setLoading(false)
    }
    loadData()
  }, [fetchWallet, fetchTransactions, currentPage])

  const formatNumber = (num: number | undefined | null) => {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const balanceIQD = wallet?.balance ? Math.round(wallet.balance * EXCHANGE_RATE) : 0

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === 'income') return ['topup', 'p2p_credit', 'refund', 'transfer_in'].includes(tx.type)
    if (activeFilter === 'expense') return ['p2p_debit', 'withdrawal', 'transfer_out', 'ai_deduction'].includes(tx.type)
    if (activeFilter === 'pending') return tx.status === 'pending'
    return true
  })

  const stats = {
    totalIn: transactions.filter((tx) => ['p2p_credit', 'topup', 'refund', 'transfer_in'].includes(tx.type) && tx.status === 'completed').reduce((sum, tx) => sum + Math.round(tx.amount * EXCHANGE_RATE), 0),
    totalOut: transactions.filter((tx) => ['p2p_debit', 'withdrawal', 'transfer_out'].includes(tx.type) && tx.status === 'completed').reduce((sum, tx) => sum + Math.round(tx.amount * EXCHANGE_RATE), 0),
    pendingCount: transactions.filter((tx) => tx.status === 'pending').length,
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopying(true)
    toast.success('تم نسخ رقم المحفظة')
    setTimeout(() => setCopying(false), 2000)
  }

  const getTxType = (tx: any) => {
    if (tx.status === 'pending') return 'pending'
    if (['topup', 'p2p_credit', 'refund', 'transfer_in'].includes(tx.type)) return 'incoming'
    return 'outgoing'
  }

  const getTxLabel = (tx: any) => {
    const map: Record<string, string> = {
      topup: 'شحن المحفظة', transfer_in: 'تحويل وارد', transfer_out: 'تحويل صادر',
      p2p_credit: 'استلام', p2p_debit: 'إرسال', withdrawal: 'سحب',
      refund: 'استرداد', ai_deduction: 'خصم', admin_adjustment: 'تعديل',
    }
    return tx.description || map[tx.type] || tx.type
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'income', label: 'الوارد' },
    { key: 'expense', label: 'الصادر' },
    { key: 'pending', label: 'قيد الانتظار' },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B]">محفظتي</h1>
          <p className="text-[#64748B] text-sm mt-1">مرحباً {user?.fullName || user?.username}</p>
        </div>
        <button onClick={() => fetchWallet().then(() => fetchTransactions(currentPage, 10))} className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#00D4AA]/30 transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#64748B]">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#152A45] to-[#00D4AA] rounded-2xl p-6 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 border border-white/20 rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="text-white/70 text-xs">الرصيد الحالي</p>
                <p className="text-[10px] text-white/50">{wallet?.currency || 'USD'}</p>
              </div>
            </div>
            <button onClick={() => setShowBalance(!showBalance)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
              {showBalance ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              )}
            </button>
          </div>
          <div className="mb-4">
            {showBalance ? (
              <p className="text-3xl font-bold tracking-tight">{formatNumber(balanceIQD)} <span className="text-lg text-white/70">IQD</span></p>
            ) : (
              <p className="text-3xl font-bold tracking-tight">••••••</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => wallet?.userId && copyToClipboard(wallet.userId)} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-xs backdrop-blur-sm">
              {copying ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              )}
              <span>نسخ رقم المحفظة</span>
            </button>
            {wallet?.isFrozen && (
              <span className="px-2 py-1 bg-[#E74C3C]/30 rounded text-xs font-medium">مجمدة</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { to: '/transfer', icon: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z', label: 'إرسال', color: 'text-[#1E3A5F] bg-[#1E3A5F]/10' },
          { to: '/topup', icon: 'M12 5v14M5 12h14', label: 'شحن', color: 'text-[#27AE60] bg-[#27AE60]/10' },
          { to: '/analytics', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', label: 'الإحصائيات', color: 'text-[#00D4AA] bg-[#00D4AA]/10' },
          { to: '/settings', icon: 'M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z', label: 'المزيد', color: 'text-[#64748B] bg-[#F1F5F9]' },
        ].map(({ to, icon, label, color }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2 py-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#00D4AA]/30 transition-all group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-105 transition-transform`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d={icon}/>
              </svg>
            </div>
            <span className="text-xs font-medium text-[#64748B] group-hover:text-[#1E293B] transition-colors">{label}</span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#27AE60]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#27AE60]">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
            </div>
            <span className="text-[11px] text-[#64748B]">الوارد</span>
          </div>
          <p className="text-lg font-bold text-[#27AE60]">+{formatNumber(stats.totalIn)}</p>
          <p className="text-[10px] text-[#94A3B8]">IQD</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#E74C3C]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#E74C3C]">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              </svg>
            </div>
            <span className="text-[11px] text-[#64748B]">الصادر</span>
          </div>
          <p className="text-lg font-bold text-[#E74C3C]">-{formatNumber(stats.totalOut)}</p>
          <p className="text-[10px] text-[#94A3B8]">IQD</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#F39C12]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#F39C12]">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span className="text-[11px] text-[#64748B]">قيد الانتظار</span>
          </div>
          <p className="text-lg font-bold text-[#F39C12]">{stats.pendingCount}</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-[#1E293B]">آخر المعاملات</h3>
            <Link to="/analytics" className="text-xs text-[#00D4AA] hover:text-[#00B894] transition-colors">عرض الكل</Link>
          </div>
          <div className="flex items-center gap-2">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === key ? 'bg-[#00D4AA]/15 text-[#00D4AA]' : 'text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {loading ? (
            <div className="p-8 text-center"><div className="w-12 h-12 border-4 border-[#E2E8F0] border-t-[#00D4AA] rounded-full animate-spin mx-auto"></div></div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-[#64748B] text-sm">لا توجد معاملات</div>
          ) : (
            filteredTransactions.map((tx) => {
              const type = getTxType(tx)
              return (
                <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    type === 'incoming' ? 'bg-[#27AE60]/10 text-[#27AE60]' :
                    type === 'pending' ? 'bg-[#F39C12]/10 text-[#F39C12]' :
                    'bg-[#E74C3C]/10 text-[#E74C3C]'
                  }`}>
                    {type === 'incoming' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#1E293B] truncate">{getTxLabel(tx)}</p>
                      {tx.status === 'pending' && (
                        <span className="px-1.5 py-0.5 bg-[#F39C12]/15 text-[#F39C12] text-[10px] rounded font-medium">قيد الانتظار</span>
                      )}
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString('ar')} • {new Date(tx.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className={`text-sm font-bold shrink-0 ${type === 'incoming' ? 'text-[#27AE60]' : type === 'pending' ? 'text-[#F39C12]' : 'text-[#E74C3C]'}`}>
                    {type === 'incoming' ? '+' : type === 'pending' ? '' : '-'}{formatNumber(Math.round(tx.amount * EXCHANGE_RATE))} IQD
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
