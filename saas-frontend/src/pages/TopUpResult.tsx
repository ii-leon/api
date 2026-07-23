import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'

export default function TopUpResult() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [status, setStatus] = useState<'loading' | 'success' | 'failure'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('failure')
      return
    }

    // Verify the token with backend
    api.get(`/payment/zaincash/redirect?token=${token}`)
      .then((res) => {
        if (res.data.success) {
          setStatus('success')
        } else {
          setStatus('failure')
        }
      })
      .catch(() => {
        setStatus('failure')
      })
  }, [searchParams])

  return (
    <div className="max-w-md mx-auto text-center py-20">
      {status === 'loading' && (
        <div className="space-y-4">
          <Loader2 size={48} className="text-accent mx-auto animate-spin" />
          <h2 className="text-xl font-semibold">{t('topup.processing')}</h2>
          <p className="text-slate-400">{t('topup.pleaseWait')}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <CheckCircle size={64} className="text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold text-green-500">{t('topup.paymentSuccess')}</h2>
          <p className="text-slate-400">{t('topup.paymentSuccessDesc')}</p>
          <button
            onClick={() => navigate('/topup')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            {t('topup.backToTopUp')}
          </button>
        </div>
      )}

      {status === 'failure' && (
        <div className="space-y-4">
          <XCircle size={64} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-red-500">{t('topup.paymentFailed')}</h2>
          <p className="text-slate-400">{t('topup.paymentFailedDesc')}</p>
          <button
            onClick={() => navigate('/topup')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            {t('topup.tryAgain')}
          </button>
        </div>
      )}
    </div>
  )
}
