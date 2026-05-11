import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Edit3, X, Settings, Plus, Trash2 } from 'lucide-react'
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

  // Split rules into spending vs savings
  const spendRules = budgetRules.filter(r => !r.trackAs)
  const savingsRules = budgetRules.filter(r => r.trackAs)
  const spendPct = spendRules.reduce((s, r) => s + r.pct, 0)
  const totalSavingsPct = savingsRules.reduce((s, r) => s + r.pct, 0)
  const spendBudget = income * spendPct / 100
  const totalSavingsTarget = income * totalSavingsPct / 100
  const remaining = income - totalSpent

  const isOverspending = income > 0 && totalSpent > spendBudget
  const isLowSavings = income > 0 && remaining < totalSavingsTarget

  // Description breakdown chart
  const descriptionData = useMemo(() => {
    const map = {}
    monthExpenses.forEach(e => {
      const key = e.description?.trim() || 'sin descripción'
      map[key] = (map[key] || 0) + e.amount
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [monthExpenses])

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



      {/* Gastar card */}
      {income > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">// gastar · {spendPct}% del ingreso</p>
            {!editingBudget && (
              <button onClick={() => setEditingBudget(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-black font-mono transition-colors">
                <Settings size={12} />edit distribución
              </button>
            )}
          </div>

          {editingBudget ? (
            <BudgetEditor rules={budgetRules} onSave={(rules) => { setBudgetRules(rules); setEditingBudget(false) }} onCancel={() => setEditingBudget(false)} />
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-mono font-bold text-black">{fmt(totalSpent)}</p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">gastado de {fmt(spendBudget)} disponibles</p>
                </div>
                <p className="text-lg font-mono font-semibold text-zinc-400 pb-1">
                  {spendBudget > 0 ? `${Math.min(((totalSpent / spendBudget) * 100), 100).toFixed(0)}%` : '—'}
                </p>
              </div>
              <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: spendBudget > 0 ? `${Math.min((totalSpent / spendBudget) * 100, 100)}%` : '0%',
                    backgroundColor: isOverspending ? '#000000' : '#52525b',
                  }}
                />
              </div>
              <p className="text-xs font-mono text-zinc-400">
                {isOverspending
                  ? `⚠ excedido por ${fmt(totalSpent - spendBudget)}`
                  : `quedan ${fmt(spendBudget - totalSpent)}`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Savings cards — one per non-spending rule */}
      {income > 0 && savingsRules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsRules.map(rule => {
            const target = income * (rule.pct / 100)
            const met = remaining >= target
            const sharePct = totalSavingsTarget > 0 ? (target / totalSavingsTarget) * 100 : 100
            return (
              <div key={rule.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">
                    // {rule.label.toLowerCase()} · {rule.pct}%
                  </p>
                  {met
                    ? <CheckCircle className="text-black" size={16} />
                    : <AlertTriangle className="text-zinc-300" size={16} />
                  }
                </div>
                <p className="text-3xl font-mono font-bold text-black">{fmt(target)}</p>
                <p className="text-xs text-zinc-400 font-mono mt-1 mb-3">
                  {met
                    ? `cubierto · te sobran ${fmt(remaining - target)}`
                    : `te faltan ${fmt(Math.max(0, target - remaining))} para la meta`
                  }
                </p>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: target > 0 ? `${Math.min((remaining / target) * 100, 100)}%` : '0%',
                      backgroundColor: met ? rule.color : '#d4d4d8',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Description breakdown chart */}
      {monthExpenses.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest mb-4">// gastos_por_descripcion</p>
          <ResponsiveContainer width="100%" height={Math.max(180, descriptionData.length * 40)}>
            <BarChart data={descriptionData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category" dataKey="name" width={130}
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                formatter={v => [fmt(v), 'total']}
                contentStyle={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px', color: '#000', fontSize: '11px', fontFamily: 'monospace' }}
                cursor={{ fill: '#f9f9f9' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', formatter: v => fmt(v), fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}>
                {descriptionData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#000000' : i === 1 ? '#52525b' : '#a1a1aa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
            <option value="">gastar</option>
            <option value="ahorro">ahorro</option>
            <option value="inversion">inversión</option>
          </select>
          <button onClick={() => remove(rule.id)} disabled={draft.length <= 1} className="text-zinc-300 hover:text-red-500 disabled:opacity-20 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button onClick={add} className="flex items-center gap-1.5 text-zinc-400 hover:text-black text-xs font-mono transition-colors">
          <Plus size={13} />add_rule()
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
