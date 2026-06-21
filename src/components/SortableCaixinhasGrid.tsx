import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { useMediaQuery } from '#/hooks/useMediaQuery'
import { formatCurrency } from '#/lib/caixinhas/domain'
import type { CaixinhaProgress } from '#/lib/caixinhas/types'

type SortableCaixinhasGridProps = {
  caixinhas: CaixinhaProgress[]
  month: number
  year: number
  isReordering: boolean
  onReorder: (orderedIds: number[]) => Promise<void>
  onEdit: (caixinha: CaixinhaProgress) => void
}

function CaixinhaCard({
  caixinha,
  onEdit,
  dragHandle,
}: {
  caixinha: CaixinhaProgress
  onEdit: (caixinha: CaixinhaProgress) => void
  dragHandle?: ReactNode
}) {
  return (
    <article className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {dragHandle}
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-900">{caixinha.name}</h4>
            <p className="text-sm text-slate-600">
              Meta: {formatCurrency(caixinha.targetAmountCents)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {caixinha.completed ? (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
              Concluída
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onEdit(caixinha)}
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Editar
          </button>
        </div>
      </div>

      <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${caixinha.percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-slate-700">
        <span>
          {formatCurrency(caixinha.savedCents)} /{' '}
          {formatCurrency(caixinha.targetAmountCents)}
        </span>
        <span>{caixinha.percent}%</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Faltam {formatCurrency(caixinha.remainingCents)}
      </p>
    </article>
  )
}

function SortableCaixinhaCard({
  caixinha,
  onEdit,
  isReordering,
}: {
  caixinha: CaixinhaProgress
  onEdit: (caixinha: CaixinhaProgress) => void
  isReordering: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: caixinha.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragHandle = (
    <button
      type="button"
      className="mt-0.5 inline-flex min-h-10 min-w-10 shrink-0 cursor-grab items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-600 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={`Reordenar ${caixinha.name}`}
      disabled={isReordering}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'z-10 opacity-80' : undefined}
    >
      <CaixinhaCard
        caixinha={caixinha}
        onEdit={onEdit}
        dragHandle={dragHandle}
      />
    </div>
  )
}

export function SortableCaixinhasGrid({
  caixinhas,
  month,
  year,
  isReordering,
  onReorder,
  onEdit,
}: SortableCaixinhasGridProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [items, setItems] = useState(caixinhas)

  useEffect(() => {
    setItems(caixinhas)
  }, [caixinhas])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    const nextItems = arrayMove(items, oldIndex, newIndex)

    setItems(nextItems)

    try {
      await onReorder(nextItems.map((item) => item.id))
    } catch {
      setItems(caixinhas)
    }
  }

  const gridClassName = 'grid gap-4 md:grid-cols-2'

  if (!isDesktop) {
    return (
      <div className={gridClassName} data-period={`${month}/${year}`}>
        {items.map((caixinha) => (
          <CaixinhaCard key={caixinha.id} caixinha={caixinha} onEdit={onEdit} />
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={rectSortingStrategy}
      >
        <div className={gridClassName} data-period={`${month}/${year}`}>
          {items.map((caixinha) => (
            <SortableCaixinhaCard
              key={caixinha.id}
              caixinha={caixinha}
              onEdit={onEdit}
              isReordering={isReordering}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
