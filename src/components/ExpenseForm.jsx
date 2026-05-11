import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { CATEGORIES, CATEGORY_MAP } from '../data/categories'

export default function ExpenseForm({ addExpense, onDone }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ amount: '', category: '', description: '', date: today })
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
        <div className="text-center space-y-3">
          <div className="w-16 h-16 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto">
            <CheckCircle className="text-white" size={28} />
          </div>
          <p className="text-white font-mono font-bold">expense_saved()</p>
          <p className="text-zinc-600 font-mono text-xs">// record stored successfully</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest mb-1">// new_expense</p>
        <h2 className="text-2xl font-bold text-white">Registrar Gasto</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <label className="block text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">amount</label>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-mono font-bold text-zinc-700">$</span>
            <input
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="flex-1 bg-transparent text-5xl font-mono font-bold text-white outline-none placeholder:text-zinc-800 w-0"
              required min="0" step="any"
            />
          </div>
        </div>

        {/* Category */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <label className="block text-xs font-mono text-zinc-600 uppercase tracking-widest mb-4">category</label>

          <div className="mb-4">
            <p className="text-xs text-zinc-700 font-mono mb-2">// necesidades</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.filter(c => c.type === 'necesidad').map(cat => (
                <CategoryBtn key={cat.id} cat={cat} selected={form.category === cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-700 font-mono mb-2">// deseos</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.filter(c => c.type === 'deseo').map(cat => (
                <CategoryBtn key={cat.id} cat={cat} selected={form.category === cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))} />
              ))}
            </div>
          </div>

          {selectedCat && (
            <div className="mt-4 flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedCat.color }} />
              <span className="text-zinc-500 font-mono">
                type: <span className="text-zinc-300">{selectedCat.type === 'necesidad' ? 'necesidad' : 'deseo'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Description + Date */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-600 uppercase tracking-widest mb-2">description</label>
            <input
              type="text"
              placeholder="optional note..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-zinc-500 placeholder:text-zinc-800 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-600 uppercase tracking-widest mb-2">date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-zinc-500 transition-colors"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!form.amount || !form.category}
          className="w-full bg-white hover:bg-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed text-black font-mono font-bold py-3.5 rounded-xl transition-colors text-sm"
        >
          add_expense()
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
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all border"
      style={
        selected
          ? { backgroundColor: cat.color + '15', borderColor: cat.color, color: cat.color }
          : { borderColor: '#27272a', color: '#52525b' }
      }
    >
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: selected ? cat.color : '#3f3f46' }} />
      <span className="truncate">{cat.label}</span>
    </button>
  )
}
