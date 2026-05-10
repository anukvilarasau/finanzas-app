export const CATEGORIES = [
  { id: 'alimentacion',    label: 'Alimentación',    type: 'necesidad', color: '#10b981' },
  { id: 'transporte',      label: 'Transporte',      type: 'necesidad', color: '#3b82f6' },
  { id: 'salud',           label: 'Salud',           type: 'necesidad', color: '#ec4899' },
  { id: 'hogar',           label: 'Hogar',           type: 'necesidad', color: '#8b5cf6' },
  { id: 'servicios',       label: 'Servicios',       type: 'necesidad', color: '#f59e0b' },
  { id: 'entretenimiento', label: 'Entretenimiento', type: 'deseo',     color: '#f97316' },
  { id: 'ropa',            label: 'Ropa',            type: 'deseo',     color: '#06b6d4' },
  { id: 'restaurantes',    label: 'Restaurantes',    type: 'deseo',     color: '#84cc16' },
  { id: 'viajes',          label: 'Viajes',          type: 'deseo',     color: '#a855f7' },
  { id: 'suscripciones',   label: 'Suscripciones',   type: 'deseo',     color: '#14b8a6' },
  { id: 'otros',           label: 'Otros',           type: 'deseo',     color: '#64748b' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))
