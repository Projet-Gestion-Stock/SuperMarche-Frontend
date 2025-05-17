import { useState, useEffect } from 'react';
import api from '@/services/api';
import '@/styles/Caisse.css';
import Toast from '@/components/Notification';

const CaissePage = () => {
  const [produits, setProduits] = useState([]);
  const [panier, setPanier] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [montantRecu, setMontantRecu] = useState('');
  const [methodePaiement, setMethodePaiement] = useState('Espèces');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastSaleInfo, setLastSaleInfo] = useState({ id: null, numeroRecu: '' });
  const [categories, setCategories] = useState(['Tous']);

  const [categorieActive, setCategorieActive] = useState('Tous');
  const [toasts, setToasts] = useState([]);

  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  // Fonction pour ajouter une notification
  const addToast = (message, type = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };


  // Fonction pour supprimer une notification
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Chargement des produits
  useEffect(() => {
    const chargerProduits = async () => {
      try {
        const response = await api.get('/produits/staff/listerProduits');
        setProduits(response.data);

        // Extraire les catégories uniques à partir des produits
        const uniqueCategories = ['Tous', ...new Set(response.data.map(p => p.categorie))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error("Erreur chargement produits:", error);
        addToast('Erreur lors du chargement des produits', 'error');
      }
    };
    chargerProduits();
  }, []);

  // Filtrage des produits
  const produitsFiltres = produits.filter(produit => {
    const matchCategorie = categorieActive === 'Tous' || produit.categorie === categorieActive;
    const matchRecherche = produit.produit.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategorie && (searchTerm === '' || matchRecherche);
  });

  // Fonction pour déterminer l'état du stock
  const getStockStatus = (produit) => {
    if (produit.quantiteDisponible <= 0) {
      return { status: 'rupture', text: 'Rupture de stock' };
    } else if (produit.quantiteDisponible <= produit.seuilAlerte) {
      return { status: 'faible', text: 'Stock faible' };
    }
    return { status: 'normal', text: '' };
  };

  // Fonction pour convertir en nombre en évitant les NaN
  const safeParseFloat = (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Fonction pour des calculs monétaires précis
  const preciseCalculation = (a, b) => {
    return (Math.round(a * 100) - Math.round(b * 100)) / 100;
  };

  // Fonction pour formater correctement les montants
  const formatMoney = (amount) => {
    return preciseCalculation(amount, 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calcul du total
  const total = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);

  // Gestion du panier
  const ajouterAuPanier = (produit) => {
    const stockStatus = getStockStatus(produit);
    if (stockStatus.status === 'rupture') {
      addToast(`${produit.produit} est en rupture de stock`, 'warning');
      return;
    }
    
    setPanier(prev => {
      const existe = prev.find(item => item.id === produit.id);
      if (existe) {
        // Vérifie si la quantité demandée dépasse le stock disponible
        if (existe.quantite + 1 > produit.quantiteDisponible) {
          addToast(`Stock insuffisant! Il ne reste que ${produit.quantiteDisponible} unité(s) de ${produit.produit}`, 'warning', 2000);
          return prev;
        }
        addToast(`${produit.produit} ajouté au panier`, 'success', 2000);
        return prev.map(item => 
          item.id === produit.id 
            ? {...item, quantite: item.quantite + 1} 
            : item
        );
      } else {
        addToast(`${produit.produit} ajouté au panier`, 'success', 2000);
        return [...prev, {...produit, quantite: 1}];
      }
    });
  };

  const modifierQuantite = (id, delta) => {
    setPanier(prev => {
      const produit = prev.find(item => item.id === id);
      if (delta > 0 && produit.quantite + delta > produit.quantiteDisponible) {
        addToast(`Stock insuffisant! Il ne reste que ${produit.quantiteDisponible} unité(s) de ${produit.produit}`, 'warning', 2000);
        return prev;
      }
      return prev.map(item => 
        item.id === id 
          ? {...item, quantite: Math.max(1, item.quantite + delta)} 
          : item
      );
    });
  };

  const retirerDuPanier = (id) => {
    setPanier(prev => {
      const produit = prev.find(item => item.id === id);
      if (produit) {
        addToast(`${produit.produit} retiré du panier`, 'info', 2000);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  // Enregistrement de la vente
  const validerVente = async () => {
    if (parseFloat(montantRecu) < total) {
      addToast('Le montant reçu doit être supérieur ou égal au total', 'error');
      return;
    }
    
    try {
      const venteRequest = {
        produits: panier.map(item => ({
          produitId: item.id,
          quantite: item.quantite
        })),
        methodePaiement,
        montantDonne: parseFloat(montantRecu)
      };

      const response = await api.post('/ventes/staff/enregistrerVente', venteRequest);
      
      // Stocker les infos de la vente pour le reçu
      setLastSaleInfo({
        id: response.data.id,
        numeroRecu: response.data.numeroRecu || `CMD-${Date.now()}`
      });
      
      setPanier([]);
      setMontantRecu('');
      setShowConfirmation(true);
      addToast('Vente enregistrée avec succès!', 'success');
    } catch (error) {
      console.error("Erreur enregistrement:", error);
      addToast('Erreur lors de l\'enregistrement de la vente', 'error');
    }
  };


  // Fonction pour gérer les actions PDF - MODIFIÉ
  const handlePDFAction = async (action = 'download') => {
    try {
      if (!lastSaleInfo.id) return;
      
      const response = await api.get(`/ventes/staff/genererRecuPDF/${lastSaleInfo.id}`, {
        responseType: 'blob',
        headers: { 'Accept': 'application/pdf' }
      });

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (action === 'download') {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `reçu_${lastSaleInfo.numeroRecu.replace(/\s/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
          link.remove();
        }, 1000);
        
        addToast('Téléchargement du PDF lancé', 'success');
      } else {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = pdfUrl;
        
        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              addToast('Impression du reçu lancée', 'success');
            } catch (e) {
              console.error("Erreur impression:", e);
              window.open(pdfUrl, '_blank');
              addToast('Ouverture du PDF dans un nouvel onglet', 'info');
            }
            
            setTimeout(() => {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(pdfUrl);
            }, 30000);
          }, 1000);
        };
        
        document.body.appendChild(iframe);
      }

    } catch (error) {
      console.error("Erreur PDF:", error);
      addToast(`Erreur ${action === 'download' ? 'téléchargement' : 'impression'} du reçu`, 'error');
    } finally {
      setShowConfirmation(false);
    }
  };

  return (
    <div className="caisse-container">
      {/* Notifications Toast */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
          position="bottom-right"
        />
      ))}

      {/* Modal de confirmation */}
      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3 className="modal-title">Commande confirmée !</h3>
            <p className="modal-message">
              La commande {lastSaleInfo.numeroRecu} a été enregistrée avec succès.
            </p>
            
            <div className="modal-actions">
              <button 
                className="modal-btn modal-btn-primary"
                onClick={() => handlePDFAction('download')}
              >
                Télécharger le ticket
              </button>
              
              <button 
                className="modal-btn modal-btn-print"
                onClick={() => handlePDFAction('print')}
              >
                Imprimer le ticket
              </button>
              
              <button 
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowConfirmation(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="caisse-header">
        <h2>Caisse</h2>
        
        {/* Catégories */}
        <div className="categories">
          {categories.map(cat => (
            <button
              key={cat}
              className={`categorie-btn ${cat === categorieActive ? 'active' : ''}`}
              onClick={() => setCategorieActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Rechercher produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Contenu principal */}
      <div className="caisse-content">
        {/* Colonne gauche - Produits */}
        <div className="produits-col">
          <div className="produits-grid">
            {produitsFiltres.map(produit => {
              const stockStatus = getStockStatus(produit);
              const isDisabled = stockStatus.status === 'rupture';
              
              return (
                <div 
                  key={produit.id} 
                  className={`produit-card ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && ajouterAuPanier(produit)}
                >
                  {stockStatus.text && (
                    <span className={`stock-badge stock-${stockStatus.status}`}>
                      {stockStatus.text}
                    </span>
                  )}
                  
                  {produit.imageUrl && (
                    <img src={produit.imageUrl} alt={produit.produit} className="produit-image" />
                  )}
                  <h3>{produit.produit}</h3>
                  <div className="produit-nom-alt">{produit.description}</div>
                  <p>{produit.prix.toLocaleString('fr-FR')} FCFA</p>
                  <div className="stock-info">
                    Stock: {produit.quantiteDisponible}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colonne droite - Panier */}
        <div className="panier-col">
          <div className="panier-items">
            {panier.length === 0 ? (
              <div className="panier-vide">Panier vide</div>
            ) : (
              panier.map(item => (
                <div key={item.id} className="panier-item">
                  <div className="item-info">
                    <span>{item.produit}</span>
                    <span>{item.prix.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="item-actions">
                    <button onClick={(e) => { e.stopPropagation(); modifierQuantite(item.id, -1); }}>-</button>
                    <span>{item.quantite}</span>
                    <button onClick={(e) => { e.stopPropagation(); modifierQuantite(item.id, 1); }}>+</button>
                    <button 
                      className="remove-btn"
                      onClick={(e) => { e.stopPropagation(); retirerDuPanier(item.id); }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total et paiement */}
          <div className="paiement-section">
            <div className="total-line">
              <span>Total</span>
              <span>{total.toLocaleString('fr-FR')} FCFA</span>
            </div>

            <div className="details-paiement">
              <h3>Détails du Paiement</h3>
              
              <select
                value={methodePaiement}
                onChange={(e) => setMethodePaiement(e.target.value)}
              >
                <option value="Espèces">Espèces</option>
                <option value="Carte">Orange Money</option>
                <option value="Mobile Money">Moov Money</option>
              </select>

              <div className="montant-recu">
                <label>Montant Reçu</label>
                <input
                  type="number"
                  value={montantRecu}
                  className="no-spinner"
                  onChange={(e) => setMontantRecu(e.target.value)}
                />
              </div>

              {montantRecu && (
                <div className="monnaie-rendue">
                  <span>Monnaie à rendre</span>
                  <span>
                    {formatMoney(safeParseFloat(montantRecu) - total)} FCFA
                  </span>
                </div>
              )}

              <button 
                className="valider-btn"
                onClick={validerVente}
                disabled={!montantRecu || safeParseFloat(montantRecu) < total || panier.length === 0}
              >
                Valider la commande
              </button>

              {safeParseFloat(montantRecu) < total && (
                <p className="error-msg">Montant reçu doit être supérieur ou égal au total</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaissePage;
