import { useState } from 'react'
import api from '../lib/api'
import { toast } from 'react-hot-toast'

interface OrderItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
}

interface OrderResult {
  sessionId: string
  token: string
  expiresAt: string
}

export default function CreateOrder() {
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', name: '', description: '', price: 0, quantity: 1 }
  ])
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OrderResult | null>(null)

  const formatNumber = (num: number | undefined | null) => {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      quantity: 1
    }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = Math.round(subtotal * 0.1)
  const total = subtotal + tax

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.some(item => !item.name.trim() || item.price <= 0)) {
      toast.error('أكمل جميع بيانات المنتجات')
      return
    }
    if (!customerName.trim()) {
      toast.error('أدخل اسم العميل')
      return
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      toast.error('أدخل بريد إلكتروني صحيح')
      return
    }

    setLoading(true)
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
        })),
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        subtotal,
        tax,
        total,
        currency: 'IQD',
        notes,
      }

      const { data } = await api.post('/checkout/create', orderData)
      setResult(data)
      toast.success('تم إنشاء الطلب بنجاح')
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
        <div className="text-center">
          <div className="w-16 h-16 bg-[#27AE60]/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-[#27AE60]">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-[#1E293B]">تم إنشاء الطلب</h1>
          <p className="text-[#64748B] text-sm mt-1">رقم الجلسة: {result.sessionId.slice(0, 8)}...</p>
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
            نسخ رابط الدفع
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
          <h2 className="font-semibold text-[#1E293B] mb-4">تفاصيل الطلب</h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-2 border-b border-[#E2E8F0]">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-semibold">{formatNumber(item.price * item.quantity)} IQD</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2">
              <span className="text-[#64748B]">المجموع الفرعي</span>
              <span>{formatNumber(subtotal)} IQD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">الضريبة (10%)</span>
              <span>{formatNumber(tax)} IQD</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-[#E2E8F0]">
              <span>الإجمالي</span>
              <span className="text-[#1E3A5F]">{formatNumber(total)} IQD</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
          <h2 className="font-semibold text-[#1E293B] mb-4">بيانات العميل</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">الاسم</span>
              <span>{customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">البريد</span>
              <span>{customerEmail}</span>
            </div>
            {customerPhone && (
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">الهاتف</span>
                <span>{customerPhone}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setResult(null)
            setItems([{ id: '1', name: '', description: '', price: 0, quantity: 1 }])
            setCustomerName('')
            setCustomerEmail('')
            setCustomerPhone('')
            setNotes('')
          }}
          className="w-full py-3 bg-[#F1F5F9] text-[#1E3A5F] rounded-lg font-medium hover:bg-[#E2E8F0] transition-colors"
        >
          إنشاء طلب جديد
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-[28px] font-bold text-[#1E293B]">إنشاء طلب شراء</h1>
        <p className="text-[#64748B] text-sm mt-1">أضف المنتجات وأدخل بيانات العميل</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1E293B]">المنتجات</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg text-sm font-medium hover:bg-[#00D4AA]/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                إضافة منتج
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[#64748B]">المنتج {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#E74C3C] hover:text-[#E74C3C]/80 text-sm"
                      >
                        حذف
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-[#64748B] mb-1">اسم المنتج *</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateItem(item.id, 'name', e.target.value)}
                        placeholder="اسم المنتج"
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#64748B] mb-1">الوصف</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="وصف المنتج (اختياري)"
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#64748B] mb-1">السعر (IQD) *</label>
                      <input
                        type="number"
                        value={item.price || ''}
                        onChange={e => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#64748B] mb-1">الكمية</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 rounded-lg bg-[#E2E8F0] text-[#64748B] hover:bg-[#CBD5E1] transition-colors flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-[#E2E8F0] text-[#64748B] hover:bg-[#CBD5E1] transition-colors flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {item.price > 0 && (
                    <div className="mt-3 text-left">
                      <span className="text-sm font-semibold text-[#1E3A5F]">
                        المجموع: {formatNumber(item.price * item.quantity)} IQD
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
            <h2 className="font-semibold text-[#1E293B] mb-4">بيانات العميل</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">الاسم الكامل *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="اسم العميل"
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="07XX XXX XXXX"
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">ملاحظات</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية..."
                  rows={3}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#2E5A8F] resize-none"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0] sticky top-6">
            <h2 className="font-semibold text-[#1E293B] mb-4">ملخص الطلب</h2>
            
            <div className="space-y-3 mb-4">
              {items.filter(item => item.name && item.price > 0).map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1E293B]">{item.name}</p>
                    <p className="text-xs text-[#64748B]">الكمية: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#1E3A5F]">
                    {formatNumber(item.price * item.quantity)} IQD
                  </span>
                </div>
              ))}
            </div>

            {items.some(item => item.name && item.price > 0) ? (
              <>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B]">المجموع الفرعي</span>
                    <span>{formatNumber(subtotal)} IQD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B]">الضريبة (10%)</span>
                    <span>{formatNumber(tax)} IQD</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-[#E2E8F0]">
                    <span>الإجمالي</span>
                    <span className="text-[#1E3A5F]">{formatNumber(total)} IQD</span>
                  </div>
                </div>

                <button
                  onClick={handleCreateOrder}
                  disabled={loading || items.some(item => !item.name.trim() || item.price <= 0)}
                  className="w-full py-3.5 bg-[#00D4AA] text-[#1E3A5F] rounded-lg font-semibold mt-6 hover:bg-[#00B894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      إنشاء الطلب
                    </>
                  )}
                </button>
              </>
            ) : (
              <p className="text-[#94A3B8] text-sm text-center py-4">أضف منتجاً واحداً على الأقل</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
