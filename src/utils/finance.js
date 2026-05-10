export function fmt(amount) {
  return '$' + Number(amount).toLocaleString('es', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// Parse "YYYY-MM-DD" as local date to avoid timezone issues
export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function getMonthExpenses(expenses, year, month) {
  return expenses.filter(e => {
    const [y, m] = e.date.split('-').map(Number)
    return y === year && m - 1 === month
  })
}

export function analyzeFinances(income, monthExpenses) {
  const needs = monthExpenses
    .filter(e => e.type === 'necesidad')
    .reduce((s, e) => s + e.amount, 0)

  const wants = monthExpenses
    .filter(e => e.type === 'deseo')
    .reduce((s, e) => s + e.amount, 0)

  const total = needs + wants
  const savings = Math.max(0, income - total)

  const rec = {
    needs: income * 0.5,
    wants: income * 0.3,
    savings: income * 0.2,
  }

  return {
    total,
    needs,
    wants,
    savings,
    rec,
    needsPct: income > 0 ? (needs / income) * 100 : 0,
    wantsPct: income > 0 ? (wants / income) * 100 : 0,
    savingsPct: income > 0 ? (savings / income) * 100 : 0,
    needsOver: income > 0 && needs > rec.needs,
    wantsOver: income > 0 && wants > rec.wants,
    savingsOk: income > 0 && savings >= rec.savings,
  }
}

export function getRecommendations(analysis, income) {
  if (income === 0) {
    return ['Configurá tu ingreso mensual para recibir recomendaciones personalizadas.']
  }

  const recs = []

  if (analysis.needsOver) {
    const over = analysis.needs - analysis.rec.needs
    recs.push(`Excediste el límite de Necesidades en ${fmt(over)}. Revisá tus gastos de hogar o alimentación.`)
  } else {
    const margin = analysis.rec.needs - analysis.needs
    recs.push(`Necesidades bajo control. Tenés ${fmt(margin)} de margen en esta categoría.`)
  }

  if (analysis.wantsOver) {
    const over = analysis.wants - analysis.rec.wants
    recs.push(`Gastaste ${fmt(over)} de más en Deseos. Reducí entretenimiento o restaurantes.`)
  } else {
    recs.push(`Deseos dentro del límite recomendado. Bien administrado.`)
  }

  if (analysis.savingsOk) {
    const invest = analysis.savings * 0.6
    const emergency = analysis.savings * 0.4
    recs.push(
      `Ahorraste ${fmt(analysis.savings)} (${analysis.savingsPct.toFixed(0)}% de tu ingreso). ` +
      `Considera invertir ${fmt(invest)} y mantener ${fmt(emergency)} como fondo de emergencia.`
    )
  } else {
    const deficit = analysis.rec.savings - analysis.savings
    recs.push(
      `Te faltan ${fmt(deficit)} para alcanzar la meta de ahorro del 20%. ` +
      `Reducí gastos en Deseos para llegar a la meta de ${fmt(analysis.rec.savings)}.`
    )
  }

  return recs
}
