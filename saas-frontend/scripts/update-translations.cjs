const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

// Read English as source
const enPath = path.join(localesDir, 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Language configs
const languages = {
  ar: { name: 'العربية', dir: 'rtl', translations: {
    nav: { dashboard: 'الرئيسية', transfer: 'تحويل أموال', topup: 'شحن المحفظة', analytics: 'الإحصائيات', profile: 'الملف الشخصي', settings: 'الإعدادات', admin: 'لوحة الإدارة', logout: 'تسجيل الخروج', mainMenu: 'القائمة الرئيسية', account: 'الحساب' },
    settings: { title: 'الإعدادات', security: 'الأمان', twoFactor: 'المصادقة الثنائية', twoFactorDesc: 'أضف طبقة إضافية من الأمان لحسابك', twoFactorEnabled: 'مفعل', twoFactorDisabled: 'معطل', apiKeys: 'مفاتيح API', apiKeysDesc: 'إدارة مفاتيح API للتكاملات الخارجية', manage: 'إدارة', activeSessions: 'الجلسات النشطة', activeSessionsDesc: 'عرض وإلغاء جلسات تسجيل الدخول النشطة', viewAll: 'عرض الكل', notifications: 'الإشعارات', emailNotifications: 'إشعارات البريد الإلكتروني', emailNotificationsDesc: 'استلام تنبيهات عبر البريد للمعاملات والأحداث الأمنية', pushNotifications: 'الإشعارات الفورية', pushNotificationsDesc: 'استلام إشعارات فورية في المتصفح', appearance: 'المظهر', darkMode: 'الوضع الداكن', darkModeDesc: 'التبديل بين المظهر الداكن والفاتح', language: 'اللغة', languageDesc: 'اختر لغتك المفضلة', dangerZone: 'منطقة الخطر', deleteAccount: 'حذف الحساب', deleteAccountDesc: 'حذف حسابك وجميع البيانات نهائياً', deleteConfirm: 'اكتب DELETE للتأكيد:', cancel: 'إلغاء', close: 'إغلاق', create: 'إنشاء', newKeyName: 'اسم المفتاح الجديد', noApiKeys: 'لا توجد مفاتيح API', revoke: 'إلغاء', revokeAll: 'إلغاء جميع الجلسات', noSessions: 'لا توجد جلسات نشطة', settingUpdated: 'تم تحديث الإعداد بنجاح', settingFailed: 'فشل تحديث الإعداد', languageUpdated: 'تم تحديث اللغة', languageFailed: 'فشل تحديث اللغة', keyCreated: 'تم إنشاء المفتاح بنجاح', keyCopied: 'تم نسخ المفتاح', keyDeleted: 'تم حذف المفتاح', sessionRevoked: 'تم إلغاء الجلسة', sessionsRevoked: 'تم إلغاء جميع الجلسات', twoFactorEnabledSuccess: 'تم تفعيل المصادقة الثنائية', twoFactorDisabledSuccess: 'تم تعطيل المصادقة الثنائية', twoFactorFailed: 'فشل تغيير حالة المصادقة الثنائية', accountDeleted: 'تم حذف الحساب' },
    dashboard: { welcome: 'مرحباً', overview: 'نظرة عامة على محفظتك', currentBalance: 'الرصيد الحالي', frozen: 'محظور', sendMoney: 'إرسال أموال', topUpWallet: 'شحن المحفظة', totalIn: 'إجمالي الوارد', totalOut: 'إجمالي الصادر', recentTransactions: 'آخر المعاملات', noTransactions: 'لا توجد معاملات بعد', viewAll: 'عرض الكل', paymentSuccess: 'تم شحن المحفظة بنجاح!', paymentFailed: 'فشل الدفع. حاول مرة أخرى.', paymentError: 'خطأ في معالجة الدفع' },
    transfer: { title: 'تحويل أموال', desc: 'أرسل الأموال لأي مستخدم بسهولة وأمان', protected: 'محمي بمعاملات ذرية ومنع القيود المزدوجة', recipient: 'اسم المستخدم المستلم', recipientPlaceholder: 'اسم المستخدم', amount: 'المبلغ (USD)', availableBalance: 'الرصيد المتاح', sendMoney: 'إرسال الأموال', confirmTitle: 'تأكيد التحويل', confirm: 'تأكيد', sending: 'جاري الإرسال...', sentSuccess: 'تم إرسال ${{amount}} إلى {{name}}', failed: 'فشل التحويل', maxLimit: 'الحد الأقصى للتحويل هو $10,000', insufficient: 'الرصيد غير كافٍ', invalidAmount: 'المبلغ يجب أن يكون أكبر من صفر', enterValidUser: 'يرجى إدخال مستخدم صحيح', selfTransfer: 'لا يمكن التحويل لنفسك', userNotFound: 'المستخدم غير موجود', remaining: 'الرصيد المتبقي' },
    topup: { title: 'شحن المحفظة', desc: 'اختر طريقة الدفع المناسبة', zainCash: 'زين كاش', fastPay: 'فاست باي', bankTransfer: 'تحويل بنكي', usdt: 'USDT', mockPayment: 'دفع تجريبي', mockDesc: 'هذا الدفع تجريبي ولفحص النظام فقط', amount: 'المبلغ (د.ع)', amountUsd: 'المبلغ (USD)', approxUsd: '≈ ${{amount}} دولار', payViaZainCash: 'الدفع عبر زين كاش', payViaFastPay: 'الدفع عبر فاست باي', confirmTransfer: 'تأكيد التحويل', creatingPayment: 'جاري إنشاء رابط الدفع...', paymentCreated: 'تم إنشاء رابط الدفع', openZainCash: 'فتح زين كاش', openFastPay: 'فتح فاست باي', autoConfirm: 'سيتم تأكيد الشحن تلقائياً بعد الدفع', bankName: 'بنك الرافدين', accountNumber: 'رقم الحساب', exchangeRate: 'سعر الصرف', referenceNumber: 'رقم المرجع', copied: 'تم النسخ!', createDeposit: 'إنشاء عنوان الإيداع', sendAmount: 'أرسل {{amount}} USDT', depositAddress: 'عنوان الإيداع (TRC20)', autoConfirmUSDT: 'سيتم تأكيد الشحن تلقائياً بعد 확인 المعاملة', testTopUp: 'شحن تجريبي فوري', minimumAmount: 'الحد الأدنى هو 1,000 د.ع' },
    profile: { title: 'إعدادات الملف الشخصي', personalInfo: 'المعلومات الشخصية', fullName: 'الاسم الكامل', fullNamePlaceholder: 'اسمك الكامل', email: 'البريد الإلكتروني', emailCannotChange: 'لا يمكن تغيير البريد الإلكتروني', username: 'اسم المستخدم', usernameCannotChange: 'لا يمكن تغيير اسم المستخدم', saveChanges: 'حفظ التغييرات', profileUpdated: 'تم تحديث الملف الشخصي!', updateFailed: 'فشل التحديث', changePassword: 'تغيير كلمة المرور', currentPassword: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة', confirmPassword: 'تأكيد كلمة المرور الجديدة', passwordChanged: 'تم تغيير كلمة المرور!', passwordFailed: 'فشل تغيير كلمة المرور', passwordMismatch: 'كلمتا المرور غير متطابقتين', passwordMinLength: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل', joined: 'انضم' },
    analytics: { title: 'الإحصائيات', last7days: 'آخر 7 أيام', last30days: 'آخر 30 يوم', allTime: 'كل الوقت', currentBalance: 'الرصيد الحالي', totalReceived: 'إجمالي المستلم', totalSpent: 'إجمالي المصروف', aiSpending: 'مصروفات الذكاء الاصطناعي', requests: '{{count}} طلبات', transfers: 'التحويلات', p2pTransactions: 'معاملات P2P', topUps: 'الشحنات', depositRequests: 'طلبات الإيداع', dailyActivity: 'النشاط اليومي', noData: 'لا توجد بيانات لهذه الفترة', received: 'المستلم', spent: 'المصروف', transactionBreakdown: 'تفاصيل المعاملات', aiUsage: 'استخدام الذكاء الاصطناعي' },
    auth: { login: 'تسجيل الدخول', register: 'إنشاء حساب', email: 'البريد الإلكتروني', password: 'كلمة المرور', username: 'اسم المستخدم', fullName: 'الاسم الكامل', noAccount: 'ليس لديك حساب؟', hasAccount: 'لديك حساب بالفعل؟', loginSuccess: 'تم تسجيل الدخول بنجاح!', registerSuccess: 'تم التسجيل بنجاح!', loginFailed: 'فشل تسجيل الدخول', registerFailed: 'فشل التسجيل' },
    common: { save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', loading: 'جاري التحميل...', error: 'خطأ', success: 'نجاح', copied: 'تم النسخ!', confirm: 'تأكيد', back: 'رجوع' }
  }},
  ku: { name: 'کوردی', dir: 'rtl', translations: null },
  tr: { name: 'Türkçe', dir: 'ltr', translations: null },
  fa: { name: 'فارسی', dir: 'rtl', translations: null },
  fr: { name: 'Français', dir: 'ltr', translations: null },
  de: { name: 'Deutsch', dir: 'ltr', translations: null },
  zh: { name: '中文', dir: 'ltr', translations: null },
  ja: { name: '日本語', dir: 'ltr', translations: null },
  ko: { name: '한국어', dir: 'ltr', translations: null },
  es: { name: 'Español', dir: 'ltr', translations: null },
  pt: { name: 'Português', dir: 'ltr', translations: null },
  ru: { name: 'Русский', dir: 'ltr', translations: null },
  hi: { name: 'हिन्दी', dir: 'ltr', translations: null }
};

// Deep merge: fills missing keys from source, keeps existing translations
function deepMerge(source, existing) {
  const result = {};
  for (const key of Object.keys(source)) {
    if (existing && existing[key] !== undefined) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(source[key], existing[key] || {});
      } else {
        result[key] = existing[key];
      }
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Process each language
for (const [code, config] of Object.entries(languages)) {
  const filePath = path.join(localesDir, `${code}.json`);
  let existing = {};
  
  try {
    existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    console.log(`Creating new file: ${code}.json`);
  }
  
  // If we have hardcoded translations, use them; otherwise merge from English
  const merged = config.translations 
    ? deepMerge(en, config.translations)
    : deepMerge(en, existing);
  
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
  console.log(`Updated: ${code}.json`);
}

console.log('\nAll translation files updated!');
