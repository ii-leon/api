import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'

const EXCHANGE_RATE = 1450

interface TransactionDetail {
  id: string
  type: string
  amount: number
  amountIqd: number
  status: string
  description: string
  createdAt: string
  referenceId?: string
  metadata?: any
  walletId?: string
  relatedUserId?: string
}

export default function Analytics() {
  const { transactions, wallet, fetchTransactions, fetchWallet } = useStore()
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'chart'>('overview')
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTransactions(1, 100), fetchWallet()])
      setLoading(false)
    }
    loadData()
  }, [fetchTransactions, fetchWallet])

  const formatNumber = (num: number | undefined | null) => {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const filterByPeriod = (txs: typeof transactions) => {
    if (period === 'all') return txs
    const days = period === '7d' ? 7 : 30
    const cutoff = new Date(Date.now() - days * 86400000)
    return txs.filter((tx) => new Date(tx.createdAt) >= cutoff)
  }

  const filtered = filterByPeriod(transactions)

  const stats = {
    totalIn: filtered.filter((tx) => ['p2p_credit', 'topup', 'refund', 'transfer_in'].includes(tx.type) && tx.status === 'completed').reduce((s, tx) => s + Math.round(tx.amount * EXCHANGE_RATE), 0),
    totalOut: filtered.filter((tx) => ['p2p_debit', 'withdrawal', 'transfer_out'].includes(tx.type) && tx.status === 'completed').reduce((s, tx) => s + Math.round(tx.amount * EXCHANGE_RATE), 0),
    transferCount: filtered.filter((tx) => ['p2p_debit', 'p2p_credit', 'transfer_in', 'transfer_out'].includes(tx.type)).length,
    topupCount: filtered.filter((tx) => tx.type === 'topup').length,
    pendingCount: filtered.filter((tx) => tx.status === 'pending').length,
    completedCount: filtered.filter((tx) => tx.status === 'completed').length,
    failedCount: filtered.filter((tx) => tx.status === 'failed').length,
  }

  const balanceIQD = wallet?.balance ? Math.round(wallet.balance * EXCHANGE_RATE) : 0
  const balanceGrowth = stats.totalIn > 0 ? ((balanceIQD / stats.totalIn) * 100 - 100).toFixed(1) : '0'
  const netBalance = stats.totalIn - stats.totalOut

  const groupByDay = () => {
    const days: Record<string, { in: number; out: number }> = {}
    const dayCount = period === '7d' ? 7 : period === '30d' ? 30 : 90
    
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days[key] = { in: 0, out: 0 }
    }

    filtered.forEach(tx => {
      const key = new Date(tx.createdAt).toISOString().split('T')[0]
      if (days[key]) {
        const amount = Math.round(tx.amount * EXCHANGE_RATE)
        if (['topup', 'p2p_credit', 'refund', 'transfer_in'].includes(tx.type)) {
          days[key].in += amount
        } else {
          days[key].out += amount
        }
      }
    })

    return Object.entries(days).map(([date, values]) => ({ date, ...values }))
  }

  const chartData = groupByDay()
  const maxVal = Math.max(...chartData.map(d => Math.max(d.in, d.out)), 1)

  const getTxType = (tx: any) => {
    if (tx.status === 'pending') return 'pending'
    if (['topup', 'p2p_credit', 'refund', 'transfer_in'].includes(tx.type)) return 'incoming'
    return 'outgoing'
  }

  const getTxLabel = (tx: any) => {
    const map: Record<string, string> = {
      topup: 'شحن المحفظة',
      transfer_in: 'تحويل وارد',
      transfer_out: 'تحويل صادر',
      p2p_credit: 'استلام',
      p2p_debit: 'إرسال',
      withdrawal: 'سحب',
      refund: 'استرداد',
    }
    return tx.description || map[tx.type] || tx.type
  }

  const getTxIcon = (type: string) => {
    if (type === 'incoming') {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
    }
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>
  }

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string; icon: string }> = {
      completed: { label: 'مكتمل', color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10', icon: '✓' },
      pending: { label: 'قيد الانتظار', color: 'text-[#F39C12]', bg: 'bg-[#F39C12]/10', icon: '⏳' },
      failed: { label: 'فشل', color: 'text-[#E74C3C]', bg: 'bg-[#E74C3C]/10', icon: '✗' },
      reversed: { label: 'معكوس', color: 'text-[#64748B]', bg: 'bg-[#64748B]/10', icon: '↺' },
    }
    return map[status] || map.pending
  }

  const getTypeConfig = (type: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      topup: { label: 'شحن', color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10' },
      transfer_in: { label: 'تحويل وارد', color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10' },
      p2p_credit: { label: 'استلام', color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10' },
      refund: { label: 'استرداد', color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10' },
      transfer_out: { label: 'تحويل صادر', color: 'text-[#E74C3C]', bg: 'bg-[#E74C3C]/10' },
      p2p_debit: { label: 'إرسال', color: 'text-[#E74C3C]', bg: 'bg-[#E74C3C]/10' },
      withdrawal: { label: 'سحب', color: 'text-[#E74C3C]', bg: 'bg-[#E74C3C]/10' },
      ai_deduction: { label: 'خصم', color: 'text-[#F39C12]', bg: 'bg-[#F39C12]/10' },
    }
    return map[type] || { label: type, color: 'text-[#64748B]', bg: 'bg-[#64748B]/10' }
  }

  const maskId = (id: string) => {
    if (!id) return '****'
    // Show first 8 chars, mask the rest (visible only to owner)
    if (id.length <= 8) return id
    return id.substring(0, 8) + '...'
  }

  const getFullDateTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const openTxDetail = (tx: any) => {
    setSelectedTx({
      ...tx,
      amountIqd: Math.round(tx.amount * EXCHANGE_RATE),
    })
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B]">الإحصائيات</h1>
          <p className="text-[#64748B] text-sm mt-1">تتبع معاملاتك وأموالك</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: '7d', label: '7 أيام' },
            { key: '30d', label: '30 يوم' },
            { key: 'all', label: 'الكل' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === key
                  ? 'bg-[#00D4AA] text-[#1E3A5F] shadow-sm'
                  : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-xl">
        {[
          { key: 'overview', label: 'نظرة عامة', icon: '📊' },
          { key: 'chart', label: 'الرسوم البيانية', icon: '📈' },
          { key: 'transactions', label: 'المعاملات', icon: '📋' },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === key ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#27AE60] to-[#219a52] rounded-xl p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
                <span className="text-xs text-white/80">إجمالي الوارد</span>
              </div>
              <p className="text-2xl font-bold">{loading ? '---' : formatNumber(stats.totalIn)}</p>
              <p className="text-[10px] text-white/60">IQD</p>
            </div>
            <div className="bg-gradient-to-br from-[#E74C3C] to-[#c0392b] rounded-xl p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>
                </div>
                <span className="text-xs text-white/80">إجمالي الصادر</span>
              </div>
              <p className="text-2xl font-bold">{loading ? '---' : formatNumber(stats.totalOut)}</p>
              <p className="text-[10px] text-white/60">IQD</p>
            </div>
            <div className="bg-gradient-to-br from-[#1E3A5F] to-[#152A45] rounded-xl p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <span className="text-xs text-white/80">صافي الرصيد</span>
              </div>
              <p className="text-2xl font-bold">{loading ? '---' : formatNumber(netBalance)}</p>
              <p className="text-[10px] text-white/60">IQD</p>
            </div>
            <div className="bg-gradient-to-br from-[#00D4AA] to-[#00B894] rounded-xl p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
                <span className="text-xs text-white/80">نمو الرصيد</span>
              </div>
              <p className="text-2xl font-bold">{loading ? '---' : `+${balanceGrowth}%`}</p>
              <p className="text-[10px] text-white/60">مقارنة بالفترة السابقة</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#27AE60]/10 rounded-lg flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#27AE60]"><polyline points="20 6 9 17 4 12"/></svg></div>
                <span className="text-xs text-[#64748B]">ناجحة</span>
              </div>
              <p className="text-2xl font-bold text-[#1E293B]">{loading ? '---' : stats.completedCount}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#F39C12]/10 rounded-lg flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#F39C12]"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                <span className="text-xs text-[#64748B]">قيد الانتظار</span>
              </div>
              <p className="text-2xl font-bold text-[#1E293B]">{loading ? '---' : stats.pendingCount}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#E74C3C]/10 rounded-lg flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#E74C3C]"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
                <span className="text-xs text-[#64748B]">فشلت</span>
              </div>
              <p className="text-2xl font-bold text-[#1E293B]">{loading ? '---' : stats.failedCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart Tab */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
            <h3 className="font-semibold text-[#1E293B] mb-6">نشاط المعاملات اليومي</h3>
            <div className="relative h-64">
              <div className="ml-12 h-full flex items-end gap-1">
                {chartData.slice(-14).map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                    <div className="w-full flex flex-col gap-0.5" style={{ height: '200px' }}>
                      <div className="w-full bg-[#27AE60] rounded-t" style={{ height: `${(d.in / maxVal) * 100}%`, minHeight: d.in > 0 ? '4px' : '0' }}/>
                      <div className="w-full bg-[#E74C3C] rounded-b" style={{ height: `${(d.out / maxVal) * 100}%`, minHeight: d.out > 0 ? '4px' : '0' }}/>
                    </div>
                    <span className="text-[9px] text-[#94A3B8] mt-2">{new Date(d.date).toLocaleDateString('ar', { day: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#27AE60] rounded"></div><span className="text-sm text-[#64748B]">وارد</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#E74C3C] rounded"></div><span className="text-sm text-[#64748B]">صادر</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0]">
            <h3 className="font-semibold text-[#1E293B]">جميع المعاملات ({filtered.length})</h3>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {loading ? (
              <div className="p-12 text-center"><div className="w-12 h-12 border-4 border-[#E2E8F0] border-t-[#00D4AA] rounded-full animate-spin mx-auto mb-4"></div><p className="text-[#64748B] text-sm">جاري التحميل...</p></div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center"><p className="text-[#64748B] text-lg">لا توجد معاملات</p></div>
            ) : (
              filtered.map((tx) => {
                const type = getTxType(tx)
                const typeConf = getTypeConfig(tx.type)
                return (
                  <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={() => openTxDetail(tx)}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${typeConf.bg} ${typeConf.color}`}>
                      {getTxIcon(type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E293B] truncate">{getTxLabel(tx)}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{new Date(tx.createdAt).toLocaleDateString('ar')} • {new Date(tx.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-left">
                      <span className={`text-sm font-bold block ${type === 'incoming' ? 'text-[#27AE60]' : 'text-[#E74C3C]'}`}>
                        {type === 'incoming' ? '+' : '-'}{formatNumber(Math.round(tx.amount * EXCHANGE_RATE))} IQD
                      </span>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#94A3B8]"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTx(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`p-6 rounded-t-2xl ${getTypeConfig(selectedTx.type).bg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeConfig(selectedTx.type).bg} ${getTypeConfig(selectedTx.type).color}`}>
                  {getTxIcon(getTxType(selectedTx))}
                </div>
                <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-black/5 rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#64748B]"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <h3 className="text-xl font-bold text-[#1E293B]">{getTxLabel(selectedTx)}</h3>
              <p className={`text-2xl font-bold mt-2 ${getTxType(selectedTx) === 'incoming' ? 'text-[#27AE60]' : 'text-[#E74C3C]'}`}>
                {getTxType(selectedTx) === 'incoming' ? '+' : '-'}{formatNumber(selectedTx.amountIqd)} IQD
              </p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-sm text-[#64748B]">الحالة</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusConfig(selectedTx.status).color} ${getStatusConfig(selectedTx.status).bg}`}>
                  {getStatusConfig(selectedTx.status).icon} {getStatusConfig(selectedTx.status).label}
                </span>
              </div>

              {/* Type */}
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-sm text-[#64748B]">نوع العملية</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeConfig(selectedTx.type).color} ${getTypeConfig(selectedTx.type).bg}`}>
                  {getTypeConfig(selectedTx.type).label}
                </span>
              </div>

              {/* Transaction ID */}
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-sm text-[#64748B]">رقم العملية</span>
                <span className="text-sm font-mono text-[#1E3A5F]">{maskId(selectedTx.id)}</span>
              </div>

              {/* Wallet ID - Secure Display */}
              {selectedTx.walletId && (
                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                  <span className="text-sm text-[#64748B]">رقم المحفظة</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-[#1E3A5F]">{maskId(selectedTx.walletId)}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#27AE60]">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* Related User ID */}
              {selectedTx.relatedUserId && (
                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                  <span className="text-sm text-[#64748B]">المستخدم المرتبط</span>
                  <span className="text-sm font-mono text-[#1E3A5F]">{maskId(selectedTx.relatedUserId)}</span>
                </div>
              )}

              {/* Reference ID - Hidden for security */}
              {/* {selectedTx.referenceId && ( */}
              {/* <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg"> */}
              {/*   <span className="text-sm text-[#64748B]">رقم المرجع</span> */}
              {/*   <span className="text-sm font-mono text-[#1E3A5F]">{selectedTx.referenceId}</span> */}
              {/* </div> */}
              {/* )} */}

              {/* Amounts */}
              <div className="p-3 bg-[#F8FAFC] rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#64748B]">المبلغ بالدولار</span>
                  <span className="text-sm font-semibold">${selectedTx.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#64748B]">المبلغ بالدينار</span>
                  <span className="text-sm font-semibold">{formatNumber(selectedTx.amountIqd)} IQD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#64748B]">سعر الصرف</span>
                  <span className="text-sm">1 USD = {EXCHANGE_RATE} IQD</span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="p-3 bg-[#F8FAFC] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#64748B]"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span className="text-sm font-medium text-[#1E293B]">التاريخ والوقت</span>
                </div>
                <p className="text-sm text-[#64748B] mr-6">{getFullDateTime(selectedTx.createdAt)}</p>
              </div>

              {/* Description */}
              {selectedTx.description && (
                <div className="p-3 bg-[#F8FAFC] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#64748B]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span className="text-sm font-medium text-[#1E293B]">الوصف</span>
                  </div>
                  <p className="text-sm text-[#64748B] mr-6">{selectedTx.description}</p>
                </div>
              )}

              {/* Metadata - Visible to owner only */}
              {selectedTx.metadata && Object.keys(selectedTx.metadata).length > 0 && (
                <div className="p-3 bg-[#F8FAFC] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#64748B]"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span className="text-sm font-medium text-[#1E293B]">تفاصيل إضافية</span>
                    <span className="text-[10px] text-[#27AE60] bg-[#27AE60]/10 px-2 py-0.5 rounded">خاص بك فقط</span>
                  </div>
                  <div className="space-y-1 mr-6">
                    {Object.entries(selectedTx.metadata)
                      .filter(([key]) => !['redirectUrl', 'token', 'password', 'secret', 'apiKey'].includes(key.toLowerCase()))
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-[#64748B]">{key}</span>
                          <span className="text-[#1E3A5F] font-mono">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button onClick={() => setSelectedTx(null)} className="w-full py-3 bg-[#F1F5F9] text-[#1E3A5F] rounded-lg font-medium hover:bg-[#E2E8F0] transition-colors">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
