import { useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Edit3, X, DollarSign, Settings, Plus, Trash2, PiggyBank } from 'lucide-react'
import { getMonthExpenses, fmt } from '../utils/finance'

const PRESET_COLORS = [
  '#000000','#52525b','#a1a1aa','#10b981','#3b82f6',
  '#a855f7','#f59e0b','#ec4899','#f97316','#06b6d4','#84cc16','#ef4444',
]

export default function Dashboard({ income, expenses, budgetRules, setIncome, setBudgetRules }) {
  const [editingIncome, setEditingIncome] = useState(false)
  const [incomeInput, setIncomeInput] = useState('')
  const [editingBudget, setEditingBudget] = useState(false)

  const now = new Date()
  const monthExpenses = getMonthExpenses(expenses, now.getFullYear(), now.getMonth())
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)

  const savingsRule = budgetRules.find(r => r.trackAs === 'savings')
  const savingsPct = savingsRule?.pct ?? 0
  const savingsTarget = income * (savingsPct / 100)
  const spendBudget = income - savingsTarget
  const remaining = income - totalSpent

  const isOverspending = income > 0 && totalSpent > spendBudget
  const isLowSavings = income > 0 && remaining < savingsTarget

  const handleSaveIncome = () => {
    if (incomeInput && Number(incomeInput) > 0) {
      setIncome(Number(incomeInput))
      setEditingIncome(false)
      setIncomeInput('')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">// overview</p>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 min-w-52 shadow-sm">
          {editingIncome ? (
            <div className="flex gap-2 items-center">
              <span className="text-zinc-400 font-mono text-sm">$</span>
              <input
                autoFocus type="number" placeholder="0" value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveIncome()}
                className="flex-1 bg-zinc-50 text-black rounded-lg px-3 py-1.5 text-sm font-mono outline-none border border-zinc-200 focus:border-black w-32 transition-colors"
              />
              <button onClick={handleSaveIncome} className="bg-black hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-sm font-mono font-semibold transition-colors">OK</button>
              <button onClick={() => setEditingIncome(false)} className="text-zinc-400 hover:text-black"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-mono mb-1">ingreso_mensual</p>
                <p className="text-xl font-mono font-bold text-black">{income > 0 ? fmt(income) : '—'}</p>
              </div>
              <button onClick={() => { setEditingIncome(true); setIncomeInput(income > 0 ? String(income) : '') }} className="text-zinc-400 hover:text-black transition-colors">
                <Edit3 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {income > 0 && (isOverspending || isLowSavings) && (
        <div className="space-y-2">
          {isOverspending && (
            <div className="border border-black rounded-xl p-4 flex items-center gap-3 bg-white shadow-sm">
              <AlertTriangle className="text-black shrink-0" size={17} />
              <div>
                <p className="text-black font-mono text-sm font-semibold">overspending_detected()</p>
                <p className="text-zinc-500 text-xs font-mono mt-0.5">
                  Gastaste {fmt(totalSpent)} de un presupuesto de {fmt(spendBudget)} — excedido por {fmt(totalSpent - spendBudget)}
                </p>
              </div>
            </div>
          )}
          {isLowSavings && (
            <div className="border border-zinc-300 rounded-xl p-4 flex items-center gap-3 bg-white shadow-sm">
              <TrendingDown className="text-zinc-500 shrink-0" size={17} />
              <div>
                <p className="text-black font-mono text-sm font-semibold">low_savings_warning()</p>
                <p className="text-zinc-500 text-xs font-mono mt-0.5">
                  Te quedan {fmt(remaining)} pero tu meta es ahorrar {fmt(savingsTarget)} ({savingsPct}%). Reducí gastos para llegar.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="gastos_mes"
          value={fmt(totalSpent)}
          sub={income > 0 ? `${((totalSpent/income)*100).toFixed(0)}%_ingreso` : '—'}
          icon={<TrendingDown className="text-zinc-400" size={15} />}
          valueColor={isOverspending ? 'text-black' : 'text-black'}
        />
        <StatCard
          label="presupuesto_gastos"
          value={income > 0 ? fmt(spendBudget) : '—'}
          sub={income > 0 ? `${100 - savingsPct}%_del_ingreso` : '—'}
          icon={<DollarSign className="text-zinc-400" size={15} />}
          valueColor="text-black"
        />
        <StatCard
          label="restante_mes"
          value={income > 0 ? fmt(Math.max(0, remaining)) : '—'}
          sub={income > 0 ? (remaining >= savingsTarget ? 'en_meta ✓' : `deficit: ${fmt(Math.max(0, savingsTarget - remaining))}`) : '—'}
          icon={<TrendingUp className={income > 0 && remaining >= savingsTarget ? 'text-black' : 'text-zinc-300'} size={15} />}
          valueColor={income > 0 && remaining >= savingsTarget ? 'text-black' : 'text-zinc-400'}
        />
      </div>

      {/* Investment target */}
      {income > 0 && savingsPct > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shrink-0">
            <PiggyBank size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest mb-1">// inversion_mensual</p>
            <p className="text-2xl font-mono font-bold text-black">{fmt(savingsTarget)}</p>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {savingsPct}% de tu ingreso · {remaining >= savingsTarget ? `ya cubierto con ${fmt(remaining)} restante` : `te faltan ${fmt(Math.max(0, savingsTarget - remaining))}`}
            </p>
          </div>
          {remaining >= savingsTarget
            ? <CheckCircle className="text-black shrink-0" size={20} />
            : <AlertTriangle className="text-zinc-300 shrink-0" size={20} />
          }
        </div>
      )}

      {/* Spending bar */}
      {income > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest mb-1">// budget_distribution</p>
              <h3 className="text-sm font-semibold text-black">Distribución del ingreso</h3>
            </div>
            {!editingBudget && (
              <button onClick={() => setEditingBudget(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-black font-mono transition-colors">
                <Settings size={12} />edit
              </button>
            )}
          </div>

          {editingBudget ? (
            <BudgetEditor rules={budgetRules} onSave={(rules) => { setBudgetRules(rules); setEditingBudget(false) }} onCancel={() => setEditingBudget(false)} />
          ) : (
            <div className="space-y-4">
              {budgetRules.filter(r => r.trackAs !== 'savings').map(rule => {
                const target = income * (rule.pct / 100)
                return (
                  <div key={rule.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-mono">{rule.label} ({rule.pct}%)</span>
                      <span className="text-zinc-400 font-mono">meta: {fmt(target)}</span>
                    </div>
                    <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${rule.pct}%`, backgroundColor: rule.color, opacity: 0.5 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BudgetEditor({ rules, onSave, onCancel }) {
  const [draft, setDraft] = useState(rules.map(r => ({ ...r })))
  const [showColorFor, setShowColorFor] = useState(null)

  const total = draft.reduce((s, r) => s + Number(r.pct || 0), 0)
  const valid = total === 100 && draft.every(r => r.label.trim() && Number(r.pct) > 0)

  const update = (id, field, value) => setDraft(d => d.map(r => r.id === id ? { ...r, [field]: value } : r))
  const add = () => setDraft(d => [...d, { id: crypto.randomUUID(), label: '', pct: 0, color: PRESET_COLORS[d.length % PRESET_COLORS.length], trackAs: null }])
  const remove = (id) => setDraft(d => d.filter(r => r.id !== id))

  return (
    <div className="space-y-2">
      {draft.map(rule => (
        <div key={rule.id} className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowColorFor(showColorFor === rule.id ? null : rule.id)}
              className="w-6 h-6 rounded border border-zinc-200 shrink-0 hover:scale-110 transition-transform"
              style={{ backgroundColor: rule.color }} />
            {showColorFor === rule.id && (
              <div className="absolute left-0 top-8 z-10 bg-white rounded-lg p-2 grid grid-cols-6 gap-1 shadow-lg border border-zinc-200">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => { update(rule.id, 'color', c); setShowColorFor(null) }}
                    className="w-5 h-5 rounded hover:scale-125 transition-transform border border-zinc-200"
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </div>
          <input value={rule.label} onChange={e => update(rule.id, 'label', e.target.value)} placeholder="nombre"
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-black font-mono focus:outline-none focus:border-black placeholder:text-zinc-300" />
          <div className="flex items-center gap-1">
            <input type="number" min="1" max="100" value={rule.pct} onChange={e => update(rule.id, 'pct', Number(e.target.value))}
              className="w-12 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-sm text-black font-mono focus:outline-none focus:border-black text-center" />
            <span className="text-zinc-400 font-mono text-xs">%</span>
          </div>
          <select value={rule.trackAs ?? ''} onChange={e => update(rule.id, 'trackAs', e.target.value || null)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-500 font-mono focus:outline-none focus:border-black">
            <option value="">gasto</option>
            <option value="savings">ahorro</option>
          </select>
          <button onClick={() => remove(rule.id)} disabled={draft.length <= 1} className="text-zinc-300 hover:text-red-500 disabled:opacity-20 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button onClick={add} className="flex items-center gap-1.5 text-zinc-400 hover:text-black text-xs font-mono transition-colors">
          <Plus size={13} />add_category()
        </button>
        <span className={`text-xs font-mono font-semibold ${total === 100 ? 'text-black' : 'text-red-500'}`}>total: {total}%</span>
      </div>
      {total !== 100 && <p className="text-xs text-red-500 font-mono">// must equal 100%</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(draft)} disabled={!valid} className="flex-1 bg-black hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono font-semibold py-2 rounded-lg text-sm transition-colors">
          save()
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-zinc-400 hover:text-black text-sm font-mono rounded-lg hover:bg-zinc-100 transition-colors">
          cancel
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, valueColor, icon }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-zinc-400 font-mono truncate mr-2">{label}</p>
        {icon}
      </div>
      <p className={`text-xl font-mono font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 font-mono mt-1 truncate">{sub}</p>}
    </div>
  )
}

function AnalysisBar({ label, actual, recommended, color, over }) {
  const pct = recommended > 0 ? Math.min((actual / recommended) * 100, 100) : 0
  const barColor = over ? '#000000' : color

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-zinc-500 font-mono">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`font-mono font-semibold ${over ? 'text-black' : 'text-black'}`}>{fmt(actual)}</span>
          <span className="text-zinc-300 font-mono">/ {fmt(recommended)}</span>
          {over
            ? <AlertTriangle size={11} className="text-black" />
            : <CheckCircle size={11} className="text-zinc-300" />
          }
        </div>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
    </div>
  )
}
