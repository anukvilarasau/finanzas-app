import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { X, Settings, Plus, Trash2, CheckCircle, AlertTriangle, TrendingUp, Wallet } from 'lucide-react'
import { getMonthExpenses, fmt } from '../utils/finance'

const ACCENT = '#7c3aed'
const ACCENT_LIGHT = '#ede9fe'

const PRESET_COLORS = [
  '#7c3aed','#2563eb','#059669','#d97706','#dc2626',
  '#0891b2','#db2777','#65a30d','#ea580c','#7c3aed',
  '#6366f1','#0f172a',
]

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function Dashboard({ incomes, expenses, budgetRules, savingsConfirmations, setBudgetRules, confirmSavings, unconfirmSavings, onNavigate }) {
  const [editingBudget, setEditingBudget] = useState(false)

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Income = sum of all income records for the current month
  const income = incomes
    .filter(i => i.date.startsWith(currentMonth))
    .reduce((s, i) => s + i.amount, 0)

  const currentMonthIncomeCount = incomes.filter(i => i.date.startsWith(currentMonth)).length

  const monthExpenses = getMonthExpenses(expenses, now.getFullYear(), now.getMonth())
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)

  const spendRules = budgetRules.filter(r => !r.trackAs)
  const savingsRules = budgetRules.filter(r => r.trackAs)
  const spendPct = spendRules.reduce((s, r) => s + r.pct, 0)

  function isConfirmed(ruleId) {
    return savingsConfirmations?.some(c => c.rule_id === ruleId && c.month === currentMonth) ?? false
  }

  function getSpendRuleActual(rule) {
    return spendPct > 0 ? (rule.pct / spendPct) * totalSpent : 0
  }

  const donutData = budgetRules.map(rule => ({
    name: rule.label,
    value: income * rule.pct / 100,
    color: rule.color,
  }))

  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const total = expenses
        .filter(e => { const [ey, em] = e.date.split('-').map(Number); return ey === y && em - 1 === m })
        .reduce((s, e) => s + e.amount, 0)
      return { name: MONTHS_SHORT[m], total }
    })
  }, [expenses, now.getMonth(), now.getFullYear()])

  const descriptionData = useMemo(() => {
    const map = {}
    monthExpenses.forEach(e => {
      const key = e.description?.trim() || 'Sin descripción'
      map[key] = (map[key] || 0) + e.amount
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [monthExpenses])

  const tooltipStyle = {
    background: '#fff',
    border: '1px solid #e4e4e7',
    borderRadius: '10px',
    color: '#18181b',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Resumen del mes</h1>
          <p className="text-sm text-zinc-400 mt-0.5 capitalize">
            {now.toLocaleString('es', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm min-w-48">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-400 font-medium mb-0.5">Ingreso del mes</p>
              <p className="text-lg font-bold text-zinc-900">{income > 0 ? fmt(income) : '—'}</p>
            </div>
            {currentMonthIncomeCount > 0 && (
              <span className="text-xs text-zinc-400 shrink-0">
                {currentMonthIncomeCount} registro{currentMonthIncomeCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Empty state: no income this month */}
      {income === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto">
            <Wallet size={24} className="text-accent-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900">Sin ingresos este mes</p>
            <p className="text-sm text-zinc-400 mt-1">Registrá tu primer ingreso para ver el análisis completo de tu presupuesto.</p>
          </div>
          <button
            onClick={() => onNavigate?.('ingreso')}
            className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Registrar ingreso
          </button>
        </div>
      )}

      {income > 0 && (
        <>
          {/* Budget rule cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Distribución del presupuesto</h2>
              {!editingBudget && (
                <button
                  onClick={() => setEditingBudget(true)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-accent-600 font-medium transition-colors">
                  <Settings size={13} /> Editar
                </button>
              )}
            </div>

            {editingBudget ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                <BudgetEditor
                  rules={budgetRules}
                  onSave={(rules) => { setBudgetRules(rules); setEditingBudget(false) }}
                  onCancel={() => setEditingBudget(false)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {spendRules.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {spendRules.map(rule => {
                      const target = income * rule.pct / 100
                      const actual = getSpendRuleActual(rule)
                      const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0
                      const over = actual > target
                      return (
                        <div key={rule.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: rule.color }} />
                              <div>
                                <p className="text-sm font-semibold text-zinc-900">{rule.label}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">{rule.pct}% · {fmt(target)}</p>
                              </div>
                            </div>
                            {over && <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                              <span className="text-xl font-bold text-zinc-900">{fmt(actual)}</span>
                              <span className="text-xs text-zinc-400">de {fmt(target)}</span>
                            </div>
                            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, backgroundColor: over ? '#f59e0b' : rule.color }} />
                            </div>
                            <p className="text-xs text-zinc-400">
                              {over ? `Excedido por ${fmt(actual - target)}` : `Quedan ${fmt(target - actual)}`}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {savingsRules.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {savingsRules.map(rule => (
                      <SavingsConfirmCard
                        key={rule.id}
                        rule={rule}
                        target={income * rule.pct / 100}
                        confirmed={isConfirmed(rule.id)}
                        currentMonth={currentMonth}
                        onConfirm={confirmSavings}
                        onUnconfirm={unconfirmSavings}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Charts row: donut + trend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Distribución del ingreso</h3>
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={62}
                        dataKey="value" strokeWidth={0}>
                        {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={v => [fmt(v), '']} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  {donutData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-zinc-600 truncate text-xs">{item.name}</span>
                      </div>
                      <span className="text-zinc-900 font-semibold text-xs shrink-0">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Últimos 6 meses</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={34} />
                  <Tooltip formatter={v => [fmt(v), 'Total gastado']} contentStyle={tooltipStyle} cursor={{ fill: '#f5f3ff' }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {trendData.map((_, i) => (
                      <Cell key={i} fill={i === trendData.length - 1 ? ACCENT : '#e4e4e7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Description breakdown */}
          {descriptionData.length > 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Gastos por descripción</h3>
              <ResponsiveContainer width="100%" height={Math.max(160, descriptionData.length * 44)}>
                <BarChart data={descriptionData} layout="vertical" margin={{ top: 0, right: 72, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={120}
                    tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [fmt(v), 'Total']} contentStyle={tooltipStyle} cursor={{ fill: '#f5f3ff' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}
                    label={{ position: 'right', formatter: v => fmt(v), fill: '#a1a1aa', fontSize: 11 }}>
                    {descriptionData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? ACCENT : i <= 2 ? '#a78bfa' : '#ddd6fe'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center mx-auto">
                <TrendingUp size={20} className="text-accent-600" />
              </div>
              <p className="text-sm font-semibold text-zinc-900">Sin gastos este mes</p>
              <p className="text-xs text-zinc-400">Registrá tus primeros gastos para ver el análisis por categoría.</p>
            </div>
          )}
        </>
      )}

    </div>
  )
}

function SavingsConfirmCard({ rule, target, confirmed, currentMonth, onConfirm, onUnconfirm }) {
  const [pending, setPending] = useState(false)

  const handleConfirm = async () => {
    setPending(true)
    await onConfirm(rule.id, currentMonth)
    setPending(false)
  }
  const handleUnconfirm = async () => {
    setPending(true)
    await onUnconfirm(rule.id, currentMonth)
    setPending(false)
  }

  return (
    <div className={`rounded-2xl p-4 border transition-all ${confirmed ? 'bg-accent-50 border-accent-200' : 'bg-white border-zinc-200'} shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: rule.color }} />
          <div>
            <p className="text-sm font-semibold text-zinc-900">{rule.label}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{rule.pct}%</p>
          </div>
        </div>
        {confirmed && <CheckCircle size={16} className="text-accent-600 shrink-0 mt-0.5" />}
      </div>

      <p className="text-2xl font-bold text-zinc-900 mb-0.5">{fmt(target)}</p>
      <p className="text-xs text-zinc-400 mb-4">objetivo este mes</p>

      {confirmed ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-accent-600 text-sm font-semibold">
            <CheckCircle size={15} /> Confirmado este mes
          </div>
          <button onClick={handleUnconfirm} disabled={pending}
            className="text-xs text-zinc-400 hover:text-zinc-700 underline transition-colors disabled:opacity-40">
            Deshacer
          </button>
        </div>
      ) : (
        <button onClick={handleConfirm} disabled={pending}
          className="w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          <CheckCircle size={15} />
          {pending ? 'Guardando...' : 'Lo hice este mes'}
        </button>
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
    <div className="space-y-3">
      <p className="text-sm font-semibold text-zinc-700 mb-1">Editar distribución</p>
      {draft.map(rule => (
        <div key={rule.id} className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowColorFor(showColorFor === rule.id ? null : rule.id)}
              className="w-7 h-7 rounded-lg border border-zinc-200 shrink-0 hover:scale-110 transition-transform"
              style={{ backgroundColor: rule.color }} />
            {showColorFor === rule.id && (
              <div className="absolute left-0 top-9 z-10 bg-white rounded-xl p-2 grid grid-cols-6 gap-1.5 shadow-xl border border-zinc-200">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => { update(rule.id, 'color', c); setShowColorFor(null) }}
                    className="w-5 h-5 rounded-md hover:scale-125 transition-transform border border-white/20"
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </div>
          <input value={rule.label} onChange={e => update(rule.id, 'label', e.target.value)} placeholder="Nombre"
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-accent-600 placeholder:text-zinc-300 transition-colors" />
          <div className="flex items-center gap-1">
            <input type="number" min="1" max="100" value={rule.pct} onChange={e => update(rule.id, 'pct', Number(e.target.value))}
              className="w-12 bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2 text-sm text-zinc-900 focus:outline-none focus:border-accent-600 text-center transition-colors" />
            <span className="text-zinc-400 text-xs">%</span>
          </div>
          <select value={rule.trackAs ?? ''} onChange={e => update(rule.id, 'trackAs', e.target.value || null)}
            className="bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2 text-xs text-zinc-500 focus:outline-none focus:border-accent-600 transition-colors">
            <option value="">Gastar</option>
            <option value="ahorro">Ahorro</option>
            <option value="inversion">Inversión</option>
          </select>
          <button onClick={() => remove(rule.id)} disabled={draft.length <= 1}
            className="text-zinc-300 hover:text-red-500 disabled:opacity-20 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button onClick={add} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-accent-600 font-medium transition-colors">
          <Plus size={13} /> Agregar categoría
        </button>
        <span className={`text-xs font-semibold ${total === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
          Total: {total}%
        </span>
      </div>
      {total !== 100 && <p className="text-xs text-red-500">Debe sumar exactamente 100%</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(draft)} disabled={!valid}
          className="flex-1 bg-accent-600 hover:bg-accent-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
          Guardar
        </button>
        <button onClick={onCancel}
          className="px-5 py-2.5 text-zinc-500 hover:text-zinc-900 text-sm rounded-xl hover:bg-zinc-100 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )
}
