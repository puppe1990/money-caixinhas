import { useEffect, useState } from 'react'
import { Delete } from 'lucide-react'

import {
  INITIAL_CALCULATOR_DISPLAY,
  applyEqualsToDisplay,
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

type KeypadKey = CalculatorKey | 'backspace' | 'equals'

type KeypadButton =
  | { type: 'key'; key: KeypadKey; colSpan?: 1 | 2 }
  | { type: 'spacer' }

const OPERATOR_LABELS: Record<'+' | '-' | '*' | '/', string> = {
  '+': 'Somar',
  '-': 'Subtrair',
  '*': 'Multiplicar',
  '/': 'Dividir',
}

const KEYPAD_ROWS: KeypadButton[][] = [
  [
    { type: 'key', key: 'C' },
    { type: 'key', key: 'backspace' },
    { type: 'key', key: '/' },
    { type: 'key', key: '*' },
  ],
  [
    { type: 'key', key: '7' },
    { type: 'key', key: '8' },
    { type: 'key', key: '9' },
    { type: 'key', key: '-' },
  ],
  [
    { type: 'key', key: '4' },
    { type: 'key', key: '5' },
    { type: 'key', key: '6' },
    { type: 'key', key: '+' },
  ],
  [
    { type: 'key', key: '1' },
    { type: 'key', key: '2' },
    { type: 'key', key: '3' },
  ],
  [
    { type: 'key', key: '0', colSpan: 2 },
    { type: 'key', key: '.' },
    { type: 'key', key: 'equals' },
  ],
]

function getKeyLabel(key: KeypadKey): string {
  if (key === 'backspace') {
    return 'Apagar último dígito'
  }

  if (key === 'equals') {
    return 'Calcular'
  }

  if (key === '+' || key === '-' || key === '*' || key === '/') {
    return OPERATOR_LABELS[key]
  }

  return key
}

function getKeyDisplay(key: KeypadKey): string {
  if (key === '*') {
    return '×'
  }

  if (key === '/') {
    return '÷'
  }

  if (key === 'equals') {
    return '='
  }

  return key
}

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

  function handleKeyPress(key: KeypadKey) {
    setError(null)

    if (key === 'equals') {
      try {
        setDisplay((current) => applyEqualsToDisplay(current))
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Não foi possível calcular',
        )
      }
      return
    }

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
          className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-right font-mono text-2xl text-slate-900"
          aria-live="polite"
        >
          {display}
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        <div className="grid grid-cols-4 gap-2">
          {KEYPAD_ROWS.flatMap((row, rowIndex) =>
            row.map((button, buttonIndex) => {
              if (button.type === 'spacer') {
                return (
                  <div
                    key={`${rowIndex}-spacer-${buttonIndex}`}
                    aria-hidden="true"
                    className="h-12"
                  />
                )
              }

              const { key, colSpan = 1 } = button
              const isOperator =
                key === '+' || key === '-' || key === '*' || key === '/'
              const isClear = key === 'C'
              const isBackspace = key === 'backspace'
              const isEquals = key === 'equals'

              return (
                <button
                  key={`${rowIndex}-${key}-${buttonIndex}`}
                  type="button"
                  onClick={() => handleKeyPress(key)}
                  className={`flex h-12 items-center justify-center rounded-xl border text-base font-semibold transition-colors ${
                    isEquals
                      ? 'border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700'
                      : isClear
                        ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : isBackspace
                          ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          : isOperator
                            ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                            : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                  } ${colSpan === 2 ? 'col-span-2' : ''}`}
                  aria-label={getKeyLabel(key)}
                >
                  {isBackspace ? (
                    <Delete className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    getKeyDisplay(key)
                  )}
                </button>
              )
            }),
          )}
        </div>

        <button
          type="button"
          onClick={handleApply}
          className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800"
        >
          Usar resultado
        </button>
      </div>
    </div>
  )
}
