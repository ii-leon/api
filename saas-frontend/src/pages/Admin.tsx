import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useStore } from '../lib/store'
import { toast } from 'react-hot-toast'
import { Users, Coins, Activity, Shield, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalBalance: number
  pendingPayouts: number
  totalTransactions: number
}

interface PayoutRequest {
  id: string
  userId: string
  amount: number
  amountIqd: number
  paymentMethod: string
  status: string
  referenceNumber: string | null
  createdAt: string
}

export default function Admin() {
  const { user } = useStore()
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalBalance: 0, pendingPayouts: 0, totalTransactions: 0 })
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [statsRes, payoutsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { totalUsers: 0, totalBalance: 0, pendingPayouts: 0, totalTransactions: 0 } })),
        api.get('/admin/payouts').catch(() => ({ data: [] })),
      ])
      setStats(statsRes.data)
      setPayouts(payoutsRes.data)
    } catch (err) {
      console.error('Admin fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handlePayoutAction = async (id: string, action: 'completed' | 'rejected') => {
    setProcessingId(id)
    try {
      await api.patch(`/admin/payouts/${id}`, { status: action })
      toast.success(`Payout ${action}`)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setProcessingId(null)
    }
  }

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Shield size={48} className="mb-4" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm mt-1">You need admin privileges to access this page</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary-light" />
      </div>
    )
  }

  const pendingPayouts = payouts.filter((p) => p.status === 'pending')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-light rounded-xl p-5 border border-surface-lighter">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2"><Users size={16} /> Total Users</div>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-surface-light rounded-xl p-5 border border-surface-lighter">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2"><Coins size={16} className="text-accent" /> Total Balance</div>
          <p className="text-2xl font-bold text-accent">${stats.totalBalance.toFixed(2)}</p>
        </div>
        <div className="bg-surface-light rounded-xl p-5 border border-surface-lighter">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2"><Clock size={16} className="text-warning" /> Pending Payouts</div>
          <p className="text-2xl font-bold text-warning">{stats.pendingPayouts}</p>
        </div>
        <div className="bg-surface-light rounded-xl p-5 border border-surface-lighter">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2"><Activity size={16} /> Transactions</div>
          <p className="text-2xl font-bold">{stats.totalTransactions}</p>
        </div>
      </div>

      {/* Pending Payouts */}
      <div className="bg-surface-light rounded-xl border border-surface-lighter">
        <div className="p-5 border-b border-surface-lighter">
          <h2 className="font-semibold flex items-center gap-2"><Clock size={18} className="text-warning" /> Pending Payout Requests ({pendingPayouts.length})</h2>
        </div>
        <div className="divide-y divide-surface-lighter">
          {pendingPayouts.length === 0 ? (
            <p className="p-5 text-slate-500 text-sm">No pending payout requests</p>
          ) : (
            pendingPayouts.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">${p.amount.toFixed(2)}</span>
                    <span className="text-xs text-slate-400">{p.paymentMethod}</span>
                    {p.referenceNumber && <span className="text-xs text-slate-500">Ref: {p.referenceNumber}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(p.createdAt).toLocaleString()} · ID: {p.id.substring(0, 8)}...
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePayoutAction(p.id, 'completed')}
                    disabled={processingId === p.id}
                    className="px-3 py-1.5 bg-success/10 border border-success/30 text-success rounded-lg text-sm hover:bg-success/20 transition-colors flex items-center gap-1"
                  >
                    {processingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handlePayoutAction(p.id, 'rejected')}
                    disabled={processingId === p.id}
                    className="px-3 py-1.5 bg-danger/10 border border-danger/30 text-danger rounded-lg text-sm hover:bg-danger/20 transition-colors flex items-center gap-1"
                  >
                    {processingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* All Payouts */}
      <div className="bg-surface-light rounded-xl border border-surface-lighter">
        <div className="p-5 border-b border-surface-lighter">
          <h2 className="font-semibold">All Payout Requests ({payouts.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-surface-lighter">
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Method</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-lighter">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-surface-lighter/50">
                  <td className="p-4 font-medium">${p.amount.toFixed(2)}</td>
                  <td className="p-4 text-slate-300">{p.paymentMethod}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'completed' ? 'bg-success/10 text-success' :
                      p.status === 'rejected' ? 'bg-danger/10 text-danger' :
                      p.status === 'processing' ? 'bg-primary/10 text-primary-light' :
                      'bg-warning/10 text-warning'
                    }`}>{p.status}</span>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-500 font-mono text-xs">{p.id.substring(0, 8)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
