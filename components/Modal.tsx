'use client'

interface Props {
  type: 'success' | 'error'
  message: string
  onClose: () => void
}

/** Simple centered modal for bot start/stop feedback. */
export default function Modal({ type, message, onClose }: Props) {
  const accent = type === 'success' ? '#00d17a' : '#ff4d6d'
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="card max-w-sm w-full"
        style={{ borderColor: `${accent}55` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg font-bold"
            style={{ background: `${accent}1a`, color: accent }}
          >
            {type === 'success' ? '✓' : '!'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">
              {type === 'success' ? 'Success' : 'Something went wrong'}
            </p>
            <p className="text-gray-400 text-sm mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="btn-primary">
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
