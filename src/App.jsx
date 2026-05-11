import { useState, useEffect } from 'react'
import { LayoutDashboard, PlusCircle, Clock, Wallet, LogOut, Menu, X } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useExpenses } from './hooks/useExpenses'
import Dashboard from './components/Dashboard'
import ExpenseForm from './components/ExpenseForm'
import Timeline from './components/Timeline'
import Login from './components/Login'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'nuevo',     label: 'Registrar Gasto', icon: PlusCircle },
  { id: 'historial', label: 'Historial',       icon: Clock },
]

export default function App() {
  const [view, setView] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const store = useExpenses(user?.id)

  const navigate = (id) => {
    setView(id)
    setMenuOpen(false)
  }

  if (authLoading) return <div className="min-h-screen bg-slate-900" />
  if (!user) return <Login />

  const sidebar = (
    <>
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Wallet size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base leading-none">FinanzasPro</h1>
            <p className="text-xs text-slate-400 mt-0.5">Control inteligente</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        <div className="bg-slate-700/50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 font-medium">Regla 50 / 30 / 20</p>
          <p className="text-xs text-slate-600 mt-1">Necesidades · Deseos · Ahorro</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-all"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  const content = store.loading ? (
    <div className="flex items-center justify-center h-full">
      <div className="text-slate-500 text-sm">Cargando datos...</div>
    </div>
  ) : (
    <>
      {view === 'dashboard' && (
        <Dashboard income={store.income} expenses={store.expenses} budgetRules={store.budgetRules} setIncome={store.setIncome} setBudgetRules={store.setBudgetRules} />
      )}
      {view === 'nuevo' && (
        <ExpenseForm addExpense={store.addExpense} onDone={() => navigate('historial')} />
      )}
      {view === 'historial' && (
        <Timeline expenses={store.expenses} deleteExpense={store.deleteExpense} />
      )}
    </>
  )

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-slate-800 border-r border-slate-700 flex-col shrink-0">
        {sidebar}
      </aside>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-800 border-r border-slate-700 flex flex-col z-30 transition-transform duration-300 md:hidden ${
        menuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100"
        >
          <X size={20} />
        </button>
        {sidebar}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
          <button onClick={() => setMenuOpen(true)} className="text-slate-400 hover:text-slate-100">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-100 text-sm">FinanzasPro</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {content}
        </main>
      </div>
    </div>
  )
}
