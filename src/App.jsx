import { useState } from 'react'
import { LayoutDashboard, PlusCircle, Clock, Wallet } from 'lucide-react'
import { useExpenses } from './hooks/useExpenses'
import Dashboard from './components/Dashboard'
import ExpenseForm from './components/ExpenseForm'
import Timeline from './components/Timeline'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'nuevo',     label: 'Registrar Gasto', icon: PlusCircle },
  { id: 'historial', label: 'Historial',       icon: Clock },
]

export default function App() {
  const [view, setView] = useState('dashboard')
  const store = useExpenses()

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
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
                onClick={() => setView(id)}
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

        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 font-medium">Regla 50 / 30 / 20</p>
            <p className="text-xs text-slate-600 mt-1">Necesidades · Deseos · Ahorro</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {view === 'dashboard' && (
          <Dashboard
            income={store.income}
            expenses={store.expenses}
            setIncome={store.setIncome}
          />
        )}
        {view === 'nuevo' && (
          <ExpenseForm
            addExpense={store.addExpense}
            onDone={() => setView('historial')}
          />
        )}
        {view === 'historial' && (
          <Timeline
            expenses={store.expenses}
            deleteExpense={store.deleteExpense}
          />
        )}
      </main>
    </div>
  )
}
