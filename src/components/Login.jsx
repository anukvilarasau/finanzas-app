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

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://finanzas-app-tau-khaki.vercel.app' }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: 'https://finanzas-app-tau-khaki.vercel.app' }
      })
      if (error) setError(error.message)
      else setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white tech-grid flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-black text-lg leading-none">FinanzasPro</h1>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">personal finance tracker</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-black font-mono font-semibold">// check your email</p>
              <p className="text-zinc-500 text-sm font-mono">Confirmation link sent to<br /><span className="text-black">{email}</span></p>
              <button onClick={() => { setSent(false); setMode('login') }} className="text-zinc-400 hover:text-black text-sm font-mono transition-colors">
                ← back to login
              </button>
            </div>
          ) : (
            <>
              <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest mb-5">
                {mode === 'login' ? '// sign in' : '// create account'}
              </p>

              <button
                type="button" onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 border border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-black font-mono text-sm py-2.5 rounded-lg transition-colors disabled:opacity-40 mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.3z"/><path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.9-6c-2.1 1.4-4.9 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.8 14.7 48 24 48z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6v-6.2H2.5C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8l8.1-6.2z"/><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.7 0 6.5 5.2 2.5 13.2l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z"/></svg>
                Continuar con Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="text-zinc-300 text-xs font-mono">o</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 font-mono mb-1.5">email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-black text-sm font-mono focus:outline-none focus:border-black placeholder:text-zinc-300 transition-colors"
                    placeholder="user@domain.com" required
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 font-mono mb-1.5">password</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-black text-sm font-mono focus:outline-none focus:border-black placeholder:text-zinc-300 transition-colors"
                    placeholder="••••••••" required minLength={6}
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-mono">error: {error}</p>}
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-black hover:bg-zinc-800 disabled:opacity-40 text-white font-mono font-semibold py-2.5 rounded-lg transition-colors text-sm mt-1"
                >
                  {loading ? 'loading...' : mode === 'login' ? 'sign_in()' : 'register()'}
                </button>
              </form>
              <p className="text-center text-zinc-400 text-xs font-mono mt-4">
                {mode === 'login' ? 'no account?' : 'have account?'}{' '}
                <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }} className="text-zinc-600 hover:text-black transition-colors">
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
