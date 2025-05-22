import '@/styles/ConfirmationModal.css';
export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}) {
  if (!isOpen) return null;

  return (
    <div className="modals-overlay">
      <div className="modals-content confirmations-modal">
        <h3>⚠️ {title}</h3>
        <p>{message}</p>
        <div className="confirmations-actions">
          <button className="cancel-btn" onClick={onClose}>
            Annuler
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}