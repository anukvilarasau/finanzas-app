import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Trash2, Calendar, TrendingDown } from 'lucide-react'
import { CATEGORY_MAP } from '../data/categories'
import { fmt } from '../utils/finance'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function Timeline({ expenses, deleteExpense }) {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [showAll, setShowAll] = useState(false)

  // Available years
  const years = useMemo(() => {
    const ys = new Set(expenses.map(e => Number(e.date.split('-')[0])))
    ys.add(now.getFullYear())
    return [...ys].sort((a, b) => b - a)
  }, [expenses])

  // Filtered expense list
  const filtered = useMemo(() => {
    return expenses
      .filter(e => {
        const [y, m] = e.date.split('-').map(Number)
        if (showAll) return y === selectedYear
        return y === selectedYear && m - 1 === selectedMonth
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, selectedYear, selectedMonth, showAll])

  // Monthly chart data for the selected year
  const chartData = useMemo(() => {
    return MONTHS.map((name, i) => {
      const total = expenses
        .filter(e => {
          const [y, m] = e.date.split('-').map(Number)
          return y === selectedYear && m - 1 === i
        })
        .reduce((s, e) => s + e.amount, 0)
      return { name: name.slice(0, 3), total, active: showAll || selectedMonth === i }
    })
  }, [expenses, selectedYear, selectedMonth, showAll])

  const total = filtered.reduce((s, e) => s + e.amount, 0)

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short' })
  }

  const CustomBar = (props) => {
    const { x, y, width, height, index } = props
    const isActive = chartData[index]?.active
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isActive ? '#10b981' : '#334155'}
        rx={4}
        ry={4}
      />
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header + Filters */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Historial</h2>
          <p className="text-slate-400 text-sm mt-1">
            {filtered.length} gastos · {fmt(total)}
            {' — '}
            {showAll ? `Todo ${selectedYear}` : `${MONTHS[selectedMonth]} ${selectedYear}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 cursor-pointer"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={showAll ? 'all' : selectedMonth}
            onChange={e => {
              if (e.target.value === 'all') {
                setShowAll(true)
              } else {
                setShowAll(false)
                setSelectedMonth(Number(e.target.value))
              }
            }}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Todo el año</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Gastos mensuales — {selectedYear}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              width={40}
            />
            <Tooltip
              formatter={v => [fmt(v), 'Total']}
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#f1f5f9',
                fontSize: '12px',
              }}
              cursor={{ fill: '#1e293b' }}
            />
            <Bar dataKey="total" shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense list */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Transacciones
          </p>
          <span className="text-xs text-slate-500">{filtered.length} registros</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <TrendingDown size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Sin gastos en este período</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filtered.map(expense => {
              const cat = CATEGORY_MAP[expense.category]
              const initials = cat?.label?.slice(0, 2).toUpperCase() || '?'
              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-700/30 transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      backgroundColor: (cat?.color || '#64748b') + '20',
                      color: cat?.color || '#64748b',
                    }}
                  >
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {expense.description || cat?.label || 'Gasto'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium" style={{ color: cat?.color || '#94a3b8' }}>
                        {cat?.label}
                      </span>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(expense.date)}
                      </span>
                      <span className="text-slate-700">·</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style={{
                          backgroundColor: (cat?.color || '#64748b') + '15',
                          color: cat?.color || '#94a3b8',
                        }}
                      >
                        {expense.type === 'necesidad' ? 'Necesidad' : 'Deseo'}
                      </span>
                    </div>
                  </div>

                  <p className="text-base font-bold text-slate-100 shrink-0">
                    {fmt(expense.amount)}
                  </p>

                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all ml-2 shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
