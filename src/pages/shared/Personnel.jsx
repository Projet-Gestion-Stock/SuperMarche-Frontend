import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiUser } from 'react-icons/fi';
import api from '@/services/api';
import PersonnelModal from '@/pages/composants/PersonnelModal';
import ConfirmationModal from '@/pages/composants/ConfirmationModal';
import Toast from '@/components/Notification';
import '@/styles/Personnel.css';

export default function Personnel() {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  // Récupérer la liste du personnel
  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/gerant/liste');
      // Conversion explicite de l'état actif en booléen
      const formattedPersonnel = response.data.map(user => ({
        ...user,
        actif: Boolean(user.actif)
      }));
      setPersonnel(formattedPersonnel);
    } catch (error) {
      console.error("Erreur lors de la récupération du personnel:", error);
      showNotification(
        error.response?.status === 403 
          ? "Accès refusé - Veuillez vous reconnecter" 
          : "Erreur lors du chargement des utilisateurs", 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtrer selon la recherche
  const filteredPersonnel = personnel.filter(user =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gestion des actions
  const handleAdd = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/user/gerant/delete/${userToDelete.id}`);
      setPersonnel(personnel.filter(u => u.id !== userToDelete.id));
      showNotification("Utilisateur supprimé avec succès", 'success');
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showNotification("Erreur lors de la suppression", 'error');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const toggleActivation = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.post(`/user/gerant/${userId}/activation`, null, {
        params: { actif: newStatus }
      });
      
      // Mise à jour optimiste de l'état local
      setPersonnel(personnel.map(u => 
        u.id === userId ? { ...u, actif: newStatus } : u
      ));
      
      showNotification(`Utilisateur ${newStatus ? 'activé' : 'désactivé'}`, 'success');
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
      showNotification(
        error.response?.data?.message || "Erreur lors de la modification", 
        'error'
      );
      // Recharger les données pour synchroniser avec le serveur
      fetchPersonnel();
    }
  };

  const handleSubmit = async (userData) => {
    try {
      if (currentUser) {
        // Modification existante (inchangée)
        const response = await api.put(`/user/gerant/modifier/${currentUser.id}`, {
          nom: userData.nom,
          email: userData.email,
          role: userData.role
        });
        setPersonnel(personnel.map(u => u.id === currentUser.id ? response.data : u));
        showNotification("Utilisateur mis à jour", 'success');
      } else {
        // AJOUT - Version corrigée et testée
        const payload = {
          nom: userData.nom,
          email: userData.email,
          motDePasse: userData.motDePasse, // Exactement comme dans Postman
          role: userData.role
        };

        const response = await api.post('/user/gerant/inscription', payload);
        
        // Vérification de la réponse
        if (!response.data?.id) {
          throw new Error("Réponse incomplète du serveur");
        }

        // Mise à jour optimiste de l'état
        setPersonnel([...personnel, response.data]);
        showNotification("Utilisateur créé avec succès", 'success');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur complète:", {
        error: error.response?.data || error.message,
        config: error.config
      });

      let errorMsg = "Erreur lors de l'enregistrement";
      if (error.response?.status === 400) {
        errorMsg = "Données invalides - Vérifiez les champs";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }

      showNotification(errorMsg, 'error');
    }
  };

  return (
    <div className="personnel-container">
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)}
        />
      )}

      <div className="page-header">
        <h1>Gestion du Personnel</h1>
        <p className="page-description">Gérez les comptes du personnel et leurs accès.</p>
      </div>

      <div className="controls">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-button" onClick={handleAdd}>
          <FiPlus /> Ajouter un membre
        </button>
      </div>

      <div className="personnel-list">
        {loading ? (
          <div className="loading">Chargement en cours...</div>
        ) : filteredPersonnel.length === 0 ? (
          <div className="no-results">
            {searchTerm ? "Aucun résultat trouvé" : "Aucun membre enregistré"}
          </div>
        ) : (
          filteredPersonnel.map((user) => (
            <PersonnelCard 
              key={user.id} 
              user={user} 
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onToggleActivation={toggleActivation}
            />
          ))
        )}
      </div>

      <PersonnelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={currentUser}
        onSubmit={handleSubmit}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ${userToDelete?.nom} ?`}
      />
    </div>
  );
}

function PersonnelCard({ user, onEdit, onDelete, onToggleActivation }) {
  return (
    <div className="personnel-card">
      <div className="user-avatar">
        <FiUser />
      </div>
      
      <div className="user-info">
        <h3>{user.nom}</h3>
        <div className="info-row">
          <span>{user.email}</span>
        </div>
        <div className="user-meta">
          <span className="user-role">{user.role}</span>
          <button 
            className={`toggle-btn ${user.actif ? 'active' : ''}`}
            onClick={() => onToggleActivation(user.id, user.actif)}
            aria-label={user.actif ? 'Désactiver' : 'Activer'}
          >
            {user.actif ? 'Actif' : 'Inactif'}
          </button>
        </div>
      </div>
      
      <div className="user-actions">
        <button className="edit-btn" onClick={() => onEdit(user)}>
          <FiEdit2 /> Modifier
        </button>
        <button 
          className="delete-btn" 
          onClick={() => onDelete(user)}
          disabled={!user.actif} // Empêche la suppression si déjà inactif
        >
          <FiTrash2 /> Supprimer
        </button>
      </div>
    </div>
  );
}
