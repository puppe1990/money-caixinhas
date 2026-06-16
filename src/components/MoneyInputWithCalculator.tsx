import { ClientOnly } from '@tanstack/react-router'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Calculator } from 'lucide-react'

import { CalculatorModal } from './CalculatorModal'

type MoneyInputWithCalculatorProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function MoneyInputWithCalculator({
  id,
  value,
  onChange,
  placeholder,
  required,
}: MoneyInputWithCalculatorProps) {
  const [calculatorOpen, setCalculatorOpen] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-11"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        aria-label={id ? undefined : 'Valor (R$)'}
      />
      <ClientOnly>
        <button
          type="button"
          onClick={() => setCalculatorOpen(true)}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Abrir calculadora"
        >
          <Calculator className="h-4 w-4" aria-hidden="true" />
        </button>
        {calculatorOpen && typeof document !== 'undefined'
          ? createPortal(
              <CalculatorModal
                open={calculatorOpen}
                onClose={() => setCalculatorOpen(false)}
                onApply={onChange}
              />,
              document.body,
            )
          : null}
      </ClientOnly>
    </div>
  )
}
