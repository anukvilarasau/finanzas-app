import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { CATEGORIES, CATEGORY_MAP } from '../data/categories'

export default function ExpenseForm({ addExpense, onDone }) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: today,
  })
  const [success, setSuccess] = useState(false)

  const selectedCat = form.category ? CATEGORY_MAP[form.category] : null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount || !form.category) return

    addExpense({
      amount: Number(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
      type: selectedCat?.type || 'deseo',
    })

    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setForm({ amount: '', category: '', description: '', date: today })
    }, 1500)
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="text-emerald-400" size={36} />
          </div>
          <p className="text-slate-100 font-bold text-xl">Gasto registrado</p>
          <p className="text-slate-400 text-sm">Guardado correctamente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100">Registrar Gasto</h2>
        <p className="text-slate-400 text-sm mt-1">Ingresá los detalles del gasto</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Monto
          </label>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-slate-600">$</span>
            <input
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="flex-1 bg-transparent text-5xl font-bold text-slate-100 outline-none placeholder:text-slate-700 w-0"
              required
              min="0"
              step="any"
            />
          </div>
        </div>

        {/* Category */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Categoría
          </label>

          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2 font-medium">Necesidades — 50%</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.filter(c => c.type === 'necesidad').map(cat => (
                <CategoryBtn
                  key={cat.id}
                  cat={cat}
                  selected={form.category === cat.id}
                  onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Deseos — 30%</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.filter(c => c.type === 'deseo').map(cat => (
                <CategoryBtn
                  key={cat.id}
                  cat={cat}
                  selected={form.category === cat.id}
                  onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                />
              ))}
            </div>
          </div>

          {selectedCat && (
            <div
              className="mt-4 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
              style={{ backgroundColor: selectedCat.color + '15' }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCat.color }} />
              <span className="text-slate-400">
                Clasificado como{' '}
                <span className="font-semibold" style={{ color: selectedCat.color }}>
                  {selectedCat.type === 'necesidad' ? 'Necesidad (50%)' : 'Deseo (30%)'}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Description + Date */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Descripción (opcional)
            </label>
            <input
              type="text"
              placeholder="¿En qué gastaste?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none border border-slate-600 focus:border-emerald-500 placeholder:text-slate-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none border border-slate-600 focus:border-emerald-500 transition-colors"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!form.amount || !form.category}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-emerald-500/20"
        >
          Registrar Gasto
        </button>
      </form>
    </div>
  )
}

function CategoryBtn({ cat, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border"
      style={
        selected
          ? {
              backgroundColor: cat.color + '20',
              borderColor: cat.color,
              color: cat.color,
            }
          : {
              borderColor: '#334155',
              color: '#94a3b8',
            }
      }
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
      <span className="truncate">{cat.label}</span>
    </button>
  )
}
