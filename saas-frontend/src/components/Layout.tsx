import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import api from '../lib/api'

export default function Layout() {
  const { user, wallet, logout, fetchWallet, fetchMe } = useStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchMe()
    fetchWallet()
    fetchUnreadCount()
  }, [fetchMe, fetchWallet])

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.count)
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const navItems = [
    { to: '/', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10', label: 'الرئيسية' },
    { to: '/wallet', icon: 'M1 4h22v16H1z M1 10h22', label: 'المحفظة' },
    { to: '/transfer', icon: 'M17 1l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3', label: 'التحويلات' },
    { to: '/topup', icon: 'M12 5v14 M5 12h14', label: 'شحن المحفظة' },
  ]

  const secondaryItems = [
    { to: '/analytics', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', label: 'الإحصائيات' },
    { to: '/orders', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6', label: 'طلباتي' },
    { to: '/notifications', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', label: 'الإشعارات', badge: unreadCount },
    { to: '/settings', icon: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.37a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.37a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.37a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.37a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4', label: 'الإعدادات' },
  ]

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00D4AA] rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#1E3A5F]">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-white">bpayit <span className="text-[#00D4AA]">IRAQ</span></span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[11px] text-white/40 uppercase tracking-wider px-3 mb-2">القائمة الرئيسية</p>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#00D4AA] text-[#1E3A5F]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d={icon}/>
            </svg>
            {label}
          </NavLink>
        ))}

        <div className="pt-6 pb-2">
          <p className="text-[11px] text-white/40 uppercase tracking-wider px-3">الحساب</p>
        </div>
        {secondaryItems.map(({ to, icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#00D4AA] text-[#1E3A5F]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d={icon}/>
              </svg>
              {badge && badge > 0 && to === '/notifications' && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#E74C3C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-6 pb-2">
              <p className="text-[11px] text-white/40 uppercase tracking-wider px-3">الإدارة</p>
            </div>
            <NavLink
              to="/admin"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#F39C12] text-[#1E3A5F]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              لوحة الإدارة
            </NavLink>
          </>
        )}
      </nav>

      {/* Wallet Balance & User */}
      <div className="p-4 border-t border-white/10">
        {wallet && (
          <div className="bg-gradient-to-r from-[#1E3A5F]/50 to-[#00D4AA]/50 rounded-xl p-4 mb-3">
            <p className="text-white/70 text-[11px] mb-1">الرصيد الحالي</p>
            <p className="text-xl font-bold text-[#00D4AA]">${wallet.balance.toFixed(2)}</p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#00D4AA] text-[#1E3A5F] rounded-full flex items-center justify-center text-sm font-bold shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.username}</p>
            <p className="text-[12px] text-white/50 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-white/50 hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 rounded-lg transition-colors" title="تسجيل الخروج">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[#F8FAFC]" dir="rtl">
      <Toaster position="top-left" toastOptions={{ style: { background: '#1E3A5F', color: '#fff', border: '1px solid #2E5A8F', borderRadius: '12px' } }} />

      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-[#F1F5F9] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#1E293B]">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00D4AA] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#1E3A5F]">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold text-[#1E3A5F]">bpayit <span className="text-[#00D4AA]">IRAQ</span></span>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity" onClick={closeSidebar} />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[280px] bg-[#1E3A5F] flex-col">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-[280px] bg-[#1E3A5F] flex flex-col transform transition-transform duration-300 ease-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex justify-end p-4">
          <button onClick={closeSidebar} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:p-0 pt-14">
        <div className="max-w-5xl mx-auto p-5 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
