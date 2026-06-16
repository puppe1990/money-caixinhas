import { useEffect, useState } from 'react'
import { Delete } from 'lucide-react'

import {
  INITIAL_CALCULATOR_DISPLAY,
  backspaceCalculatorDisplay,
  calculatorResultToMoneyInput,
  evaluateCalculatorDisplay,
  pressCalculatorKey,
  type CalculatorKey,
} from '#/lib/calculator'

type CalculatorModalProps = {
  open: boolean
  onClose: () => void
  onApply: (value: string) => void
}

const OPERATOR_LABELS: Record<'+' | '-' | '*' | '/', string> = {
  '+': 'Somar',
  '-': 'Subtrair',
  '*': 'Multiplicar',
  '/': 'Dividir',
}

const BUTTONS: Array<CalculatorKey | 'backspace' | 'apply'> = [
  'C',
  'backspace',
  '7',
  '8',
  '9',
  '/',
  '4',
  '5',
  '6',
  '*',
  '1',
  '2',
  '3',
  '-',
  '0',
  '.',
  '+',
]

export function CalculatorModal({
  open,
  onClose,
  onApply,
}: CalculatorModalProps) {
  const [display, setDisplay] = useState(INITIAL_CALCULATOR_DISPLAY)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setDisplay(INITIAL_CALCULATOR_DISPLAY)
    setError(null)
  }, [open])

  if (!open) {
    return null
  }

  function handleKeyPress(key: CalculatorKey | 'backspace') {
    setError(null)

    if (key === 'backspace') {
      setDisplay((current) => backspaceCalculatorDisplay(current))
      return
    }

    setDisplay((current) => pressCalculatorKey(current, key))
  }

  function handleApply() {
    try {
      const result = evaluateCalculatorDisplay(display)
      onApply(calculatorResultToMoneyInput(result))
      onClose()
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Não foi possível calcular',
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calculator-title"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3
            id="calculator-title"
            className="text-sm font-semibold text-slate-900"
          >
            Calculadora
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar calculadora"
          >
            ✕
          </button>
        </div>

        <div
          className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right font-mono text-lg text-slate-900"
          aria-live="polite"
        >
          {display}
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        <div className="grid grid-cols-4 gap-2">
          {BUTTONS.map((key) => {
            if (key === 'backspace') {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeyPress('backspace')}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
                  aria-label="Apagar último dígito"
                >
                  <Delete className="mx-auto h-4 w-4" aria-hidden="true" />
                </button>
              )
            }

            const isOperator =
              key === '+' || key === '-' || key === '*' || key === '/'
            const isClear = key === 'C'

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className={`rounded-lg border px-3 py-2 font-medium ${
                  isClear
                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : isOperator
                      ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
                aria-label={isOperator ? OPERATOR_LABELS[key] : key}
              >
                {key === '*' ? '×' : key === '/' ? '÷' : key}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleApply}
          className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
        >
          Usar resultado
        </button>
      </div>
    </div>
  )
}
