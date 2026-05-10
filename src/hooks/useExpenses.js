import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useExpenses(userId) {
  const [income, setIncomeState] = useState(0)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function load() {
      setLoading(true)

      const [{ data: expensesData }, { data: settingsData }] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('settings').select('income').eq('user_id', userId).single(),
      ])

      if (expensesData) setExpenses(expensesData)
      if (settingsData) setIncomeState(settingsData.income)

      // Migrate localStorage data on first login
      const localRaw = localStorage.getItem('finanzas_v1')
      if (localRaw && (!expensesData || expensesData.length === 0)) {
        try {
          const local = JSON.parse(localRaw)
          if (local.expenses?.length > 0) {
            const toInsert = local.expenses.map(e => ({
              user_id: userId,
              amount: e.amount,
              category: e.category,
              description: e.description || '',
              date: e.date,
            }))
            const { data: migrated } = await supabase.from('expenses').insert(toInsert).select()
            if (migrated) setExpenses(migrated)
          }
          if (local.income > 0) {
            await supabase.from('settings').upsert({ user_id: userId, income: local.income })
            setIncomeState(local.income)
          }
          localStorage.removeItem('finanzas_v1')
        } catch {}
      }

      setLoading(false)
    }

    load()
  }, [userId])

  const setIncome = async (value) => {
    const num = Number(value)
    setIncomeState(num)
    await supabase.from('settings').upsert({ user_id: userId, income: num })
  }

  const addExpense = async (expense) => {
    const { data } = await supabase
      .from('expenses')
      .insert({ ...expense, user_id: userId })
      .select()
      .single()
    if (data) setExpenses(prev => [data, ...prev])
  }

  const deleteExpense = async (id) => {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return { income, expenses, setIncome, addExpense, deleteExpense, loading }
}
