import { useEffect, useState } from 'react'
import api from '../lib/api'
import { toast } from 'react-hot-toast'

interface Order {
  id: string
  sessionId: string
  merchantName: string
  amount: number | string
  amountIqd: number | string
  currency: string
  description: string
  orderId: string
  items: Array<{ name: string; price: number; quantity: number }>
  subtotal: number | string
  tax: number | string
  total: number | string
  customer: { name: string; email: string; phone?: string }
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  paymentId?: string
  token?: string
  createdAt: string
  paidAt?: string
}

type FilterType = 'all' | 'pending' | 'completed' | 'failed' | 'expired'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/checkout/orders')
      setOrders(data.orders || data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number | undefined | null) => {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const formatDate = (date: string) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string; icon: string }> = {
      pending: { label: 'قيد الانتظار', color: 'text-[#F39C12]', bg: 'bg-[#F39C12]/10', icon: '⏳' },
      processing: { label: 'قيد المعالجة', color: 'text-[#3498DB]', bg: 'bg-[#3498DB]/10', icon: '🔄' },
      completed: { label: 'مدفوع', color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10', icon: '✓' },
      failed: { label: 'فشل', color: 'text-[#E74C3C]', bg: 'bg-[#E74C3C]/10', icon: '✗' },
      expired: { label: 'منتهي', color: 'text-[#64748B]', bg: 'bg-[#64748B]/10', icon: '⏰' },
    }
    return map[status] || map.pending
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    failed: orders.filter(o => o.status === 'failed' || o.status === 'expired').length,
    totalRevenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.amountIqd || 0), 0),
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('تم النسخ')
    setTimeout(() => setCopied(false), 2000)
  }

  const getOrderNumber = (order: Order) => {
    return order.sessionId?.slice(0, 8) || order.id?.slice(0, 8) || '---'
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B]">طلباتي</h1>
          <p className="text-[#64748B] text-sm mt-1">{orders.length} طلب إجمالي</p>
        </div>
        <a
          href="/create-order"
          className="px-5 py-2.5 bg-[#00D4AA] text-[#1E3A5F] rounded-lg font-semibold hover:bg-[#00B894] transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          طلب جديد
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#1E3A5F]/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#1E3A5F]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span className="text-[11px] text-[#64748B]">الإجمالي</span>
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#F39C12]/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#F39C12]">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span className="text-[11px] text-[#64748B]">قيد الانتظار</span>
          </div>
          <p className="text-2xl font-bold text-[#F39C12]">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#27AE60]/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#27AE60]">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span className="text-[11px] text-[#64748B]">مدفوع</span>
          </div>
          <p className="text-2xl font-bold text-[#27AE60]">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00D4AA]/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#00D4AA]">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span className="text-[11px] text-[#64748B]">الإيرادات</span>
          </div>
          <p className="text-lg font-bold text-[#00D4AA]">{formatNumber(stats.totalRevenue)} <span className="text-xs font-normal">IQD</span></p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'الكل', count: stats.total },
          { key: 'pending', label: 'قيد الانتظار', count: stats.pending },
          { key: 'completed', label: 'مدفوع', count: stats.completed },
          { key: 'failed', label: 'فشل/منتهي', count: stats.failed },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterType)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? 'bg-[#1E3A5F] text-white shadow-sm'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:border-[#CBD5E1]'
            }`}
          >
            {label}
            <span className="mr-1.5 text-xs opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-[#E2E8F0] border-t-[#00D4AA] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#64748B]">جاري تحميل الطلبات...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-[#94A3B8]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className="text-[#64748B] text-lg mb-2">لا توجد طلبات بعد</p>
            <p className="text-[#94A3B8] text-sm mb-6">ابدأ بإنشاء طلب شراء جديد</p>
            <a
              href="/create-order"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00D4AA] text-[#1E3A5F] rounded-lg font-semibold hover:bg-[#00B894] transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              إنشاء طلب جديد
            </a>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filteredOrders.map(order => {
              const status = getStatusConfig(order.status)
              const totalAmount = Number(order.amountIqd || order.total || 0)
              return (
                <div
                  key={order.id}
                  className="p-5 hover:bg-[#F8FAFC] transition-colors cursor-pointer border-b border-[#E2E8F0] last:border-b-0"
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Top Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1E3A5F]/10 rounded-lg flex items-center justify-center text-[#1E3A5F] font-bold text-sm">
                        #{getOrderNumber(order)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1E293B]">{order.merchantName || 'طلب شراء'}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-[#1E3A5F]">{formatNumber(totalAmount)} <span className="text-sm font-normal">IQD</span></p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-[#64748B]">
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="8.5" cy="7" r="4"/>
                        </svg>
                        {order.customer?.name || 'عميل'}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                        {order.items?.length || 0} منتج
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && order.token && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(`${window.location.origin}/pay/${order.token}`)
                          }}
                          className="px-3 py-1.5 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg text-xs font-medium hover:bg-[#00D4AA]/20 transition-colors flex items-center gap-1"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                          نسخ الرابط
                        </button>
                      )}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#94A3B8]">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E2E8F0] bg-gradient-to-r from-[#1E3A5F] to-[#152A45] text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">تفاصيل الطلب</h3>
                  <p className="text-white/70 text-sm mt-1">رقم الطلب: #{getOrderNumber(selectedOrder)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusConfig(selectedOrder.status).bg}`}>
                  <span>{getStatusConfig(selectedOrder.status).icon}</span>
                  <span className={`font-medium ${getStatusConfig(selectedOrder.status).color}`}>
                    {getStatusConfig(selectedOrder.status).label}
                  </span>
                </div>
                <div className="text-left text-sm text-[#64748B]">
                  <p>{formatDate(selectedOrder.createdAt)}</p>
                  {selectedOrder.paidAt && <p className="text-[#27AE60]">تم الدفع: {formatDate(selectedOrder.paidAt)}</p>}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-[#F8FAFC] rounded-xl p-5">
                <h4 className="font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#1E3A5F]">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  بيانات العميل
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-1">الاسم</p>
                    <p className="font-medium text-[#1E293B]">{selectedOrder.customer?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-1">البريد الإلكتروني</p>
                    <p className="font-medium text-[#1E293B]">{selectedOrder.customer?.email || '—'}</p>
                  </div>
                  {selectedOrder.customer?.phone && (
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-1">الهاتف</p>
                      <p className="font-medium text-[#1E293B]">{selectedOrder.customer.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#1E3A5F]">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                  المنتجات
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items?.length > 0 ? selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1E3A5F]/10 rounded-lg flex items-center justify-center text-[#1E3A5F] font-bold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium text-[#1E293B]">{item.name}</p>
                          <p className="text-xs text-[#94A3B8]">الكمية: {item.quantity} × {formatNumber(item.price)} IQD</p>
                        </div>
                      </div>
                      <span className="font-bold text-[#1E3A5F]">{formatNumber(item.price * item.quantity)} IQD</span>
                    </div>
                  )) : (
                    <p className="text-[#94A3B8] text-center py-4">لا توجد منتجات</p>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-xl p-5">
                <h4 className="font-semibold text-[#1E293B] mb-4">ملخص الطلب</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B]">المجموع الفرعي</span>
                    <span className="font-medium">{formatNumber(Number(selectedOrder.subtotal || 0))} IQD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B]">الضريبة (10%)</span>
                    <span className="font-medium">{formatNumber(Number(selectedOrder.tax || 0))} IQD</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-3 border-t border-[#E2E8F0]">
                    <span>الإجمالي</span>
                    <span className="text-[#1E3A5F]">{formatNumber(Number(selectedOrder.amountIqd || selectedOrder.total || 0))} IQD</span>
                  </div>
                </div>
              </div>

              {/* Payment Link */}
              {selectedOrder.status === 'pending' && selectedOrder.token && (
                <div className="bg-[#00D4AA]/5 border border-[#00D4AA]/20 rounded-xl p-4">
                  <h4 className="font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#00D4AA]">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    رابط الدفع
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/pay/${selectedOrder.token}`}
                      readOnly
                      className="flex-1 px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E3A5F] font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/pay/${selectedOrder.token}`)}
                      className="px-5 py-3 bg-[#00D4AA] text-[#1E3A5F] rounded-lg text-sm font-semibold hover:bg-[#00B894] transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      )}
                      نسخ
                    </button>
                  </div>
                </div>
              )}

              {/* Payment ID */}
              {selectedOrder.paymentId && (
                <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl">
                  <span className="text-sm text-[#64748B]">رقم المعاملة</span>
                  <span className="font-mono text-sm text-[#1E3A5F]">{selectedOrder.paymentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
