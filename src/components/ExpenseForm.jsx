import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

export default function ExpenseForm({ addExpense }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ amount: '', description: '', date: today })
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount) return

    addExpense({
      amount: Number(form.amount),
      description: form.description,
      date: form.date,
    })

    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setForm({ amount: '', description: '', date: today })
    }, 1500)
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 border border-zinc-200 rounded-xl flex items-center justify-center mx-auto">
            <CheckCircle className="text-black" size={28} />
          </div>
          <p className="text-black font-mono font-bold">expense_saved()</p>
          <p className="text-zinc-400 font-mono text-xs">// record stored successfully</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest mb-1">// new_expense</p>
        <h2 className="text-2xl font-bold text-black">Registrar Gasto</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Amount */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3">amount</label>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-mono font-bold text-zinc-300">$</span>
            <input
              type="number" placeholder="0" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="flex-1 bg-transparent text-5xl font-mono font-bold text-black outline-none placeholder:text-zinc-200 w-0"
              required min="0" step="any"
            />
          </div>
        </div>

        {/* Description + Date */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">description</label>
            <input
              type="text" placeholder="optional note..." value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-zinc-50 border border-zinc-200 text-black rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-black placeholder:text-zinc-300 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">date</label>
            <input
              type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-zinc-50 border border-zinc-200 text-black rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-black transition-colors"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>

        <button
          type="submit" disabled={!form.amount}
          className="w-full bg-black hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed text-white font-mono font-bold py-3.5 rounded-xl transition-colors text-sm"
        >
          add_expense()
        </button>
      </form>
    </div>
  )
}
