import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Edit3, X, DollarSign } from 'lucide-react'
import { CATEGORIES, CATEGORY_MAP } from '../data/categories'
import { analyzeFinances, getMonthExpenses, getRecommendations, fmt } from '../utils/finance'

export default function Dashboard({ income, expenses, setIncome }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')

  const now = new Date()
  const monthExpenses = getMonthExpenses(expenses, now.getFullYear(), now.getMonth())
  const analysis = analyzeFinances(income, monthExpenses)
  const recommendations = getRecommendations(analysis, income)

  const categoryTotals = CATEGORIES
    .map(cat => ({
      name: cat.label,
      value: monthExpenses
        .filter(e => e.category === cat.id)
        .reduce((s, e) => s + e.amount, 0),
      color: cat.color,
    }))
    .filter(c => c.value > 0)

  const monthName = now.toLocaleString('es', { month: 'long', year: 'numeric' })

  const handleSave = () => {
    if (input && Number(input) > 0) {
      setIncome(Number(input))
      setEditing(false)
      setInput('')
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 capitalize">{monthName}</h2>
          <p className="text-slate-400 text-sm mt-1">Tu panorama financiero</p>
        </div>

        {/* Income card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 min-w-56">
          {editing ? (
            <div className="flex gap-2 items-center">
              <span className="text-slate-400 text-sm">$</span>
              <input
                autoFocus
                type="number"
                placeholder="Ingreso mensual"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="flex-1 bg-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-sm outline-none border border-slate-600 focus:border-emerald-500 w-36"
              />
              <button
                onClick={handleSave}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              >
                OK
              </button>
              <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-300">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Ingreso mensual</p>
                <p className="text-xl font-bold text-emerald-400">
                  {income > 0 ? fmt(income) : 'Sin configurar'}
                </p>
              </div>
              <button
                onClick={() => { setEditing(true); setInput(income > 0 ? String(income) : '') }}
                className="text-slate-500 hover:text-emerald-400 transition-colors"
              >
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
            <p className="text-amber-400/70 text-xs mt-0.5">
              Necesito saber cuánto ganás para analizar tu situación financiera.
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            Configurar
          </button>
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
          label="Meta de ahorro (20%)"
          value={income > 0 ? fmt(income * 0.2) : '—'}
          sub={
            income > 0
              ? analysis.savingsOk
                ? 'Meta cumplida'
                : `Faltan ${fmt(Math.max(0, income * 0.2 - analysis.savings))}`
              : '—'
          }
          valueColor={analysis.savingsOk ? 'text-emerald-400' : 'text-amber-400'}
          icon={<DollarSign className={analysis.savingsOk ? 'text-emerald-400' : 'text-amber-400'} size={18} />}
        />
      </div>

      {/* 50/30/20 Analysis */}
      {income > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">Análisis 50 / 30 / 20</h3>
              <p className="text-slate-400 text-xs mt-0.5">Comparación con la distribución ideal de tu ingreso</p>
            </div>
          </div>
          <div className="space-y-5">
            <AnalysisBar
              label="Necesidades (50%)"
              actual={analysis.needs}
              recommended={analysis.rec.needs}
              color="#10b981"
              over={analysis.needsOver}
            />
            <AnalysisBar
              label="Deseos (30%)"
              actual={analysis.wants}
              recommended={analysis.rec.wants}
              color="#3b82f6"
              over={analysis.wantsOver}
            />
            <AnalysisBar
              label="Ahorro (20%)"
              actual={analysis.savings}
              recommended={analysis.rec.savings}
              color="#a855f7"
              over={false}
              isInverse
            />
          </div>
        </div>
      )}

      {/* Bottom grid: recommendations + pie */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recommendations */}
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

        {/* Category pie */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-base font-bold text-slate-100 mb-4">Por categoría — este mes</h3>
          {categoryTotals.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={58}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryTotals.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={v => [fmt(v), 'Total']}
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryTotals.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
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

function AnalysisBar({ label, actual, recommended, color, over, isInverse }) {
  const pct = recommended > 0 ? Math.min((actual / recommended) * 100, 100) : 0
  const ok = isInverse ? actual >= recommended : !over

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-300 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className={over && !isInverse ? 'text-red-400 font-semibold' : 'text-slate-200 font-semibold'}>
            {fmt(actual)}
          </span>
          <span className="text-slate-500 text-xs">/ {fmt(recommended)}</span>
          {ok
            ? <CheckCircle size={13} className="text-emerald-400" />
            : <AlertCircle size={13} className="text-red-400" />
          }
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: over && !isInverse ? '#ef4444' : color,
          }}
        />
      </div>
    </div>
  )
}
