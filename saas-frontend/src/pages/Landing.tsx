import { Link } from 'react-router-dom'
import { Wallet, Shield, Zap, ArrowRight, Lock, CreditCard, Download, BarChart3 } from 'lucide-react'

const features = [
  { icon: Wallet, title: 'محفظة إلكترونية', desc: 'أداة مالية ذكية لإدارة أموالك وتحويلها بسهولة وأمان' },
  { icon: Shield, title: 'حماية متقدمة', desc: 'تشفير بنكي وحماية من الاحتيال مع مزامنة فورية' },
  { icon: Zap, title: 'تحويل فوري', desc: 'أرسل الأموال لأي شخص في العراق في ثوانٍ معدودة' },
  { icon: CreditCard, title: 'شحن المحفظة', desc: 'شحن عبر بنك العراق، زين كاش، فاست باي، أو USDT' },
  { icon: Download, title: 'سحب الأموال', desc: 'اسحب أموالك بأي طريقة تفضلها بسهولة وأمان' },
  { icon: BarChart3, title: 'تقارير مالية', desc: 'تتبع معاملاتك و expenditures بشكل مفصل مع رسوم بيانية' },
]

const steps = [
  { num: '01', title: 'سجّل حسابك', desc: 'أنشئ حسابك المجاني في دقائق' },
  { num: '02', title: 'شحن المحفظة', desc: 'أضف أموالاً عبر بنك العراق أو زين كاش' },
  { num: '03', title: 'ابدأ التحويل', desc: 'أرسل الأموال لأي شخص بسهولة' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="border-b border-surface-lighter bg-surface-light/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Wallet size={18} className="text-primary" />
            </div>
            <span className="text-xl font-bold text-primary">bpayit <span className="text-accent">IRAQ</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-text-secondary hover:text-primary transition-colors">تسجيل الدخول</Link>
            <Link to="/register" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg font-medium transition-colors">
              افتح حسابك المجاني
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm mb-6">
          <Lock size={14} />
          حماية بنكية على معاملاتك
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight text-text">
          محفظتك الإلكترونية<br />
          <span className="text-accent">في العراق</span>
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-8">
          أرسل واستقبل الأموال بسهولة وأمان. محفظة إلكترونية عراقية تشبه PayPal
          مع دعم كامل للعملات المحلية والدولية.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold flex items-center gap-2 transition-colors">
            ابدأ الآن مجاناً <ArrowRight size={18} />
          </Link>
          <a href="#features" className="px-6 py-3 border border-surface-lighter hover:bg-surface-lighter text-text rounded-lg font-semibold transition-colors">
            اكتشف المزيد
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-surface-lighter bg-surface-light/50">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '50K+', label: 'مستخدم نشط' },
            { value: '1M+', label: 'معاملة ناجحة' },
            { value: '99.9%', label: 'وقت التشغيل' },
            { value: '<1 ثانية', label: 'وقت التحويل' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-accent">{value}</p>
              <p className="text-sm text-text-secondary mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4 text-text">لماذا bpayit IRAQ؟</h2>
        <p className="text-text-secondary text-center mb-12">الأفضل لإدارة أموالك في العراق</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-surface-light rounded-xl p-6 border border-surface-lighter hover:border-accent/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Icon size={24} className="text-accent" />
              </div>
              <h3 className="font-semibold mb-2 text-text">{title}</h3>
              <p className="text-sm text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface-light/50 border-y border-surface-lighter">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-text">كيف يعمل؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">{num}</span>
                </div>
                <h3 className="font-semibold mb-2 text-text">{title}</h3>
                <p className="text-sm text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4 text-text">ابدأ باستخدام محفظتك اليوم</h2>
        <p className="text-text-secondary mb-8">سجّل حسابك المجاني وابدأ بإدارة أموالك</p>
        <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold text-lg transition-colors">
          افتح حسابك المجاني <ArrowRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-lighter bg-surface-light/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Wallet size={18} className="text-primary" />
              </div>
              <span className="font-bold text-primary">bpayit <span className="text-accent">IRAQ</span></span>
            </div>
            <p className="text-sm text-text-muted">&copy; 2024 bpayit IRAQ. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
