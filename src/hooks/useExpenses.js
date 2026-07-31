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
  const [income, setIncomeState] = useState(0)
  const [expenses, setExpenses] = useState([])
  const [budgetRules, setBudgetRulesState] = useState(loadBudgetRules)
  const [savingsConfirmations, setSavingsConfirmations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function load() {
      setLoading(true)

      const [{ data: expensesData }, { data: settingsData }, { data: confirmationsData }] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('settings').select('income').eq('user_id', userId).single(),
        supabase.from('savings_confirmations').select('*').eq('user_id', userId),
      ])

      if (confirmationsData) setSavingsConfirmations(confirmationsData)

      if (expensesData) {
        setExpenses(expensesData)
      }
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
      .insert({
        user_id: userId,
        amount: expense.amount,
        category: 'gasto',
        description: expense.description,
        date: expense.date,
      })
      .select()
      .single()
    if (data) {
      setExpenses(prev => [data, ...prev])
    }
  }

  const deleteExpense = async (id) => {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
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
    income, expenses, budgetRules, savingsConfirmations,
    setIncome, addExpense, deleteExpense, setBudgetRules,
    confirmSavings, unconfirmSavings, loading,
  }
}
