import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

export default function IncomeForm({ addIncome }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ amount: '', description: '', date: today })
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount) return

    addIncome({
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
          <div className="w-16 h-16 border border-accent-200 rounded-xl flex items-center justify-center mx-auto bg-accent-50">
            <CheckCircle className="text-accent-600" size={28} />
          </div>
          <p className="text-black font-mono font-bold">income_saved()</p>
          <p className="text-zinc-400 font-mono text-xs">// record stored successfully</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest mb-1">// new_income</p>
        <h2 className="text-2xl font-bold text-black">Registrar Ingreso</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

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

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">fuente</label>
            <input
              type="text" placeholder="sueldo, freelance, alquiler..." value={form.description}
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
          className="w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-20 disabled:cursor-not-allowed text-white font-mono font-bold py-3.5 rounded-xl transition-colors text-sm"
        >
          add_income()
        </button>
      </form>
    </div>
  )
}
