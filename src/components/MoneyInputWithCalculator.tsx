import { ClientOnly } from '@tanstack/react-router'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Calculator } from 'lucide-react'

import { pastedExpressionToMoneyInput } from '#/lib/calculator'

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
  const [pastedCalculation, setPastedCalculation] = useState<string | null>(
    null,
  )

  function handleChange(nextValue: string) {
    setPastedCalculation(null)
    onChange(nextValue)
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted =
      event.clipboardData.getData('text/plain') ||
      event.clipboardData.getData('text')
    const result = pastedExpressionToMoneyInput(pasted)

    if (!result) {
      return
    }

    event.preventDefault()
    setPastedCalculation(`${pasted.trim().replace(/\s+/g, ' ')} = ${result}`)
    onChange(result)
  }

  return (
    <>
      <div className="relative">
        <input
          id={id}
          className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-11"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onPaste={handlePaste}
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
                  onApply={handleChange}
                />,
                document.body,
              )
            : null}
        </ClientOnly>
      </div>
      {pastedCalculation ? (
        <p role="status" className="mt-1 text-xs text-slate-500">
          Cálculo colado: {pastedCalculation}
        </p>
      ) : null}
    </>
  )
}
