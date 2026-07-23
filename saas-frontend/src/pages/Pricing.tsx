import { Link } from 'react-router-dom'
import { Check, Zap, Info } from 'lucide-react'

const plans = [
  {
    name: 'Pay As You Go',
    desc: 'Perfect for occasional use',
    price: null,
    creditRate: '$0.01 per credit',
    features: [
      'No minimum purchase',
      'Pay only for what you use',
      'All AI models available',
      'Basic support',
      'Standard rate limits',
    ],
  },
  {
    name: 'Starter',
    price: 10,
    credits: 1000,
    creditRate: '$0.010 per credit',
    savings: null,
    features: [
      '1,000 credits included',
      'All AI models available',
      'Email support',
      'Standard rate limits',
      'Transaction history',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: 50,
    credits: 6000,
    creditRate: '$0.0083 per credit',
    savings: 'Save 17%',
    features: [
      '6,000 credits included',
      'All AI models available',
      'Priority support',
      'Higher rate limits',
      'Usage analytics',
      'API access',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 200,
    credits: 30000,
    creditRate: '$0.0067 per credit',
    savings: 'Save 33%',
    features: [
      '30,000 credits included',
      'All AI models available',
      'Dedicated support',
      'Custom rate limits',
      'Advanced analytics',
      'Full API access',
      'Admin panel',
      'Custom integrations',
    ],
    popular: false,
  },
]

const tokenCosts = [
  { model: 'MiMo V2.5', input: '$0.002 / 1K tokens', output: '$0.006 / 1K tokens', note: 'Recommended for general use' },
  { model: 'MiMo V2.5 Turbo', input: '$0.001 / 1K tokens', output: '$0.003 / 1K tokens', note: 'Faster, lower quality' },
  { model: 'MiMo V2.5 Pro', input: '$0.005 / 1K tokens', output: '$0.015 / 1K tokens', note: 'Highest quality' },
]

export default function Pricing() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Pricing Plans</h1>
        <p className="text-slate-400 max-w-xl mx-auto">Choose the plan that fits your needs. All plans include access to all AI models.</p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(({ name, price, credits, creditRate, savings, features, popular, desc }) => (
          <div key={name} className={`bg-surface-light rounded-xl p-5 border ${popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-surface-lighter'} relative flex flex-col`}>
            {popular && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-0.5 rounded-full font-medium">Popular</div>}
            {savings && <div className="absolute -top-2.5 right-3 bg-success/20 text-success text-xs px-2 py-0.5 rounded-full">{savings}</div>}
            <h3 className="font-semibold">{name}</h3>
            {desc && <p className="text-xs text-slate-400 mt-1">{desc}</p>}
            <div className="my-4">
              {price !== null ? (
                <div>
                  <span className="text-3xl font-bold">${price}</span>
                  <span className="text-slate-400 text-sm"> / {credits?.toLocaleString()} credits</span>
                </div>
              ) : (
                <span className="text-2xl font-bold">Custom</span>
              )}
              <p className="text-xs text-accent mt-1">{creditRate}</p>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                  <Check size={12} className="text-success shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/register" className={`block text-center py-2 rounded-lg text-sm font-medium transition-colors ${popular ? 'bg-primary hover:bg-primary-dark text-white' : 'bg-surface-lighter hover:bg-surface-lighter/80 text-white'}`}>
              Get Started
            </Link>
          </div>
        ))}
      </div>

      {/* Token Costs */}
      <div className="bg-surface-light rounded-xl p-6 border border-surface-lighter">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Zap size={18} className="text-warning" /> Token Pricing (per request)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-surface-lighter">
                <th className="pb-3 font-medium">Model</th>
                <th className="pb-3 font-medium">Input</th>
                <th className="pb-3 font-medium">Output</th>
                <th className="pb-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-lighter">
              {tokenCosts.map(({ model, input, output, note }) => (
                <tr key={model}>
                  <td className="py-3 font-medium">{model}</td>
                  <td className="py-3 text-slate-300">{input}</td>
                  <td className="py-3 text-slate-300">{output}</td>
                  <td className="py-3 text-slate-400 text-xs">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-surface-light rounded-xl p-6 border border-surface-lighter">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Info size={18} /> Frequently Asked Questions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">How are credits consumed?</p>
            <p className="text-slate-400 mt-1">Each AI request consumes credits based on the number of tokens used (input + output). The exact cost depends on the model you choose.</p>
          </div>
          <div>
            <p className="font-medium">Do credits expire?</p>
            <p className="text-slate-400 mt-1">No, credits never expire. They remain in your wallet until you use them.</p>
          </div>
          <div>
            <p className="font-medium">Can I get a refund?</p>
            <p className="text-slate-400 mt-1">Credits are non-refundable once purchased. If an AI request fails, credits are automatically refunded to your wallet.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
