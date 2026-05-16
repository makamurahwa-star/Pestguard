import { AlertTriangle, X } from 'lucide-react'

/**
 * ConfirmModal — replaces the ugly browser confirm() with a styled modal.
 *
 * Usage:
 *   const [confirmState, setConfirmState] = useState(null)
 *   ...
 *   onClick={() => setConfirmState({
 *     title: 'Delete this scan?',
 *     message: 'This cannot be undone.',
 *     confirmLabel: 'Delete',
 *     onConfirm: () => doTheThing(),
 *   })}
 *   ...
 *   <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
 */
export default function ConfirmModal({ state, onClose }) {
  if (!state) return null

  const {
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = true,
    onConfirm,
  } = state

  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-leaf-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full shadow-lifted overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
              ${danger ? 'bg-ember-100 text-ember-700' : 'bg-leaf-100 text-leaf-700'}`}>
              <AlertTriangle size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-bold text-leaf-950 leading-tight">{title}</h3>
              <p className="text-sm text-leaf-700 mt-2 leading-relaxed">{message}</p>
            </div>
            <button onClick={onClose} className="text-leaf-400 hover:text-leaf-700 flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-6 justify-end">
          <button onClick={onClose} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={danger ? 'btn-danger' : 'btn-primary'}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
