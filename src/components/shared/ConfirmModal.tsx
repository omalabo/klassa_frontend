import { useAppLanguage } from '../../i18n/appLanguage'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,  // ← Enlever la valeur par défaut ici
  cancelLabel,   // ← Enlever la valeur par défaut ici
  danger = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const { t } = useAppLanguage()  // ← Ajouter cette ligne
  
  if (!isOpen) return null

  // Valeurs par défaut avec traduction
  const finalConfirmLabel = confirmLabel || t('btn_validate')
  const finalCancelLabel = cancelLabel || t('cancel')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          padding: 24,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,.18)',
          animation: 'todayPopupIn .2s cubic-bezier(.34,1.56,.64,1)',
          textAlign: 'center'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icône */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: danger ? '#fef2f2' : '#eef2ff',
            border: `1px solid ${danger ? '#fecaca' : '#c7d2fe'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            margin: '0 auto 16px'
          }}
        >
          {danger ? '⚠️' : '❓'}
        </div>

        {/* Titre */}
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#1e293b' }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          {message}
        </p>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all .15s'
            }}
          >
            {finalCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: danger
                ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: danger
                ? '0 4px 14px rgba(239,68,68,.3)'
                : '0 4px 14px rgba(99,102,241,.3)',
              transition: 'all .15s'
            }}
          >
            {finalConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}