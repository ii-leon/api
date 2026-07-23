import { useEffect, useState } from 'react'
import api from '../lib/api'
import { toast } from 'react-hot-toast'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  metadata: any
  isRead: boolean
  createdAt: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  const formatNumber = (num: number | undefined | null) => {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
      toast.success('تم تحديد الكل كمقروء')
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/delete`)
      setNotifications(notifications.filter(n => n.id !== id))
      setSelectedNotification(null)
      toast.success('تم الحذف')
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'الآن'
    if (minutes < 60) return `منذ ${minutes} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    return `منذ ${days} يوم`
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      login: '🔐',
      logout: '🚪',
      transfer_sent: '📤',
      transfer_received: '📥',
      topup: '💰',
      topup_success: '✅',
      topup_failed: '❌',
      withdrawal: '💸',
      payment: '💳',
      security: '🛡️',
      system: '⚙️',
    }
    return icons[type] || '📢'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      login: 'bg-[#3498DB]/10 text-[#3498DB]',
      logout: 'bg-[#95A5A6]/10 text-[#95A5A6]',
      transfer_sent: 'bg-[#E74C3C]/10 text-[#E74C3C]',
      transfer_received: 'bg-[#27AE60]/10 text-[#27AE60]',
      topup: 'bg-[#F39C12]/10 text-[#F39C12]',
      topup_success: 'bg-[#27AE60]/10 text-[#27AE60]',
      topup_failed: 'bg-[#E74C3C]/10 text-[#E74C3C]',
      withdrawal: 'bg-[#E74C3C]/10 text-[#E74C3C]',
      payment: 'bg-[#00D4AA]/10 text-[#00D4AA]',
      security: 'bg-[#9B59B6]/10 text-[#9B59B6]',
      system: 'bg-[#64748B]/10 text-[#64748B]',
    }
    return colors[type] || 'bg-[#64748B]/10 text-[#64748B]'
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B]">الإشعارات</h1>
          <p className="text-[#64748B] text-sm mt-1">{unreadCount} إشعار غير مقروء</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="px-4 py-2 bg-[#F1F5F9] text-[#1E3A5F] rounded-lg text-sm font-medium hover:bg-[#E2E8F0] transition-colors">
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-[#E2E8F0] border-t-[#00D4AA] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#64748B] text-sm">جاري التحميل...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <p className="text-[#64748B] text-lg">لا توجد إشعارات</p>
            <p className="text-[#94A3B8] text-sm mt-1">ستظهر هنا جميع الأنشطة على حسابك</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer ${!notification.isRead ? 'bg-[#00D4AA]/5' : ''}`}
                onClick={() => { setSelectedNotification(notification); markAsRead(notification.id) }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-[#1E293B]">{notification.title}</p>
                      {!notification.isRead && <span className="w-2 h-2 bg-[#00D4AA] rounded-full"></span>}
                    </div>
                    <p className="text-xs text-[#64748B] mt-1 truncate">{notification.message}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-1">{formatTime(notification.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedNotification(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[80vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`p-6 rounded-t-2xl ${getTypeColor(selectedNotification.type)}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{getTypeIcon(selectedNotification.type)}</span>
                <button onClick={() => setSelectedNotification(null)} className="p-2 hover:bg-black/5 rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#64748B]">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <h3 className="text-lg font-bold text-[#1E293B]">{selectedNotification.title}</h3>
              <p className="text-sm text-[#64748B] mt-1">{selectedNotification.message}</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Time */}
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-sm text-[#64748B]">الوقت</span>
                <span className="text-sm font-medium">{formatTime(selectedNotification.createdAt)}</span>
              </div>

              {/* Full Date */}
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-sm text-[#64748B]">التاريخ والوقت</span>
                <span className="text-sm font-medium">
                  {new Date(selectedNotification.createdAt).toLocaleDateString('ar-EG', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </span>
              </div>

              {/* Type */}
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                <span className="text-sm text-[#64748B]">النوع</span>
                <span className="text-sm font-medium">{selectedNotification.title}</span>
              </div>

              {/* Metadata Details */}
              {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                <>
                  <div className="border-t border-[#E2E8F0] pt-4">
                    <h4 className="text-sm font-semibold text-[#1E293B] mb-3">التفاصيل</h4>
                  </div>
                  
                  {selectedNotification.metadata.ip && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">عنوان IP</span>
                      <span className="text-sm font-mono text-[#1E3A5F]">{selectedNotification.metadata.ip}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.country && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">الدولة</span>
                      <span className="text-sm font-medium">{selectedNotification.metadata.country}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.city && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">المدينة</span>
                      <span className="text-sm font-medium">{selectedNotification.metadata.city}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.browser && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">المتصفح</span>
                      <span className="text-sm font-medium">{selectedNotification.metadata.browser}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.os && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">نظام التشغيل</span>
                      <span className="text-sm font-medium">{selectedNotification.metadata.os}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.device && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">الجهاز</span>
                      <span className="text-sm font-medium">{selectedNotification.metadata.device}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.userAgent && (
                    <div className="p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B] block mb-2">معلومات الجهاز</span>
                      <p className="text-xs text-[#1E3A5F] font-mono break-all">{selectedNotification.metadata.userAgent}</p>
                    </div>
                  )}

                  {selectedNotification.metadata.amount && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">المبلغ</span>
                      <span className="text-sm font-bold text-[#1E3A5F]">{formatNumber(selectedNotification.metadata.amount)} {selectedNotification.metadata.currency || 'IQD'}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.recipientUsername && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">المستلم</span>
                      <span className="text-sm font-medium">{selectedNotification.metadata.recipientUsername}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.senderUsername && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">المرسل</span>
                      <span className="text-sm font-medium">{selectedNotification.metadata.senderUsername}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.transactionId && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">رقم المعاملة</span>
                      <span className="text-sm font-mono text-[#1E3A5F]">{selectedNotification.metadata.transactionId}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.paymentMethod && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">طريقة الدفع</span>
                      <span className="text-sm font-medium">{selectedNotification.metadata.paymentMethod}</span>
                    </div>
                  )}

                  {selectedNotification.metadata.status && (
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <span className="text-sm text-[#64748B]">الحالة</span>
                      <span className="text-sm font-medium">{selectedNotification.metadata.status}</span>
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="flex-1 py-3 bg-[#F1F5F9] text-[#1E3A5F] rounded-lg font-medium hover:bg-[#E2E8F0] transition-colors"
                >
                  إغلاق
                </button>
                <button
                  onClick={() => deleteNotification(selectedNotification.id)}
                  className="px-4 py-3 bg-[#E74C3C]/10 text-[#E74C3C] rounded-lg font-medium hover:bg-[#E74C3C]/20 transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
