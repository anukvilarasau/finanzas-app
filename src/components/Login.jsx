import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Wallet } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black tech-grid flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Wallet size={18} className="text-black" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-white text-lg leading-none">FinanzasPro</h1>
            <p className="text-xs text-zinc-600 font-mono mt-0.5">personal finance tracker</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          {sent ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-white font-mono font-semibold">// check your email</p>
              <p className="text-zinc-500 text-sm font-mono">Confirmation link sent to<br /><span className="text-zinc-300">{email}</span></p>
              <button onClick={() => { setSent(false); setMode('login') }} className="text-zinc-500 hover:text-white text-sm font-mono transition-colors">
                ← back to login
              </button>
            </div>
          ) : (
            <>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-5">
                {mode === 'login' ? '// sign in' : '// create account'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-600 font-mono mb-1.5">email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-zinc-500 placeholder:text-zinc-700 transition-colors"
                    placeholder="user@domain.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-600 font-mono mb-1.5">password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-zinc-500 placeholder:text-zinc-700 transition-colors"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                {error && <p className="text-red-500 text-xs font-mono">error: {error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-mono font-semibold py-2.5 rounded-lg transition-colors text-sm mt-1"
                >
                  {loading ? 'loading...' : mode === 'login' ? 'sign_in()' : 'register()'}
                </button>
              </form>

              <p className="text-center text-zinc-700 text-xs font-mono mt-4">
                {mode === 'login' ? 'no account?' : 'have account?'}{' '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {mode === 'login' ? 'register →' : 'sign in →'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
