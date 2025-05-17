import { useState, useEffect } from 'react';
import { FiX, FiUser, FiMail, FiLock } from 'react-icons/fi';

export default function PersonnelModal({ isOpen, onClose, user, onSubmit }) {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    role: 'STAFF',
    motDePasse: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        email: user.email || '',
        role: user.role || 'STAFF',
        motDePasse: ''
      });
    } else {
      setFormData({
        nom: '',
        email: '',
        role: 'STAFF',
        motDePasse: ''
      });
    }
    setErrors({});
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!user && !formData.motDePasse) {
      newErrors.motDePasse = 'Le mot de passe est requis';
    } else if (!user && formData.motDePasse.length < 6) {
      newErrors.motDePasse = 'Minimum 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      // Préparer les données à envoyer selon votre API
      const userData = {
        nom: formData.nom,
        email: formData.email,
        role: formData.role
      };

      // Ajouter le mot de passe seulement pour la création
      if (!user) {
        userData.motDePasse = formData.motDePasse;
      }

      await onSubmit(userData);
    } catch (error) {
      if (error.response && error.response.data) {
        // Handle backend validation errors
        const backendErrors = error.response.data;
        if (backendErrors.includes("Email déjà utilisé")) {
          setErrors(prev => ({ ...prev, email: 'Cet email est déjà utilisé' }));
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
        
        <h2>{user ? 'Modifier' : 'Ajouter'} un membre</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><FiUser /> Nom*</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className={errors.nom ? 'error' : ''}
            />
            {errors.nom && <span className="error-message">{errors.nom}</span>}
          </div>
          
          <div className="form-group">
            <label><FiMail /> Email*</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label>Rôle*</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Administrateur</option>
              <option value="GERANT">Gérant</option>
            </select>
          </div>
          
          {!user && (
            <div className="form-group">
              <label><FiLock /> Mot de passe*</label>
              <input
                type="password"
                name="motDePasse"
                value={formData.motDePasse}
                onChange={handleChange}
                className={errors.motDePasse ? 'error' : ''}
              />
              {errors.motDePasse && <span className="error-message">{errors.motDePasse}</span>}
            </div>
          )}
          
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="submit-btn">
              {user ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}