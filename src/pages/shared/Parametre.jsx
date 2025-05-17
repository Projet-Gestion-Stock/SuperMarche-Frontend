import { useState, useEffect } from 'react';
import { 
  FiUpload, FiTrash2, FiSave, FiClock, 
  FiInfo, FiPhone, FiMail, FiMapPin, 
  FiEdit, FiEye 
} from 'react-icons/fi';
import ProtectedContent from '@/components/ProtectedContent';
import api from '@/services/api';
import Toast from '@/components/Notification';
import '@/styles/Parametre.css';

const joursSemaine = [
  { id: 'LUNDI', label: 'Lundi' },
  { id: 'MARDI', label: 'Mardi' },
  { id: 'MERCREDI', label: 'Mercredi' },
  { id: 'JEUDI', label: 'Jeudi' },
  { id: 'VENDREDI', label: 'Vendredi' },
  { id: 'SAMEDI', label: 'Samedi' },
  { id: 'DIMANCHE', label: 'Dimanche' }
];

export default function Parametre() {
  const [supermarcheInfo, setSupermarcheInfo] = useState({
    nom: '',
    description: '',
    email: '',
    telephone: '',
    localisation: '',
    logoUrl: '',
    horairesOuverture: joursSemaine.reduce((acc, jour) => {
      acc[jour.id] = '';
      return acc;
    }, {})
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [openingStatus, setOpeningStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('view');

  useEffect(() => {
    const fetchSupermarcheInfo = async () => {
      try {
        const [infoResponse, horairesResponse, statusResponse] = await Promise.all([
          api.get('/supermarche/staff/recupererInfo'),
          api.get('/supermarche/staff/horaires'),
          api.get('/supermarche/staff/horaires/statut')
        ]);
        
        const { nom, description, email, telephone, localisation, logoUrl } = infoResponse.data;
        
        setSupermarcheInfo(prev => ({
          ...prev,
          nom: nom || '',
          description: description || '',
          email: email || '',
          telephone: telephone || '',
          localisation: localisation || '',
          logoUrl: logoUrl || '',
          horairesOuverture: horairesResponse.data || joursSemaine.reduce((acc, jour) => {
            acc[jour.id] = '';
            return acc;
          }, {})
        }));
        
        setOpeningStatus(statusResponse.data);
      } catch (error) {
        showNotification('Erreur lors du chargement des informations', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSupermarcheInfo();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSupermarcheInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleHoraireChange = (jour, value) => {
    setSupermarcheInfo(prev => ({
      ...prev,
      horairesOuverture: {
        ...prev.horairesOuverture,
        [jour]: value
      }
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        showNotification('Veuillez sélectionner une image valide', 'error');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        showNotification('La taille du logo ne doit pas dépasser 2MB', 'error');
        return;
      }
      
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setSupermarcheInfo(prev => ({
          ...prev,
          logoUrl: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await api.delete('/supermarche/admin/supprimerLogo');
      setSupermarcheInfo(prev => ({ ...prev, logoUrl: '' }));
      setLogoFile(null);
      showNotification('Logo supprimé avec succès', 'success');
    } catch (error) {
      showNotification('Erreur lors de la suppression du logo', 'error');
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      showNotification('Veuillez sélectionner un logo', 'warning');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      
      const response = await api.post('/supermarche/admin/ajouterLogo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSupermarcheInfo(prev => ({
        ...prev,
        logoUrl: response.data.logoUrl
      }));
      
      showNotification('Logo mis à jour avec succès', 'success');
    } catch (error) {
      showNotification('Erreur lors de l\'upload du logo', 'error');
    }
  };

  const handleSaveInfo = async () => {
    try {
      await api.put('/supermarche/admin/modifierInfo', supermarcheInfo);
      showNotification('Informations mises à jour avec succès', 'success');
      setActiveTab('view');
    } catch (error) {
      showNotification('Erreur lors de la mise à jour des informations', 'error');
    }
  };

  const handleSaveHoraires = async () => {
    try {
      await api.post('/supermarche/admin/ajouterHoraires', {
        horaires: supermarcheInfo.horairesOuverture
      });
      
      const statusResponse = await api.get('/supermarche/staff/horaires/statut');
      setOpeningStatus(statusResponse.data);
      
      showNotification('Horaires mis à jour avec succès', 'success');
      setActiveTab('view');
    } catch (error) {
      showNotification('Erreur lors de la mise à jour des horaires', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="parametre-container">
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
      
      <div className="tabs-container">
        <div 
          className={`tab ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          <FiEye size={16} /> Visualisation
        </div>

        <ProtectedContent 
          allowedRoles={['ADMIN']}
          fallback={<div className="hidden-card"></div>}
        >
          <div 
            className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            <FiEdit size={16} /> Édition
          </div>
        </ProtectedContent>
      </div>
      
      {/* Onglet Visualisation */}
      <div className={`tab-content ${activeTab === 'view' ? 'active' : ''}`}>
        <div className="parametre-section">
          <h2 className="section-title">
            <FiClock size={18} /> Horaires d'ouverture
          </h2>
          
          {openingStatus && (
            <div className="status-display" style={{ 
              borderLeftColor: openingStatus.estOuvert ? 'var(--success)' : 'var(--error)'
            }}>
              <p>
                <span className={`status-indicator ${openingStatus.estOuvert ? 'status-open' : 'status-closed'}`} />
                <strong>Statut actuel: </strong> 
                {openingStatus.estOuvert ? 'OUVERT' : 'FERMÉ'}
              </p>
              {!openingStatus.estOuvert && (
                <p>
                  <strong>Prochaine ouverture: </strong>
                  {openingStatus.prochaineOuverture}
                </p>
              )}
            </div>
          )}
          
          <div className="horaires-display">
            {joursSemaine.map(jour => (
              <div key={jour.id} className="horaire-item">
                <span className="horaire-jour">{jour.label}</span>
                <span className="horaire-heures">
                  {supermarcheInfo.horairesOuverture[jour.id] || 'Fermé'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="espace"></div>

        <div className="parametre-section">
          <h2 className="section-title">
            <FiInfo size={18} /> Informations Générales
          </h2>
          
          <div className="info-display">
            <div className="info-row">
              <div className="info-label"><FiInfo size={16} /> Nom</div>
              <div className="info-value">
                {supermarcheInfo.nom || <span className="empty">-</span>}
              </div>
            </div>
            
            <div className="info-row">
              <div className="info-label"><FiInfo size={16} /> Description</div>
              <div className="info-value">
                {supermarcheInfo.description || <span className="empty">-</span>}
              </div>
            </div>
            
            <div className="info-row">
              <div className="info-label"><FiMail size={16} /> Email</div>
              <div className="info-value">
                {supermarcheInfo.email || <span className="empty">-</span>}
              </div>
            </div>
            
            <div className="info-row">
              <div className="info-label"><FiPhone size={16} /> Téléphone</div>
              <div className="info-value">
                {supermarcheInfo.telephone || <span className="empty">-</span>}
              </div>
            </div>
            
            <div className="info-row">
              <div className="info-label"><FiMapPin size={16} /> Adresse</div>
              <div className="info-value">
                {supermarcheInfo.localisation || <span className="empty">-</span>}
              </div>
            </div>
            
            <div className="info-row">
              <div className="info-label">Logo</div>
              <div className="info-value">
                {supermarcheInfo.logoUrl ? (
                  <img src={supermarcheInfo.logoUrl} alt="Logo" className="logo-display" />
                ) : (
                  <span className="empty">Aucun logo</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Onglet Édition */}
      <ProtectedContent 
        allowedRoles={['ADMIN']}
        fallback={<div className="hidden-card"></div>}
      >
        <div className={`tab-content ${activeTab === 'edit' ? 'active' : ''}`}>
          <div className="parametre-section">
            <h2 className="section-title">
              <FiEdit size={18} /> Modifier les informations
            </h2>
            
            <div className="parametre-form">
              <div className="form-group">
                <label htmlFor="nom">Nom du Supermarché</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  className="form-control"
                  value={supermarcheInfo.nom}
                  onChange={handleInputChange}
                  placeholder="Nom du supermarché"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control compact-textarea"
                  rows="1"
                  value={supermarcheInfo.description}
                  onChange={handleInputChange}
                  placeholder="Description du supermarché"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email"><FiMail size={16} /> Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  value={supermarcheInfo.email}
                  onChange={handleInputChange}
                  placeholder="email@exemple.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="telephone"><FiPhone size={16} /> Téléphone</label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  className="form-control"
                  value={supermarcheInfo.telephone}
                  onChange={handleInputChange}
                  placeholder="+226 XX XX XX XX"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="localisation"><FiMapPin size={16} /> Adresse</label>
                <input
                  type="text"
                  id="localisation"
                  name="localisation"
                  className="form-control"
                  value={supermarcheInfo.localisation}
                  onChange={handleInputChange}
                  placeholder="Adresse complète"
                />
              </div>
              
              <div className="logo-section">
                <label>Logo du Supermarché</label>
                <div className="logo-preview">
                  {supermarcheInfo.logoUrl ? (
                    <img src={supermarcheInfo.logoUrl} alt="Logo" />
                  ) : (
                    <div className="logo-placeholder">
                      <FiUpload size={24} />
                      <span>Aucun logo</span>
                    </div>
                  )}
                </div>
                
                <div className="logo-actions">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="logo-upload" className="btn btn-secondary">
                    <FiUpload size={14} /> Choisir
                  </label>
                  
                  {supermarcheInfo.logoUrl && (
                    <button className="btn btn-danger" onClick={handleDeleteLogo}>
                      <FiTrash2 size={14} /> Supprimer
                    </button>
                  )}
                  
                  {logoFile && (
                    <button className="btn btn-primary" onClick={handleUploadLogo}>
                      <FiSave size={14} /> Enregistrer
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="save-container">
              <button className="btn btn-primary" onClick={handleSaveInfo}>
                <FiSave size={16} /> Sauvegarder
              </button>
            </div>
          </div>
          
          <div className="parametre-section">
            <h2 className="section-title">
              <FiClock size={18} /> Modifier les horaires
            </h2>
            
            <div className="horaires-grid">
              {joursSemaine.map(jour => (
                <div key={jour.id} className="jour-horaire">
                  <span className="jour-title">{jour.label}</span>
                  <div className="horaire-input-group">
                    <input
                      type="text"
                      className="form-control horaire-input"
                      placeholder="08:00"
                      value={supermarcheInfo.horairesOuverture[jour.id]?.split('-')[0] || ''}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value.length === 2 && !value.includes(':')) {
                          value = value + ':';
                        }
                        const fermeture = supermarcheInfo.horairesOuverture[jour.id]?.split('-')[1] || '';
                        handleHoraireChange(jour.id, `${value}${fermeture ? '-' + fermeture : ''}`);
                      }}
                      maxLength="5"
                    />
                    <span className="horaire-separator">à</span>
                    <input
                      type="text"
                      className="form-control horaire-input"
                      placeholder="20:00"
                      value={supermarcheInfo.horairesOuverture[jour.id]?.split('-')[1] || ''}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value.length === 2 && !value.includes(':')) {
                          value = value + ':';
                        }
                        const ouverture = supermarcheInfo.horairesOuverture[jour.id]?.split('-')[0] || '';
                        handleHoraireChange(jour.id, `${ouverture ? ouverture + '-' : ''}${value}`);
                      }}
                      maxLength="5"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="save-container">
              <button className="btn btn-primary" onClick={handleSaveHoraires}>
                <FiSave size={16} /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </ProtectedContent>
    </div>
  );
}