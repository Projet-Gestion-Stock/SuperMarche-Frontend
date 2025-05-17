import { useEffect, useState } from 'react';
import api from '@/services/api';
import '@/styles/CommandeDetailModal.css';

const CommandeDetailModal = ({ venteId, onClose }) => {
  const [vente, setVente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVente = async () => {
      try {
        const response = await api.get(`/ventes/staff/recupererVente/${venteId}`);
        setVente(response.data);
      } catch (err) {
        console.error("Erreur:", err);
        setError("Erreur lors du chargement des détails");
      } finally {
        setLoading(false);
      }
    };

    if (venteId) fetchVente();
  }, [venteId]);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (!venteId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        {loading ? (
          <div className="loading">Chargement en cours...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : vente ? (
          <>
            <h2>Détails de la commande {vente.numeroRecu}</h2>
            
            <div className="detail-grid">
              <div className="detail-section">
                <h3>Caissier</h3>
                <p><strong>Nom:</strong> {vente.utilisateur.nom}</p>
                <p><strong>Email:</strong> {vente.utilisateur.email}</p>
                <p><strong>Rôle:</strong> {vente.utilisateur.role}</p>
              </div>

              <div className="detail-section-paiement">
                <h3>Paiement</h3>
                <p><strong>Total:</strong> {vente.montantTotal?.toLocaleString('fr-FR')} FCFA</p>
                <p><strong>Montant donné:</strong> {vente.montantDonne?.toLocaleString('fr-FR')} FCFA</p>
                <p><strong>Monnaie rendue:</strong> {vente.monnaieRendue?.toLocaleString('fr-FR')} FCFA</p>
                <p><strong>Méthode:</strong> {vente.methodePaiement}</p>
                <p><strong>Date:</strong> {formatDate(vente.dateVente)}</p>
              </div>

              <div className="detail-section full-width">
                <h3>Produits ({vente.produits.length})</h3>
                <div className="produits-list">
                  {vente.produits.map((produit, index) => (
                    <div key={index} className="produit-item">
                      <span className="produit-nom">{produit.produitNom}</span>
                      <span className="produit-quantite">x{produit.quantiteVendue}</span>
                      <span className="produit-prix">{produit.prixUnitaire?.toLocaleString('fr-FR')} FCFA</span>
                      <span className="produit-total">
                        {(produit.quantiteVendue * produit.prixUnitaire)?.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="no-data">Aucune donnée disponible</div>
        )}
      </div>
    </div>
  );
};

export default CommandeDetailModal;