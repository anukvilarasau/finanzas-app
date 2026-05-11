import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Edit3, X, DollarSign, Settings, Plus, Trash2 } from 'lucide-react'
import { CATEGORIES, CATEGORY_MAP } from '../data/categories'
import { analyzeFinances, getMonthExpenses, fmt } from '../utils/finance'

const PRESET_COLORS = [
  '#10b981','#3b82f6','#a855f7','#f59e0b','#ec4899',
  '#f97316','#06b6d4','#84cc16','#14b8a6','#64748b','#ef4444','#8b5cf6',
]

function getRuleActual(rule, analysis) {
  if (rule.trackAs === 'necesidad') return analysis.needs
  if (rule.trackAs === 'deseo') return analysis.wants
  if (rule.trackAs === 'savings') return analysis.savings
  return 0
}

function buildRecommendations(budgetRules, analysis, income) {
  if (income === 0) return ['Configurá tu ingreso mensual para recibir recomendaciones personalizadas.']

  return budgetRules
    .filter(r => r.trackAs)
    .map(rule => {
      const actual = getRuleActual(rule, analysis)
      const target = income * (rule.pct / 100)

      if (rule.trackAs === 'savings') {
        if (actual >= target) {
          return `${rule.label}: ahorraste ${fmt(actual)} (${((actual / income) * 100).toFixed(0)}%). Considerá invertir el 60% y guardar el 40% como fondo de emergencia.`
        } else {
          return `${rule.label}: te faltan ${fmt(target - actual)} para tu meta del ${rule.pct}%. Reducí otros gastos para llegar a ${fmt(target)}.`
        }
      } else {
        if (actual > target) {
          return `${rule.label}: excediste el límite en ${fmt(actual - target)}. Tu meta es ${fmt(target)} (${rule.pct}% de tu ingreso).`
        } else {
          return `${rule.label}: bajo control. Tenés ${fmt(target - actual)} de margen (meta: ${fmt(target)}).`
        }
      }
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
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 capitalize">{monthName}</h2>
          <p className="text-slate-400 text-sm mt-1">Tu panorama financiero</p>
        </div>

        {/* Income card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 min-w-56">
          {editingIncome ? (
            <div className="flex gap-2 items-center">
              <span className="text-slate-400 text-sm">$</span>
              <input
                autoFocus
                type="number"
                placeholder="Ingreso mensual"
                value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveIncome()}
                className="flex-1 bg-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-sm outline-none border border-slate-600 focus:border-emerald-500 w-36"
              />
              <button onClick={handleSaveIncome} className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">OK</button>
              <button onClick={() => setEditingIncome(false)} className="text-slate-500 hover:text-slate-300"><X size={15} /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Ingreso mensual</p>
                <p className="text-xl font-bold text-emerald-400">{income > 0 ? fmt(income) : 'Sin configurar'}</p>
              </div>
              <button onClick={() => { setEditingIncome(true); setIncomeInput(income > 0 ? String(income) : '') }} className="text-slate-500 hover:text-emerald-400 transition-colors">
                <Edit3 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Income prompt */}
      {income === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-center gap-4">
          <AlertCircle className="text-amber-400 shrink-0" size={22} />
          <div className="flex-1">
            <p className="text-amber-300 font-semibold text-sm">Configurá tu ingreso mensual</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Necesito saber cuánto ganás para analizar tu situación financiera.</p>
          </div>
          <button onClick={() => setEditingIncome(true)} className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0">Configurar</button>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Gastos del mes"
          value={fmt(analysis.total)}
          sub={income > 0 ? `${((analysis.total / income) * 100).toFixed(0)}% de tu ingreso` : '—'}
          valueColor="text-red-400"
          icon={<TrendingDown className="text-red-400" size={18} />}
        />
        <StatCard
          label="Ahorro del mes"
          value={income > 0 ? fmt(analysis.savings) : '—'}
          sub={income > 0 ? `${analysis.savingsPct.toFixed(0)}% de tu ingreso` : '—'}
          valueColor={analysis.savingsOk ? 'text-emerald-400' : 'text-amber-400'}
          icon={<TrendingUp className={analysis.savingsOk ? 'text-emerald-400' : 'text-amber-400'} size={18} />}
        />
        <StatCard
          label={`Meta de ahorro (${savingsPct}%)`}
          value={income > 0 ? fmt(savingsTarget) : '—'}
          sub={income > 0 ? (analysis.savings >= savingsTarget ? 'Meta cumplida' : `Faltan ${fmt(Math.max(0, savingsTarget - analysis.savings))}`) : '—'}
          valueColor={analysis.savings >= savingsTarget ? 'text-emerald-400' : 'text-amber-400'}
          icon={<DollarSign className={analysis.savings >= savingsTarget ? 'text-emerald-400' : 'text-amber-400'} size={18} />}
        />
      </div>

      {/* Budget distribution analysis */}
      {income > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-100">Distribución del ingreso</h3>
              <p className="text-slate-400 text-xs mt-0.5">Comparación con tu distribución ideal</p>
            </div>
            {!editingBudget && (
              <button
                onClick={() => setEditingBudget(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <Settings size={13} />
                Personalizar
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
            <div className="space-y-5">
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

      {/* Bottom grid: recommendations + pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-base font-bold text-slate-100 mb-4">Recomendaciones</h3>
          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
                </div>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-base font-bold text-slate-100 mb-4">Por categoría — este mes</h3>
          {categoryTotals.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={categoryTotals} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" strokeWidth={0}>
                    {categoryTotals.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => [fmt(v), 'Total']} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f1f5f9', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryTotals.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-400 truncate">{cat.name}</span>
                    </div>
                    <span className="text-slate-300 font-medium ml-2 shrink-0">{fmt(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-600">
              <p className="text-sm">Sin gastos este mes</p>
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

  const update = (id, field, value) =>
    setDraft(d => d.map(r => r.id === id ? { ...r, [field]: value } : r))

  const add = () =>
    setDraft(d => [...d, {
      id: crypto.randomUUID(),
      label: '',
      pct: 0,
      color: PRESET_COLORS[d.length % PRESET_COLORS.length],
      trackAs: null,
    }])

  const remove = (id) => setDraft(d => d.filter(r => r.id !== id))

  return (
    <div className="space-y-3">
      {draft.map(rule => (
        <div key={rule.id} className="flex items-center gap-2">
          {/* Color */}
          <div className="relative">
            <button
              onClick={() => setShowColorFor(showColorFor === rule.id ? null : rule.id)}
              className="w-7 h-7 rounded-full border-2 border-slate-600 shrink-0 hover:scale-110 transition-transform"
              style={{ backgroundColor: rule.color }}
            />
            {showColorFor === rule.id && (
              <div className="absolute left-0 top-9 z-10 bg-slate-700 rounded-xl p-2 grid grid-cols-6 gap-1 shadow-xl border border-slate-600">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { update(rule.id, 'color', c); setShowColorFor(null) }}
                    className="w-5 h-5 rounded-full hover:scale-125 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Label */}
          <input
            value={rule.label}
            onChange={e => update(rule.id, 'label', e.target.value)}
            placeholder="Nombre"
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />

          {/* Percentage */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="100"
              value={rule.pct}
              onChange={e => update(rule.id, 'pct', Number(e.target.value))}
              className="w-14 bg-slate-700 border border-slate-600 rounded-lg px-2 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 text-center"
            />
            <span className="text-slate-400 text-sm">%</span>
          </div>

          {/* Delete */}
          <button
            onClick={() => remove(rule.id)}
            disabled={draft.length <= 1}
            className="text-slate-600 hover:text-red-400 disabled:opacity-30 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button onClick={add} className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
          <Plus size={14} />
          Agregar categoría
        </button>
        <span className={`text-sm font-semibold ${total === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
          Total: {total}%
        </span>
      </div>

      {total !== 100 && (
        <p className="text-xs text-red-400">Los porcentajes deben sumar exactamente 100%</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(draft)}
          disabled={!valid}
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Guardar
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 text-slate-400 hover:text-slate-200 text-sm rounded-xl hover:bg-slate-700 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, valueColor, icon }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function AnalysisBar({ label, actual, recommended, color, over, isInverse, tracked }) {
  const pct = recommended > 0 ? Math.min((actual / recommended) * 100, 100) : 0
  const ok = isInverse ? actual >= recommended : !over

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-300 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {tracked ? (
            <>
              <span className={over && !isInverse ? 'text-red-400 font-semibold' : 'text-slate-200 font-semibold'}>
                {fmt(actual)}
              </span>
              <span className="text-slate-500 text-xs">/ {fmt(recommended)}</span>
              {ok
                ? <CheckCircle size={13} className="text-emerald-400" />
                : <AlertCircle size={13} className="text-red-400" />
              }
            </>
          ) : (
            <span className="text-slate-400 text-xs">Meta: {fmt(recommended)}</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: tracked ? `${pct}%` : '0%',
            backgroundColor: over && !isInverse ? '#ef4444' : color,
          }}
        />
      </div>
    </div>
  )
}
