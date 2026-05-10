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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Wallet size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-xl">FinanzasPro</h1>
            <p className="text-xs text-slate-400">Control inteligente</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-emerald-400 font-semibold mb-2">Revisá tu email</p>
              <p className="text-slate-400 text-sm">Te mandamos un link de confirmación a <span className="text-slate-200">{email}</span>. Hacé click en el link y después volvé acá.</p>
              <button onClick={() => { setSent(false); setMode('login') }} className="mt-4 text-emerald-400 text-sm hover:text-emerald-300">
                Volver al login
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-slate-100 font-semibold text-lg mb-5">
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
                </button>
              </form>

              <p className="text-center text-slate-500 text-sm mt-4">
                {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
