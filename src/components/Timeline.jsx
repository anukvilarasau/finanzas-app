import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Trash2, Calendar, TrendingDown } from 'lucide-react'
import { CATEGORY_MAP } from '../data/categories'
import { fmt } from '../utils/finance'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Timeline({ expenses, deleteExpense }) {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [showAll, setShowAll] = useState(false)

  const years = useMemo(() => {
    const ys = new Set(expenses.map(e => Number(e.date.split('-')[0])))
    ys.add(now.getFullYear())
    return [...ys].sort((a, b) => b - a)
  }, [expenses])

  const filtered = useMemo(() => {
    return expenses
      .filter(e => {
        const [y, m] = e.date.split('-').map(Number)
        if (showAll) return y === selectedYear
        return y === selectedYear && m - 1 === selectedMonth
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, selectedYear, selectedMonth, showAll])

  const chartData = useMemo(() => {
    return MONTHS.map((name, i) => {
      const total = expenses
        .filter(e => { const [y, m] = e.date.split('-').map(Number); return y === selectedYear && m - 1 === i })
        .reduce((s, e) => s + e.amount, 0)
      return { name: name.slice(0, 3), total, active: showAll || selectedMonth === i }
    })
  }, [expenses, selectedYear, selectedMonth, showAll])

  const total = filtered.reduce((s, e) => s + e.amount, 0)

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es', { day: '2-digit', month: 'short' })
  }

  const CustomBar = (props) => {
    const { x, y, width, height, index } = props
    return <rect x={x} y={y} width={width} height={height} fill={chartData[index]?.active ? '#ffffff' : '#1a1a1a'} rx={3} ry={3} />
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest mb-1">// transaction_log</p>
          <h2 className="text-2xl font-bold text-white">Historial</h2>
          <p className="text-zinc-500 text-xs font-mono mt-1">
            {filtered.length}_records · {fmt(total)} · {showAll ? `${selectedYear}` : `${MONTHS[selectedMonth].toLowerCase()}_${selectedYear}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-zinc-600 cursor-pointer"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={showAll ? 'all' : selectedMonth}
            onChange={e => { if (e.target.value === 'all') { setShowAll(true) } else { setShowAll(false); setSelectedMonth(Number(e.target.value)) } }}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="all">all_year</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m.toLowerCase()}</option>)}
          </select>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
        <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-4">// monthly_chart_{selectedYear}</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#3f3f46', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#3f3f46', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={36} />
            <Tooltip
              formatter={v => [fmt(v), 'total']}
              contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
              cursor={{ fill: '#111' }}
            />
            <Bar dataKey="total" shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense list */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">// transactions</p>
          <span className="text-xs text-zinc-700 font-mono">{filtered.length}_records</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <TrendingDown size={28} className="text-zinc-800" />
            <p className="text-zinc-700 font-mono text-xs">no_data[]</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {filtered.map(expense => {
              const cat = CATEGORY_MAP[expense.category]
              const initials = cat?.label?.slice(0, 2).toUpperCase() || '??'
              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-900/50 transition-colors group"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold border border-zinc-800"
                    style={{ color: cat?.color || '#52525b' }}
                  >
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium">
                      {expense.description || cat?.label || 'Gasto'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono" style={{ color: cat?.color || '#52525b' }}>{cat?.label}</span>
                      <span className="text-zinc-800">·</span>
                      <span className="text-xs text-zinc-600 font-mono flex items-center gap-1">
                        <Calendar size={9} />
                        {formatDate(expense.date)}
                      </span>
                      <span className="text-zinc-800">·</span>
                      <span className="text-xs text-zinc-600 font-mono">
                        {expense.type === 'necesidad' ? 'need' : 'want'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-mono font-bold text-white shrink-0">{fmt(expense.amount)}</p>

                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 transition-all ml-1 shrink-0"
                  >
                    <Trash2 size={14} />
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
