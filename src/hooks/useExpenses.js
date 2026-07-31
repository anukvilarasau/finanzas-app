import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const DEFAULT_BUDGET_RULES = [
  { id: 'r1', label: 'Gastar',    pct: 70, color: '#52525b', trackAs: null },
  { id: 'r2', label: 'Ahorro',    pct: 20, color: '#000000', trackAs: 'ahorro' },
  { id: 'r3', label: 'Inversión', pct: 10, color: '#a1a1aa', trackAs: 'inversion' },
]

const BUDGET_KEY = 'finanzas_budget_rules'

function migrateLegacyTrackAs(trackAs) {
  if (trackAs === 'necesidad' || trackAs === 'deseo') return null
  if (trackAs === 'savings') return 'ahorro'
  return trackAs
}

function loadBudgetRules() {
  try {
    const raw = localStorage.getItem(BUDGET_KEY)
    if (!raw) return DEFAULT_BUDGET_RULES
    const rules = JSON.parse(raw)
    return rules.map(r => ({ ...r, trackAs: migrateLegacyTrackAs(r.trackAs) }))
  } catch {
    return DEFAULT_BUDGET_RULES
  }
}

export function useExpenses(userId) {
  const [expenses, setExpenses] = useState([])
  const [incomes, setIncomes] = useState([])
  const [budgetRules, setBudgetRulesState] = useState(loadBudgetRules)
  const [savingsConfirmations, setSavingsConfirmations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function load() {
      setLoading(true)

      const [{ data: expensesData }, { data: incomesData }, { data: confirmationsData }] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('incomes').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('savings_confirmations').select('*').eq('user_id', userId),
      ])

      if (expensesData) setExpenses(expensesData)
      if (incomesData) setIncomes(incomesData)
      if (confirmationsData) setSavingsConfirmations(confirmationsData)

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
          localStorage.removeItem('finanzas_v1')
        } catch {}
      }

      setLoading(false)
    }

    load()
  }, [userId])

  const addExpense = async (expense) => {
    const { data } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        amount: expense.amount,
        category: 'gasto',
        description: expense.description,
        date: expense.date,
      })
      .select()
      .single()
    if (data) setExpenses(prev => [data, ...prev])
  }

  const deleteExpense = async (id) => {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const addIncome = async (income) => {
    const { data } = await supabase
      .from('incomes')
      .insert({
        user_id: userId,
        amount: income.amount,
        description: income.description,
        date: income.date,
      })
      .select()
      .single()
    if (data) setIncomes(prev => [data, ...prev])
  }

  const deleteIncome = async (id) => {
    await supabase.from('incomes').delete().eq('id', id)
    setIncomes(prev => prev.filter(i => i.id !== id))
  }

  const setBudgetRules = (rules) => {
    setBudgetRulesState(rules)
    localStorage.setItem(BUDGET_KEY, JSON.stringify(rules))
  }

  const confirmSavings = async (ruleId, month) => {
    const { data } = await supabase
      .from('savings_confirmations')
      .insert({ user_id: userId, rule_id: ruleId, month })
      .select()
      .single()
    if (data) setSavingsConfirmations(prev => [...prev, data])
  }

  const unconfirmSavings = async (ruleId, month) => {
    await supabase
      .from('savings_confirmations')
      .delete()
      .eq('user_id', userId)
      .eq('rule_id', ruleId)
      .eq('month', month)
    setSavingsConfirmations(prev => prev.filter(c => !(c.rule_id === ruleId && c.month === month)))
  }

  return {
    expenses, incomes, budgetRules, savingsConfirmations,
    addExpense, deleteExpense, addIncome, deleteIncome,
    setBudgetRules, confirmSavings, unconfirmSavings, loading,
  }
}
