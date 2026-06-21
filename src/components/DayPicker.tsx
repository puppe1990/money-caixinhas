import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

function firstWeekdayOfMonth(month: number, year: number): number {
  return new Date(year, month - 1, 1).getDay()
}

type DayPickerProps = {
  selectedDay: number
  month: number
  year: number
  onSelectDay: (day: number) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function DayPicker({
  selectedDay,
  month,
  year,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: DayPickerProps) {
  const today = new Date()
  const isCurrentMonth =
    today.getMonth() + 1 === month && today.getFullYear() === year
  const todayDay = today.getDate()

  const totalDays = daysInMonth(month, year)
  const startDay = firstWeekdayOfMonth(month, year)

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null)
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-900">
          {MONTH_LABELS[month - 1]} de {year}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAYS.map((label) => (
          <div key={label} className="py-1 font-medium text-slate-400">
            {label}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="py-1.5" />
          }

          const isToday = isCurrentMonth && day === todayDay
          const isSelected = day === selectedDay

          let dayClass =
            'rounded-lg py-1.5 text-sm transition-colors cursor-pointer'

          if (isSelected) {
            dayClass += ' bg-emerald-600 text-white font-semibold'
          } else if (isToday) {
            dayClass +=
              ' bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100'
          } else {
            dayClass += ' text-slate-700 hover:bg-slate-100'
          }

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={dayClass}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
