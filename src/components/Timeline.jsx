import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Trash2, Calendar, TrendingDown, TrendingUp } from 'lucide-react'
import { fmt } from '../utils/finance'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const ACCENT = '#7c3aed'

export default function Timeline({ expenses, incomes, budgetRules, deleteExpense, deleteIncome }) {
  const now = new Date()
  const [tab, setTab] = useState('gastos')
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [showAll, setShowAll] = useState(false)

  const transactions = tab === 'gastos' ? expenses : incomes

  const years = useMemo(() => {
    const ys = new Set(transactions.map(e => Number(e.date.split('-')[0])))
    ys.add(now.getFullYear())
    return [...ys].sort((a, b) => b - a)
  }, [transactions])

  const filtered = useMemo(() => {
    return transactions
      .filter(e => {
        const [y, m] = e.date.split('-').map(Number)
        return showAll ? y === selectedYear : y === selectedYear && m - 1 === selectedMonth
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, selectedYear, selectedMonth, showAll])

  const chartData = useMemo(() => {
    return MONTHS.map((name, i) => {
      const total = transactions
        .filter(e => { const [y, m] = e.date.split('-').map(Number); return y === selectedYear && m - 1 === i })
        .reduce((s, e) => s + e.amount, 0)
      return { name: name.slice(0, 3), total, active: showAll || selectedMonth === i }
    })
  }, [transactions, selectedYear, selectedMonth, showAll])

  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const barColor = tab === 'ingresos' ? ACCENT : '#000000'

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es', { day: '2-digit', month: 'short' })
  }

  const CustomBar = (props) => {
    const { x, y, width, height, index } = props
    return <rect x={x} y={y} width={width} height={height} fill={chartData[index]?.active ? barColor : '#e4e4e7'} rx={3} ry={3} />
  }

  const handleDelete = (id) => {
    if (tab === 'gastos') deleteExpense(id)
    else deleteIncome(id)
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest mb-1">// transaction_log</p>
          <h2 className="text-2xl font-bold text-black">Historial</h2>
          <p className="text-zinc-400 text-xs font-mono mt-1">
            {filtered.length}_records · {fmt(total)} · {showAll ? `${selectedYear}` : `${MONTHS[selectedMonth].toLowerCase()}_${selectedYear}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab toggle */}
          <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setTab('gastos')}
              className={`px-3 py-1.5 rounded-md transition-all ${tab === 'gastos' ? 'bg-white text-black shadow-sm font-semibold' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              gastos
            </button>
            <button
              onClick={() => setTab('ingresos')}
              className={`px-3 py-1.5 rounded-md transition-all ${tab === 'ingresos' ? 'bg-white text-accent-600 shadow-sm font-semibold' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              ingresos
            </button>
          </div>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-white border border-zinc-200 text-zinc-600 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-black cursor-pointer shadow-sm"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={showAll ? 'all' : selectedMonth}
            onChange={e => {
              if (e.target.value === 'all') { setShowAll(true) }
              else { setShowAll(false); setSelectedMonth(Number(e.target.value)) }
            }}
            className="bg-white border border-zinc-200 text-zinc-600 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-black cursor-pointer shadow-sm"
          >
            <option value="all">all_year</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m.toLowerCase()}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-4">// monthly_chart_{selectedYear}</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={36} />
            <Tooltip
              formatter={v => [fmt(v), tab === 'gastos' ? 'total' : 'total ingresado']}
              contentStyle={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px', color: '#000', fontSize: '11px', fontFamily: 'monospace' }}
              cursor={{ fill: '#f9f9f9' }}
            />
            <Bar dataKey="total" shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">// transactions</p>
          <span className="text-xs text-zinc-300 font-mono">{filtered.length}_records</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            {tab === 'gastos'
              ? <TrendingDown size={28} className="text-zinc-200" />
              : <TrendingUp size={28} className="text-zinc-200" />
            }
            <p className="text-zinc-300 font-mono text-xs">no_data[]</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {filtered.map(item => (
              tab === 'gastos'
                ? <ExpenseRow key={item.id} item={item} budgetRules={budgetRules} formatDate={formatDate} onDelete={handleDelete} />
                : <IncomeRow key={item.id} item={item} formatDate={formatDate} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ExpenseRow({ item, budgetRules, formatDate, onDelete }) {
  const rule = budgetRules.find(r => r.id === item.category)
  const label = rule?.label || item.category || 'Gasto'
  const color = rule?.color || '#a1a1aa'
  const initials = label.slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors group">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold border border-zinc-100" style={{ color }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-black truncate font-medium">{item.description || label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono" style={{ color }}>{label}</span>
          <span className="text-zinc-200">·</span>
          <span className="text-xs text-zinc-400 font-mono flex items-center gap-1"><Calendar size={9} />{formatDate(item.date)}</span>
        </div>
      </div>
      <p className="text-sm font-mono font-bold text-black shrink-0">-{fmt(item.amount)}</p>
      <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all ml-1 shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function IncomeRow({ item, formatDate, onDelete }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors group">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-accent-100 bg-accent-50">
        <TrendingUp size={14} className="text-accent-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-black truncate font-medium">{item.description || 'Ingreso'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono text-accent-600">ingreso</span>
          <span className="text-zinc-200">·</span>
          <span className="text-xs text-zinc-400 font-mono flex items-center gap-1"><Calendar size={9} />{formatDate(item.date)}</span>
        </div>
      </div>
      <p className="text-sm font-mono font-bold text-accent-600 shrink-0">+{fmt(item.amount)}</p>
      <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all ml-1 shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
}
