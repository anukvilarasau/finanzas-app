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

  const navigate = (id) => { setView(id); setMenuOpen(false) }

  if (authLoading) return <div className="min-h-screen bg-black" />
  if (!user) return <Login />

  const sidebar = (
    <>
      <div className="p-5 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <Wallet size={16} className="text-black" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-white text-sm leading-none tracking-tight">FinanzasPro</h1>
            <p className="text-xs text-zinc-600 mt-0.5 font-mono">v2.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-zinc-900">
        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-3 text-center mb-2">
          <p className="text-xs text-zinc-600 font-mono">50 / 30 / 20</p>
          <p className="text-xs text-zinc-700 mt-0.5 font-mono">NEEDS · WANTS · SAVE</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-700 hover:text-zinc-300 hover:bg-zinc-900 transition-all font-mono"
        >
          <LogOut size={13} />
          sign out
        </button>
      </div>
    </>
  )

  const content = store.loading ? (
    <div className="flex items-center justify-center h-full">
      <p className="text-zinc-700 text-sm font-mono">loading_data...</p>
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
    <div className="flex h-screen bg-black text-white overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-zinc-950 border-r border-zinc-900 flex-col shrink-0">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/80 z-20 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col z-30 transition-transform duration-300 md:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-zinc-600 hover:text-white">
          <X size={18} />
        </button>
        {sidebar}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-zinc-950 border-b border-zinc-900 shrink-0">
          <button onClick={() => setMenuOpen(true)} className="text-zinc-500 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <Wallet size={12} className="text-black" />
            </div>
            <span className="font-mono font-bold text-white text-sm">FinanzasPro</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto tech-grid">
          {content}
        </main>
      </div>
    </div>
  )
}
