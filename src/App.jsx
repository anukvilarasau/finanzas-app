import { useState, useEffect } from 'react'
import { LayoutDashboard, PlusCircle, TrendingUp, Clock, Wallet, LogOut, Menu, X } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useExpenses } from './hooks/useExpenses'
import Dashboard from './components/Dashboard'
import ExpenseForm from './components/ExpenseForm'
import IncomeForm from './components/IncomeForm'
import Timeline from './components/Timeline'
import Login from './components/Login'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'nuevo',     label: 'Registrar Gasto',   icon: PlusCircle },
  { id: 'ingreso',   label: 'Registrar Ingreso', icon: TrendingUp },
  { id: 'historial', label: 'Historial',          icon: Clock },
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

  if (authLoading) return <div className="min-h-screen bg-white" />
  if (!user) return <Login />

  const sidebar = (
    <>
      <div className="p-5 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-black text-sm leading-none tracking-tight">FinanzasPro</h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">v2.0</p>
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
                  ? 'bg-black text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-black'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-zinc-200">
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center mb-2">
          <p className="text-xs text-zinc-400 font-mono">50 / 30 / 20</p>
          <p className="text-xs text-zinc-300 mt-0.5 font-mono">NEEDS · WANTS · SAVE</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all font-mono"
        >
          <LogOut size={13} />
          sign out
        </button>
      </div>
    </>
  )

  const content = store.loading ? (
    <div className="flex items-center justify-center h-full">
      <p className="text-zinc-400 text-sm font-mono">loading_data...</p>
    </div>
  ) : (
    <>
      {view === 'dashboard' && (
        <Dashboard
          incomes={store.incomes}
          expenses={store.expenses}
          budgetRules={store.budgetRules}
          savingsConfirmations={store.savingsConfirmations}
          setBudgetRules={store.setBudgetRules}
          confirmSavings={store.confirmSavings}
          unconfirmSavings={store.unconfirmSavings}
          onNavigate={navigate}
        />
      )}
      {view === 'nuevo' && (
        <ExpenseForm addExpense={store.addExpense} />
      )}
      {view === 'ingreso' && (
        <IncomeForm addIncome={store.addIncome} />
      )}
      {view === 'historial' && (
        <Timeline
          expenses={store.expenses}
          incomes={store.incomes}
          budgetRules={store.budgetRules}
          deleteExpense={store.deleteExpense}
          deleteIncome={store.deleteIncome}
        />
      )}
    </>
  )

  return (
    <div className="flex h-screen bg-white text-black overflow-hidden">

      <aside className="hidden md:flex w-56 bg-white border-r border-zinc-200 flex-col shrink-0">
        {sidebar}
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-zinc-200 flex flex-col z-30 transition-transform duration-300 md:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-black">
          <X size={18} />
        </button>
        {sidebar}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-200 shrink-0">
          <button onClick={() => setMenuOpen(true)} className="text-zinc-400 hover:text-black">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
              <Wallet size={12} className="text-white" />
            </div>
            <span className="font-mono font-bold text-black text-sm">FinanzasPro</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-zinc-50/60">
          {content}
        </main>
      </div>
    </div>
  )
}
