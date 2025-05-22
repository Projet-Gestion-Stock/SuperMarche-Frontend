import { useState, useEffect } from 'react';
import api from '@/services/api';
import Toast from '@/components/Notification';
import AjoutProduitModal from '@/pages/composants/AjoutProduitModal';
import MiseAJourStockModal from '@/pages/composants/MiseAJourStockModal';
import ConfirmationSuppressionModal from '@/pages/composants/ConfirmationSuppressionModal';
import '@/styles/Inventaire.css';

export default function Inventaire() {
  const [produits, setProduits] = useState([]);
  const [alertesStock, setAlertesStock] = useState([]);
  const [produitsExpires, setProduitsExpires] = useState([]);
  const [produitsRupture, setProduitsRupture] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState(['Tous']);
  const [categorieActive, setCategorieActive] = useState('Tous');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedProduit, setSelectedProduit] = useState(null);

  // Fonction pour ouvrir les modales
  const openModal = (modalType, produit = null) => {
    setSelectedProduit(produit);
    setActiveModal(modalType);
  };

  // Fonction pour fermer les modales
  const closeModal = () => {
    setActiveModal(null);
    setSelectedProduit(null);
  };

  // Gestion du scroll
  useEffect(() => {
    if (activeModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [activeModal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [produitsRes, alertesRes, expiresRes, ruptureRes, statsRes] = await Promise.all([
          api.get('/produits/staff/listerProduits'),
          api.get('/stock/gerant/alerte'),
          api.get('/produits/gerant/avec-statut-expiration'),
          api.get('/produits/gerant/listerProduitsEnRupture'),
          api.get('/stock/gerant/statistiquesStock')
        ]);

        setProduits(produitsRes.data);
        setAlertesStock(alertesRes.data);
        setProduitsExpires(expiresRes.data);
        setProduitsRupture(ruptureRes.data);
        setStats(statsRes.data);
        
        const uniqueCategories = ['Tous', ...new Set(produitsRes.data.map(p => p.categorie))];
        setCategories(uniqueCategories);
      } catch (error) {
        showNotification('Erreur lors du chargement des données', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      if (dateString.includes('-')) {
        const [day, month, year] = dateString.split('-');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString();
      }
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.error("Erreur de formatage de date:", e);
      return 'N/A';
    }
  };

  const handleDesactiverProduit = async (id) => {
    try {
      await api.post(`/produits/gerant/desactiverProduit/${id}`);
      setProduits(produits.filter(p => p.id !== id));
      showNotification('Produit désactivé avec succès', 'success');
      closeModal();
    } catch (error) {
      showNotification('Erreur lors de la désactivation', 'error');
    }
  };

  const handleMiseAJourStock = async (produitId, quantite) => {
    try {
      await api.put(`/stock/gerant/mettreAJourStock/${produitId}`, {
        quantiteAjoutee: quantite
      });
      showNotification('Stock mis à jour avec succès', 'success');
      const res = await api.get('/produits/staff/listerProduits');
      setProduits(res.data);
      closeModal();
    } catch (error) {
      showNotification('Erreur lors de la mise à jour du stock', 'error');
    }
  };

  const produitsFiltres = produits.filter(produit => {
    const matchCategorie = categorieActive === 'Tous' || produit.categorie === categorieActive;
    const matchRecherche = produit.produit.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategorie && (searchTerm === '' || matchRecherche);
  });

  // Fonction de normalisation des statuts
  const getStatutClasse = (statut) => {
    const statutNormalise = statut
      .toLowerCase()
      .replace(/[éÉèÈêÊ]/g, 'e')  // Supprime les accents
      .replace(/\s+/g, '_');      // Remplace les espaces par _

    // Mappage des statuts longs vers les noms de classes CSS
    if (statutNormalise.includes('perime')) return 'expire';
    if (statutNormalise.includes('alerte')) return 'alerte';
    if (statutNormalise.includes('bon_etat')) return 'bon_etat';
    return statutNormalise; // Fallback
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="inventaire-container">
      <h1>Inventaire (Stock)</h1>
      
      <section className="dashboard-section">
        <h2>Gestion des Stocks</h2>
        <p>Gérez votre inventaire et suivez vos stocks</p>
        
        <div className="alertes-container">
          {/* Alertes stock faible */}
          <div className="alerte-box">
            <h3>
              <input type="checkbox" checked readOnly />
              Produits en stock faible
            </h3>
            <ul>
              {alertesStock.map((alerte, index) => (
                <li key={index}>
                  {alerte.produit.produit}: {alerte.quantite} {alerte.produit.unite} (Min: {alerte.seuilAlerte})
                </li>
              ))}
            </ul>
          </div>
          
          {/* Produits en rupture */}
          <div className="alerte-box">
            <h3>
              <input type="checkbox" checked readOnly />
              Produits en rupture
            </h3>
            <ul>
              {produitsRupture.map((produit, index) => (
                <li key={index}>
                  {produit.produit} - {produit.categorie}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Produits expirés */}
          <div className="alerte-box">
            <h3>
              <input type="checkbox" checked readOnly />
              Produits expirés
            </h3>
            <ul>
              {produitsExpires.map((produit, index) => (
                <li key={index}>
                  {produit.produit} - Expire le {new Date(produit.dateExpiration).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="inventaire-grid">
        {/* Statistiques */}
        <section className="stats-section">
          <h3>Statistiques</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total produits</h4>
              <p>{stats.totalProduitsEnStock || 0}</p>
            </div>
            <div className="stat-card">
              <h4>Stocks faibles</h4>
              <p>{stats.stocksFaibles || 0}</p>
            </div>
            <div className="stat-card">
              <h4>En rupture</h4>
              <p>{stats.stocksEnRupture || 0}</p>
            </div>
            <div className="stat-card">
              <h4>Quantité totale</h4>
              <p>{stats.quantiteTotale || 0}</p>
            </div>
          </div>
        </section>

        {/* Section Recherche et Filtres */}
        <section className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="categories-filter">
            {categories.map((categorie) => (
              <button
                key={categorie}
                className={`category-btn ${categorieActive === categorie ? 'active' : ''}`}
                onClick={() => setCategorieActive(categorie)}
              >
                {categorie}
              </button>
            ))}
          </div>
        </section>

        {/* Liste des produits */}
        <section className="produits-section">
          <div className="section-header">
            <h3>Tous les produits</h3>
            {/* Bouton d'ajout */}
            <button 
              className="btn-primary"
              onClick={() => openModal('ajout')}
            >
              Ajouter un Produit
            </button>
          </div>
          
          <div className="produits-table-container">
            <table className="produits-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Stock</th>
                  <th>Prix</th>
                  <th>Expiration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {produitsFiltres.map(produit => (
                  <tr key={produit.id} className={produit.quantiteDisponible <= 0 ? 'out-of-stock' : ''}>
                    <td>
                      <div className="produit-info">
                        {produit.imageUrl && (
                          <img src={produit.imageUrl} alt={produit.produit} className="produits-image" />
                        )}
                        <div>
                          <span className="produit-name">{produit.produit}</span>
                          <span className="produit-supplier">{produit.fournisseur}</span>
                        </div>
                      </div>
                    </td>
                    <td>{produit.categorie}</td>
                    <td>
                      <span className={`stock-quantity ${produit.quantiteDisponible < produit.seuilAlerte ? 'low-stock' : ''}`}>
                        {produit.quantiteDisponible} {produit.unite}
                      </span>
                      {produit.quantiteDisponible < produit.seuilAlerte && (
                        <span className="alerte-icon">⚠️</span>
                      )}
                    </td>
                    <td>{produit.prix.toLocaleString()} FCFA</td>
                    <td>
                      {formatDate(produit.dateExpiration)}
                      {produit.statutExpiration && (
                        <span className={`expiration-status ${getStatutClasse(produit.statutExpiration)}`}>
                          {produit.statutExpiration}
                        </span>
                      )}
                    </td>
                    {/* Boutons d'action */}
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => openModal('stock', produit)}
                          className="btn-small btn-warning"
                        >
                          <span className="desktop-text">Stock</span>
                          <span className="mobile-icon">📦</span>
                        </button>
                        <button 
                          className="btn-small btn-danger"
                          onClick={() => openModal('suppression', produit)}
                        >
                          <span className="desktop-text">Supprimer</span>
                          <span className="mobile-icon">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


        {/* Modals conditionnels */}
        {activeModal === 'ajout' && (
          <div className="modal-overlay">
            <div className="modal">
              <AjoutProduitModal 
                showNotification={showNotification} 
                setProduits={setProduits} 
                categories={categories.filter(c => c !== 'Tous')}
                onClose={closeModal}
              />
            </div>
          </div>
        )}

        {activeModal === 'stock' && selectedProduit && (
          <div className="modal-overlay">
            <div className="modal stock-modal"> 
              <MiseAJourStockModal 
                produit={selectedProduit}
                handleMiseAJourStock={handleMiseAJourStock}
                onClose={closeModal}
              />
            </div>
          </div>
        )}

        {activeModal === 'suppression' && selectedProduit && (
          <div className="modal-overlay">
            <div className="modal confirm-modal">
              <ConfirmationSuppressionModal
                produit={selectedProduit}
                onConfirm={handleDesactiverProduit}
                onClose={closeModal}
              />
            </div>
          </div>
        )}

        {notification && (
          <Toast 
            message={notification.message} 
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>  
  );
}