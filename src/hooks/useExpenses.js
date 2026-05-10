import { useState, useEffect } from 'react'

const KEY = 'finanzas_v1'
const defaults = { income: 0, expenses: [] }

export function useExpenses() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : defaults
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(data))
  }, [data])

  return {
    income: data.income,
    expenses: data.expenses,
    setIncome: (income) =>
      setData(d => ({ ...d, income: Number(income) })),
    addExpense: (expense) =>
      setData(d => ({
        ...d,
        expenses: [...d.expenses, { ...expense, id: crypto.randomUUID() }],
      })),
    deleteExpense: (id) =>
      setData(d => ({
        ...d,
        expenses: d.expenses.filter(e => e.id !== id),
      })),
  }
}
