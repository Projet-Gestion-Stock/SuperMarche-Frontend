


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api'; 
import '@/styles/Commande.css';
import CommandeDetailModal from '@/pages/composants/CommandeDetailModal';
import Toast from '@/components/Notification'; // Assurez-vous que le chemin est correct

const CommandesPage = () => {
  const [selectedVenteId, setSelectedVenteId] = useState(null);
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const navigate = useNavigate();

  // Fonction pour ajouter une notification
  const addNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    
    // Retirer automatiquement après la durée spécifiée
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  // Fonction pour retirer une notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  useEffect(() => {
    const fetchVentes = async () => {
      try {
        setLoading(true);
        const response = await api.get('/ventes/staff/listerVentes');
        
        if (!response.data) {
          throw new Error('Aucune donnée reçue');
        }

        const ventesTransformees = response.data.map(vente => ({
          ...vente,
          status: vente.status || 'delivered',
          numeroRecu: vente.numeroRecu || `#${vente.id}`,
          produits: vente.produits || [],
          utilisateur: vente.utilisateur || { nom: 'Inconnu' }
        }));

        setVentes(ventesTransformees);
        addNotification('Commandes chargées avec succès', 'success');
      } catch (error) {
        console.error("Erreur API:", error);
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          const errorMsg = error.response?.data?.message || error.message || "Erreur lors de la récupération des ventes";
          setError(errorMsg);
          addNotification(errorMsg, 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVentes();
  }, []);

  // Filtrer les ventes
  const filteredVentes = ventes.filter(vente => {
    if (!vente) return false;
    
    // Filtre par statut
    if (filter !== 'all' && vente.status !== filter) return false;
    
    // Filtre par période
    const venteDate = new Date(vente.dateVente);
    const now = new Date();
    
    if (timeRange === 'today' && 
        !(venteDate.getDate() === now.getDate() && 
          venteDate.getMonth() === now.getMonth() && 
          venteDate.getFullYear() === now.getFullYear())) {
      return false;
    }
    
    // Filtre pour cette semaine
    if (timeRange === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Dimanche dernier
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (6 - now.getDay())); // Samedi prochain
      endOfWeek.setHours(23, 59, 59, 999); // Fin de journée
      
      if (venteDate < startOfWeek || venteDate > endOfWeek) {
        return false;
      }
    }
    
    if (timeRange === 'last30' && 
        venteDate < new Date(now.setDate(now.getDate() - 30))) {
      return false;
    }
    
    // Filtre personnalisé
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999); // Inclure toute la journée
      
      if (venteDate < startDate || venteDate > endDate) {
        return false;
      }
    }
    
    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesNumero = vente.numeroRecu?.toLowerCase().includes(term) || false;
      const matchesNom = vente.utilisateur?.nom?.toLowerCase().includes(term) || false;
      return matchesNumero || matchesNom;
    }
    
    return true;
  });

  const handlePDFAction = async (id, numeroRecu, action = 'download') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/ventes/staff/genererRecuPDF/${id}`, {
        responseType: 'blob',
        headers: { 'Accept': 'application/pdf' }
      });

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (action === 'download') {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `reçu_${numeroRecu.replace('', '')}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
          link.remove();
        }, 1000);
        
        addNotification('Téléchargement du PDF lancé', 'success');
      } else {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = pdfUrl;
        
        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              addNotification('Impression du reçu lancée', 'success');
            } catch (e) {
              console.error("Erreur impression:", e);
              window.open(pdfUrl, '_blank');
              addNotification('Ouverture du PDF dans un nouvel onglet', 'info');
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
      const errorMsg = `Erreur ${action === 'download' ? 'téléchargement' : 'impression'}: ${error.message}`;
      setError(errorMsg);
      addNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Exposez la fonction globalement (pour la modal)
  useEffect(() => {
    window.handlePDFAction = handlePDFAction;
    return () => {
      window.handlePDFAction = null;
    };
  }, []);

  if (error) {
    return (
      <div className="error-message">
        <p>Erreur: {error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  // Formatage de la date
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

  return (
    <div className="commandes-container">
      {/* Section Entête */}
      <div className="commandes-header">
        <h1>Commandes</h1>
        <div className="commandes-stats">
          <div className="stat-card">
            <span>Total Commandes</span>
            <h2>{ventes.length}</h2>
          </div>
        </div>
      </div>

      {/* Barre de contrôle */}
      <div className="commandes-controls">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Lancer une recherche..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Statut</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Tous</option>
              <option value="delivered">Livré</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Période</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="last30">30 Derniers Jours</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>

          {timeRange === 'custom' && (
            <div className="filter-group">
              <label>Date de début</label>
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
              />
              <label>Date de fin</label>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="commandes-list">
        {loading ? (
          <div className="loading">Chargement en cours...</div>
        ) : filteredVentes.length === 0 ? (
          <div className="no-results">Aucune commande trouvée</div>
        ) : (
          filteredVentes.map(vente => (
            <div key={vente.id} className="commande-card">
              <div className="commande-header">
                <h3>Commande {vente.numeroRecu}</h3>
                <span className={`status-badge ${vente.status}`}>
                  {vente.status === 'pending' && 'En Attente'}
                  {vente.status === 'preparing' && 'En Préparation'}
                  {vente.status === 'delivered' && 'Livré'}
                  {vente.status === 'cancelled' && 'Annulé'}
                </span>
              </div>

              <div className="commande-details">
                <div className="detail-item">
                  <span>Caissier:</span>
                  <strong>{vente.utilisateur.nom}</strong>
                </div>
                <div className="detail-item">
                  <span>Montant:</span>
                  <strong>{vente.montantTotal?.toLocaleString('fr-FR') || '0'} FCFA</strong>
                </div>
                <div className="detail-item">
                  <span>Nombre d'Articles:</span>
                  <strong>{vente.produits.length}</strong>
                </div>
                <div className="detail-item">
                  <span>Date:</span>
                  <strong>{formatDate(vente.dateVente)}</strong>
                </div>
              </div>

              <div className="commande-actions">
                <button 
                  className="btn-details"
                  onClick={() => setSelectedVenteId(vente.id)}
                >
                  Voir détails
                </button>
                <button 
                  className="btn-pdf"
                  onClick={() => handlePDFAction(vente.id, vente.numeroRecu, 'download')}
                >
                  Télécharger PDF
                </button>
                <button 
                  className="btn-print"
                  onClick={() => handlePDFAction(vente.id, vente.numeroRecu, 'print')}
                >
                  Imprimer le reçu
                </button>
              </div>
            </div>
          ))
        )}
      </div> 

      {/* Modal */}
      {selectedVenteId && (
        <CommandeDetailModal 
          venteId={selectedVenteId}
          onClose={() => setSelectedVenteId(null)}
        />
      )}

      {/* Notifications Toast */}
      <div className="toast-container">
        {notifications.map(notification => (
          <Toast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
            position="bottom-right"
          />
        ))}
      </div>
    </div>
  );
};

export default CommandesPage;