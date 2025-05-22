import { useState } from 'react';

export default function MiseAJourStockModal({ produit, handleMiseAJourStock, onClose }) {
  const [quantite, setQuantite] = useState('');
  const [operation, setOperation] = useState('add');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quantite || isNaN(quantite)) return;
    
    const qty = operation === 'add' ? parseInt(quantite) : -parseInt(quantite);
    handleMiseAJourStock(produit.id, qty);
  };

  return (
    <div className="modal-content">
        <div className="modal-header">
            <h3>Gestion du Stock</h3>
            <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="stock-info">
          <span className="product-name">{produit.produit}</span>
          <span className="current-stock">
            {produit.quantiteDisponible} {produit.unite}
            {produit.seuilAlerte && (
              <span className="seuil-alerte"> (Seuil: {produit.seuilAlerte})</span>
            )}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="operation-toggle">
            <button
              type="button"
              className={`toggles-btn ${operation === 'add' ? 'active' : ''}`}
              onClick={() => setOperation('add')}
              data-operation="add"
            >
              Ajouter
            </button>
            <button
              type="button"
              className={`toggles-btn ${operation === 'remove' ? 'active' : ''}`}
              onClick={() => setOperation('remove')}
              data-operation="remove"
            >
              Retirer
            </button>
          </div>

          <div className="form-group">
            <label>Quantité</label>
            <div className="quantity-input">
              <input
                type="number"
                min="1"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                placeholder="0"
                required
              />
              <span className="unit">{produit.unite}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button 
              type="submit" 
              className={`btn-primary ${operation === 'add' ? 'btn-add' : 'btn-remove'}`}
            >
              {operation === 'add' ? 'Ajouter au stock' : 'Retirer du stock'}
            </button>
          </div>
        </form>
    
    </div>
  );
}