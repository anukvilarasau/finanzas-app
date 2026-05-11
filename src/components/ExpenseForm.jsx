import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

export default function ExpenseForm({ addExpense, budgetRules }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ amount: '', ruleId: '', description: '', date: today })
  const [success, setSuccess] = useState(false)

  const selectedRule = form.ruleId ? budgetRules.find(r => r.id === form.ruleId) : null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount || !form.ruleId) return

    // type: use trackAs for built-in rules, or the rule.id for custom ones
    const type = selectedRule?.trackAs || selectedRule?.id || 'deseo'

    addExpense({
      amount: Number(form.amount),
      category: form.ruleId,   // store rule id in category for retrieval
      description: form.description,
      date: form.date,
      type,
    })

    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setForm({ amount: '', ruleId: '', description: '', date: today })
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

        {/* Budget rule selection */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-4">category</label>
          <div className="grid grid-cols-2 gap-2">
            {budgetRules.map(rule => {
              const selected = form.ruleId === rule.id
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, ruleId: rule.id }))}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all border text-left"
                  style={selected
                    ? { backgroundColor: rule.color + '15', borderColor: rule.color, color: rule.color }
                    : { borderColor: '#e4e4e7', color: '#a1a1aa' }
                  }
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selected ? rule.color : '#d4d4d8' }} />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{rule.label}</p>
                    <p className="text-xs opacity-70">{rule.pct}% del ingreso</p>
                  </div>
                </button>
              )
            })}
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
          type="submit" disabled={!form.amount || !form.ruleId}
          className="w-full bg-black hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed text-white font-mono font-bold py-3.5 rounded-xl transition-colors text-sm"
        >
          add_expense()
        </button>
      </form>
    </div>
  )
}
