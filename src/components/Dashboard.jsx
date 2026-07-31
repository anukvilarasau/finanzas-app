import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  Settings, Plus, Trash2, CheckCircle, AlertTriangle,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { getMonthExpenses, fmt } from '../utils/finance'

const ACCENT = '#7c3aed'
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const PRESET_COLORS = [
  '#7c3aed','#2563eb','#059669','#d97706','#dc2626',
  '#0891b2','#db2777','#65a30d','#ea580c','#7c3aed',
  '#6366f1','#0f172a',
]

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #e4e4e7',
  borderRadius: '10px',
  color: '#18181b',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
}

export default function Dashboard({
  incomes, expenses, budgetRules, savingsConfirmations,
  setBudgetRules, confirmSavings, unconfirmSavings, onNavigate,
}) {
  const [editingBudget, setEditingBudget] = useState(false)

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const monthIncomes = incomes.filter(i => i.date.startsWith(currentMonth))
  const income = monthIncomes.reduce((s, i) => s + i.amount, 0)

  const monthExpenses = getMonthExpenses(expenses, now.getFullYear(), now.getMonth())
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const balance = income - totalSpent

  const spendRules = budgetRules.filter(r => !r.trackAs)
  const savingsRules = budgetRules.filter(r => r.trackAs)
  const spendPct = spendRules.reduce((s, r) => s + r.pct, 0)

  const isConfirmed = (ruleId) =>
    savingsConfirmations?.some(c => c.rule_id === ruleId && c.month === currentMonth) ?? false

  const getSpendRuleActual = (rule) =>
    spendPct > 0 ? (rule.pct / spendPct) * totalSpent : 0

  // Donut: use real amounts if income exists, else show proportional %
  const donutData = budgetRules.map(rule => ({
    name: rule.label,
    value: income > 0 ? income * rule.pct / 100 : rule.pct,
    pct: rule.pct,
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

  // Show spend rule cards only when there's something to display
  const showSpendRules = spendRules.length > 0 && (income > 0 || totalSpent > 0)
  const noData = income === 0 && totalSpent === 0

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Resumen del mes</h1>
        <p className="text-sm text-zinc-400 mt-0.5 capitalize">
          {now.toLocaleString('es', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Ingresos */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Ingresos</span>
            <div className="w-8 h-8 bg-accent-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={15} className="text-accent-600" />
            </div>
          </div>
          {income > 0 ? (
            <>
              <p className="text-2xl font-bold text-zinc-900">{fmt(income)}</p>
              <p className="text-xs text-zinc-400 mt-1">
                {monthIncomes.length} registro{monthIncomes.length !== 1 ? 's' : ''} este mes
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-zinc-200">—</p>
              <button
                onClick={() => onNavigate?.('ingreso')}
                className="text-xs text-accent-600 hover:text-accent-700 font-medium mt-1 transition-colors block"
              >
                Registrar ingreso →
              </button>
            </>
          )}
        </div>

        {/* Gastos */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Gastos</span>
            <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center">
              <TrendingDown size={15} className="text-zinc-500" />
            </div>
          </div>
          {totalSpent > 0 ? (
            <>
              <p className="text-2xl font-bold text-zinc-900">{fmt(totalSpent)}</p>
              <p className="text-xs text-zinc-400 mt-1">
                {monthExpenses.length} gasto{monthExpenses.length !== 1 ? 's' : ''} este mes
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-zinc-200">—</p>
              <button
                onClick={() => onNavigate?.('nuevo')}
                className="text-xs text-zinc-400 hover:text-zinc-600 font-medium mt-1 transition-colors block"
              >
                Registrar gasto →
              </button>
            </>
          )}
        </div>

        {/* Balance */}
        <div className={`rounded-2xl p-4 shadow-sm border ${
          noData
            ? 'bg-white border-zinc-200'
            : balance >= 0
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-red-50 border-red-100'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Balance</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              noData ? 'bg-zinc-100' : balance >= 0 ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              {!noData && balance < 0
                ? <ArrowDownRight size={15} className="text-red-500" />
                : <ArrowUpRight size={15} className={noData ? 'text-zinc-400' : 'text-emerald-600'} />
              }
            </div>
          </div>
          {noData ? (
            <>
              <p className="text-2xl font-bold text-zinc-200">—</p>
              <p className="text-xs text-zinc-400 mt-1">Sin datos este mes</p>
            </>
          ) : (
            <>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {balance > 0 ? '+' : ''}{fmt(balance)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {balance >= 0 ? 'Disponible este mes' : 'Por encima del ingreso'}
              </p>
            </>
          )}
        </div>

      </div>

      {/* Budget section */}
      <div>
        <div className="flex items-start justify-between mb-3 gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              Distribución del presupuesto
            </h2>
            {!income && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Registrá un ingreso para ver los objetivos calculados
              </p>
            )}
          </div>
          {!editingBudget && (
            <button
              onClick={() => setEditingBudget(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-accent-600 font-medium transition-colors shrink-0 mt-0.5"
            >
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

            {/* Savings / investment rules — always visible */}
            {savingsRules.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {savingsRules.map(rule => (
                  <SavingsConfirmCard
                    key={rule.id}
                    rule={rule}
                    target={income > 0 ? income * rule.pct / 100 : null}
                    confirmed={isConfirmed(rule.id)}
                    currentMonth={currentMonth}
                    onConfirm={confirmSavings}
                    onUnconfirm={unconfirmSavings}
                  />
                ))}
              </div>
            )}

            {/* Spend rules — with bars if income, simplified if only expenses */}
            {showSpendRules && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {spendRules.map(rule => {
                  const actual = getSpendRuleActual(rule)
                  if (income > 0) {
                    const target = income * rule.pct / 100
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
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: over ? '#f59e0b' : rule.color }}
                            />
                          </div>
                          <p className="text-xs text-zinc-400">
                            {over ? `Excedido por ${fmt(actual - target)}` : `Quedan ${fmt(target - actual)}`}
                          </p>
                        </div>
                      </div>
                    )
                  }
                  // No income — simplified card, just show what was spent
                  return (
                    <div key={rule.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: rule.color }} />
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{rule.label}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{rule.pct}%</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-zinc-900">{fmt(actual)}</p>
                      <p className="text-xs text-zinc-400 mt-1">gastado este mes</p>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Donut */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
            {income > 0 ? 'Distribución del ingreso' : 'Distribución por categoría'}
          </h3>
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={62}
                    dataKey="value" strokeWidth={0}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={v => [income > 0 ? fmt(v) : `${v}%`, '']}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {donutData.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-600 truncate text-xs">{item.name}</span>
                  </div>
                  <span className="text-zinc-900 font-semibold text-xs shrink-0">
                    {income > 0 ? fmt(item.value) : `${item.pct}%`}
                  </span>
                </div>
              ))}
              {!income && (
                <p className="text-xs text-zinc-300 pt-1 leading-relaxed">
                  Registrá un ingreso para ver montos
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 6-month trend */}
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
      {descriptionData.length > 0 && (
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
    <div className={`rounded-2xl p-4 border transition-all shadow-sm ${
      confirmed ? 'bg-accent-50 border-accent-200' : 'bg-white border-zinc-200'
    }`}>
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

      {target !== null ? (
        <>
          <p className="text-2xl font-bold text-zinc-900 mb-0.5">{fmt(target)}</p>
          <p className="text-xs text-zinc-400 mb-4">objetivo este mes</p>
        </>
      ) : (
        <p className="text-xs text-zinc-400 mb-4">Sin monto objetivo aún</p>
      )}

      {confirmed ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-accent-600 text-sm font-semibold">
            <CheckCircle size={15} /> Confirmado este mes
          </div>
          <button
            onClick={handleUnconfirm} disabled={pending}
            className="text-xs text-zinc-400 hover:text-zinc-700 underline transition-colors disabled:opacity-40"
          >
            Deshacer
          </button>
        </div>
      ) : (
        <button
          onClick={handleConfirm} disabled={pending}
          className="w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
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
  const add = () => setDraft(d => [...d, {
    id: crypto.randomUUID(), label: '', pct: 0,
    color: PRESET_COLORS[d.length % PRESET_COLORS.length], trackAs: null,
  }])
  const remove = (id) => setDraft(d => d.filter(r => r.id !== id))

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-zinc-700 mb-1">Editar distribución</p>
      {draft.map(rule => (
        <div key={rule.id} className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowColorFor(showColorFor === rule.id ? null : rule.id)}
              className="w-7 h-7 rounded-lg border border-zinc-200 shrink-0 hover:scale-110 transition-transform"
              style={{ backgroundColor: rule.color }}
            />
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
          <input
            value={rule.label} onChange={e => update(rule.id, 'label', e.target.value)}
            placeholder="Nombre"
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-accent-600 placeholder:text-zinc-300 transition-colors"
          />
          <div className="flex items-center gap-1">
            <input
              type="number" min="1" max="100" value={rule.pct}
              onChange={e => update(rule.id, 'pct', Number(e.target.value))}
              className="w-12 bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2 text-sm text-zinc-900 focus:outline-none focus:border-accent-600 text-center transition-colors"
            />
            <span className="text-zinc-400 text-xs">%</span>
          </div>
          <select
            value={rule.trackAs ?? ''}
            onChange={e => update(rule.id, 'trackAs', e.target.value || null)}
            className="bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2 text-xs text-zinc-500 focus:outline-none focus:border-accent-600 transition-colors"
          >
            <option value="">Gastar</option>
            <option value="ahorro">Ahorro</option>
            <option value="inversion">Inversión</option>
          </select>
          <button
            onClick={() => remove(rule.id)} disabled={draft.length <= 1}
            className="text-zinc-300 hover:text-red-500 disabled:opacity-20 transition-colors"
          >
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
        <button
          onClick={() => onSave(draft)} disabled={!valid}
          className="flex-1 bg-accent-600 hover:bg-accent-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-zinc-500 hover:text-zinc-900 text-sm rounded-xl hover:bg-zinc-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
