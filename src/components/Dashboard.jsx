import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Edit3, X, DollarSign, Settings, Plus, Trash2 } from 'lucide-react'
import { CATEGORIES, CATEGORY_MAP } from '../data/categories'
import { analyzeFinances, getMonthExpenses, fmt } from '../utils/finance'

const PRESET_COLORS = [
  '#ffffff','#a1a1aa','#71717a','#10b981','#3b82f6',
  '#a855f7','#f59e0b','#ec4899','#f97316','#06b6d4','#84cc16','#ef4444',
]

function getRuleActual(rule, analysis) {
  if (rule.trackAs === 'necesidad') return analysis.needs
  if (rule.trackAs === 'deseo') return analysis.wants
  if (rule.trackAs === 'savings') return analysis.savings
  return 0
}

function buildRecommendations(budgetRules, analysis, income) {
  if (income === 0) return ['Configurá tu ingreso mensual para recibir recomendaciones personalizadas.']
  return budgetRules.filter(r => r.trackAs).map(rule => {
    const actual = getRuleActual(rule, analysis)
    const target = income * (rule.pct / 100)
    if (rule.trackAs === 'savings') {
      return actual >= target
        ? `${rule.label}: ahorraste ${fmt(actual)} (${((actual/income)*100).toFixed(0)}%). Considerá invertir el 60% y guardar el 40% como fondo de emergencia.`
        : `${rule.label}: te faltan ${fmt(target - actual)} para tu meta del ${rule.pct}%. Reducí otros gastos para llegar a ${fmt(target)}.`
    }
    return actual > target
      ? `${rule.label}: excediste el límite en ${fmt(actual - target)}. Tu meta es ${fmt(target)} (${rule.pct}% de tu ingreso).`
      : `${rule.label}: bajo control. Tenés ${fmt(target - actual)} de margen (meta: ${fmt(target)}).`
  })
}

export default function Dashboard({ income, expenses, budgetRules, setIncome, setBudgetRules }) {
  const [editingIncome, setEditingIncome] = useState(false)
  const [incomeInput, setIncomeInput] = useState('')
  const [editingBudget, setEditingBudget] = useState(false)

  const now = new Date()
  const monthExpenses = getMonthExpenses(expenses, now.getFullYear(), now.getMonth())
  const analysis = analyzeFinances(income, monthExpenses)
  const recommendations = buildRecommendations(budgetRules, analysis, income)

  const savingsRule = budgetRules.find(r => r.trackAs === 'savings')
  const savingsPct = savingsRule?.pct ?? 20
  const savingsTarget = income * (savingsPct / 100)
  const savingsOk = income > 0 && analysis.savings >= savingsTarget

  const categoryTotals = CATEGORIES
    .map(cat => ({
      name: cat.label,
      value: monthExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
      color: cat.color,
    }))
    .filter(c => c.value > 0)

  const monthName = now.toLocaleString('es', { month: 'long', year: 'numeric' })

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
        <div>
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest mb-1">// overview</p>
          <h2 className="text-2xl font-bold text-white capitalize tracking-tight">{monthName}</h2>
        </div>

        {/* Income card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 min-w-52">
          {editingIncome ? (
            <div className="flex gap-2 items-center">
              <span className="text-zinc-600 font-mono text-sm">$</span>
              <input
                autoFocus
                type="number"
                placeholder="0"
                value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveIncome()}
                className="flex-1 bg-black text-white rounded-lg px-3 py-1.5 text-sm font-mono outline-none border border-zinc-700 focus:border-white w-32 transition-colors"
              />
              <button onClick={handleSaveIncome} className="bg-white hover:bg-zinc-200 text-black px-3 py-1.5 rounded-lg text-sm font-mono font-semibold transition-colors">OK</button>
              <button onClick={() => setEditingIncome(false)} className="text-zinc-600 hover:text-white"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-600 font-mono mb-1">ingreso_mensual</p>
                <p className="text-xl font-mono font-bold text-white">{income > 0 ? fmt(income) : '—'}</p>
              </div>
              <button onClick={() => { setEditingIncome(true); setIncomeInput(income > 0 ? String(income) : '') }} className="text-zinc-700 hover:text-white transition-colors">
                <Edit3 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Income prompt */}
      {income === 0 && (
        <div className="border border-zinc-800 rounded-xl p-4 flex items-center gap-4 bg-zinc-950">
          <AlertCircle className="text-zinc-500 shrink-0" size={18} />
          <div className="flex-1">
            <p className="text-white font-mono text-sm font-semibold">income not configured</p>
            <p className="text-zinc-600 text-xs font-mono mt-0.5">Set your monthly income to unlock financial analysis.</p>
          </div>
          <button onClick={() => setEditingIncome(true)} className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors shrink-0">
            set_income()
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="gastos_mes"
          value={fmt(analysis.total)}
          sub={income > 0 ? `${((analysis.total / income) * 100).toFixed(0)}%_ingreso` : '—'}
          icon={<TrendingDown className="text-zinc-500" size={15} />}
          valueColor="text-white"
        />
        <StatCard
          label="ahorro_mes"
          value={income > 0 ? fmt(analysis.savings) : '—'}
          sub={income > 0 ? `${analysis.savingsPct.toFixed(0)}%_ingreso` : '—'}
          icon={<TrendingUp className={savingsOk ? 'text-white' : 'text-zinc-600'} size={15} />}
          valueColor={savingsOk ? 'text-white' : 'text-zinc-500'}
        />
        <StatCard
          label={`meta_ahorro_${savingsPct}%`}
          value={income > 0 ? fmt(savingsTarget) : '—'}
          sub={income > 0 ? (savingsOk ? 'TARGET_MET ✓' : `deficit: ${fmt(Math.max(0, savingsTarget - analysis.savings))}`) : '—'}
          icon={<DollarSign className={savingsOk ? 'text-white' : 'text-zinc-600'} size={15} />}
          valueColor={savingsOk ? 'text-white' : 'text-zinc-500'}
        />
      </div>

      {/* Distribution analysis */}
      {income > 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest mb-1">// budget_distribution</p>
              <h3 className="text-sm font-semibold text-white">Distribución del ingreso</h3>
            </div>
            {!editingBudget && (
              <button onClick={() => setEditingBudget(true)} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white font-mono transition-colors">
                <Settings size={12} />
                edit
              </button>
            )}
          </div>

          {editingBudget ? (
            <BudgetEditor
              rules={budgetRules}
              onSave={(rules) => { setBudgetRules(rules); setEditingBudget(false) }}
              onCancel={() => setEditingBudget(false)}
            />
          ) : (
            <div className="space-y-4">
              {budgetRules.map(rule => {
                const actual = getRuleActual(rule, analysis)
                const target = income * (rule.pct / 100)
                const over = rule.trackAs !== 'savings' && actual > target
                const isInverse = rule.trackAs === 'savings'
                return (
                  <AnalysisBar
                    key={rule.id}
                    label={`${rule.label} (${rule.pct}%)`}
                    actual={actual}
                    recommended={target}
                    color={rule.color}
                    over={over}
                    isInverse={isInverse}
                    tracked={!!rule.trackAs}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Recommendations + Pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest mb-4">// recommendations</p>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed">
                <span className="text-zinc-700 font-mono text-xs shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}.</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest mb-4">// by_category</p>
          {categoryTotals.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={categoryTotals} cx="50%" cy="50%" innerRadius={34} outerRadius={54} dataKey="value" strokeWidth={0}>
                    {categoryTotals.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => [fmt(v), 'Total']} contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {categoryTotals.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-zinc-500 truncate font-mono">{cat.name}</span>
                    </div>
                    <span className="text-zinc-300 font-mono ml-2 shrink-0">{fmt(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-28">
              <p className="text-zinc-700 font-mono text-xs">no_data[]</p>
            </div>
          )}
        </div>
      </div>
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
            <button
              onClick={() => setShowColorFor(showColorFor === rule.id ? null : rule.id)}
              className="w-6 h-6 rounded border border-zinc-700 shrink-0 hover:scale-110 transition-transform"
              style={{ backgroundColor: rule.color }}
            />
            {showColorFor === rule.id && (
              <div className="absolute left-0 top-8 z-10 bg-zinc-900 rounded-lg p-2 grid grid-cols-6 gap-1 shadow-xl border border-zinc-800">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => { update(rule.id, 'color', c); setShowColorFor(null) }}
                    className="w-5 h-5 rounded hover:scale-125 transition-transform border border-zinc-700"
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </div>
          <input
            value={rule.label}
            onChange={e => update(rule.id, 'label', e.target.value)}
            placeholder="nombre"
            className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 placeholder:text-zinc-700"
          />
          <div className="flex items-center gap-1">
            <input
              type="number" min="1" max="100"
              value={rule.pct}
              onChange={e => update(rule.id, 'pct', Number(e.target.value))}
              className="w-12 bg-black border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 text-center"
            />
            <span className="text-zinc-600 font-mono text-xs">%</span>
          </div>
          <button onClick={() => remove(rule.id)} disabled={draft.length <= 1} className="text-zinc-700 hover:text-red-500 disabled:opacity-20 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button onClick={add} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-xs font-mono transition-colors">
          <Plus size={13} />add_category()
        </button>
        <span className={`text-xs font-mono font-semibold ${total === 100 ? 'text-white' : 'text-red-500'}`}>
          total: {total}%
        </span>
      </div>
      {total !== 100 && <p className="text-xs text-red-500 font-mono">// must equal 100%</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(draft)} disabled={!valid} className="flex-1 bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed text-black font-mono font-semibold py-2 rounded-lg text-sm transition-colors">
          save()
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-zinc-600 hover:text-white text-sm font-mono rounded-lg hover:bg-zinc-900 transition-colors">
          cancel
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, valueColor, icon }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-zinc-600 font-mono truncate mr-2">{label}</p>
        {icon}
      </div>
      <p className={`text-xl font-mono font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 font-mono mt-1 truncate">{sub}</p>}
    </div>
  )
}

function AnalysisBar({ label, actual, recommended, color, over, isInverse, tracked }) {
  const pct = recommended > 0 ? Math.min((actual / recommended) * 100, 100) : 0
  const ok = isInverse ? actual >= recommended : !over
  const barColor = over && !isInverse ? '#ef4444' : color

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-zinc-400 font-mono">{label}</span>
        <div className="flex items-center gap-2">
          {tracked ? (
            <>
              <span className={`font-mono font-semibold ${over && !isInverse ? 'text-red-500' : 'text-white'}`}>{fmt(actual)}</span>
              <span className="text-zinc-700 font-mono">/ {fmt(recommended)}</span>
              {ok ? <CheckCircle size={11} className="text-white" /> : <AlertCircle size={11} className="text-red-500" />}
            </>
          ) : (
            <span className="text-zinc-600 font-mono">target: {fmt(recommended)}</span>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: tracked ? `${pct}%` : '0%', backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}
