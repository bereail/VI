import styles from './ConfirmModal.module.css'

export function ConfirmModal({ message, confirmLabel = 'Aceptar', cancelLabel = 'Cancelar', onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button
            className="btn"
            style={{ background: 'var(--danger)', color: '#fff', fontWeight: 600 }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
