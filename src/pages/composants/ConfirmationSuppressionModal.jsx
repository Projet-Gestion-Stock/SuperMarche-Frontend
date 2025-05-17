export default function ConfirmationSuppressionModal({ produit, onConfirm, onClose }) {
  const handleConfirm = () => {
    onConfirm(produit.id);
  };

  return (
    <div className="modal-content">
      <div className="warning-icon">⚠️</div>
      <h3>Supprimer ce produit ?</h3>
      <p>Le produit "{produit.produit}" sera définitivement supprimé.</p>
      
      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Annuler
        </button>
        <button type="button" className="btn-danger" onClick={handleConfirm}>
          Confirmer la suppression
        </button>
      </div>
    </div>
  );
}