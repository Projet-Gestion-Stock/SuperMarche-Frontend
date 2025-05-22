import { useState } from 'react';
import api from '@/services/api';

export default function AjoutProduitModal({ showNotification, setProduits, categories, onClose }) {
  const [formData, setFormData] = useState({
    produit: '',
    prix: 0,
    categorie: categories[0] || '',
    dateExpiration: '',
    unite: 'unité',
    fournisseur: '',
    description: '',
    quantiteDisponible: 0,
    seuilAlerte: 5,
    image: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convertir la date ISO (2026-06-21) en dd-MM-yyyy (21-06-2026)
      const [year, month, day] = formData.dateExpiration.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      const produitDTO = {
        produit: formData.produit,
        prix: parseFloat(formData.prix),
        categorie: formData.categorie,
        dateExpiration: formattedDate,
        unite: formData.unite,
        fournisseur: formData.fournisseur,
        description: formData.description,
        quantiteDisponible: parseInt(formData.quantiteDisponible),
        seuilAlerte: parseInt(formData.seuilAlerte)
      };

      const response = await api.post('/produits/gerant/ajouterProduit', produitDTO);
      
      if (formData.image) {
        const formDataImage = new FormData();
        formDataImage.append('file', formData.image);
        await api.post(`/images/gerant/upload/${response.data.id}`, formDataImage, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setProduits(prev => [...prev, response.data]);
      showNotification('Produit ajouté avec succès', 'success');
      onClose();
    } catch (error) {
      showNotification('Erreur lors de l\'ajout du produit', 'error');
    }
  };

  return (
    <div className="modal-content">
        <div className="modal-header">
            <h3>Ajouter un nouveau produit</h3>
            <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom du produit</label>
            <input 
              type="text" 
              required 
              value={formData.produit}
              onChange={(e) => setFormData({...formData, produit: e.target.value})}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Prix (FCFA)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                value={formData.prix}
                onChange={(e) => setFormData({...formData, prix: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <select 
                value={formData.categorie}
                onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                required
              >
                <option value="Alimentation">Alimentation</option>
                <option value="Boisson">Boisson</option>
                <option value="Hygiène et beauté">Hygiène et beauté</option>
                <option value="Entretien et maison">Entretien et maison</option>
                <option value="Animaux">Animaux</option>
                <option value="Divers">Divers</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Date d'expiration</label>
              <input 
                type="date" 
                value={formData.dateExpiration}
                onChange={(e) => setFormData({...formData, dateExpiration: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Unité</label>
              <select 
                value={formData.unite}
                onChange={(e) => setFormData({...formData, unite: e.target.value})}
              >
                <option value="unité">Unité</option>
                <option value="pack">Pack</option>
                <option value="carton">Carton</option>
                <option value="kg">Kg</option>
                <option value="litre">Litre</option>
                <option value="boîte">Boîte</option>
                <option value="bidon">Bidon</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Fournisseur</label>
            <input 
              type="text" 
              value={formData.fournisseur}
              onChange={(e) => setFormData({...formData, fournisseur: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Quantité initiale</label>
              <input 
                type="number" 
                min="0" 
                value={formData.quantiteDisponible}
                onChange={(e) => setFormData({...formData, quantiteDisponible: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Seuil d'alerte</label>
              <input 
                type="number" 
                min="1" 
                value={formData.seuilAlerte}
                onChange={(e) => setFormData({...formData, seuilAlerte: e.target.value})}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Image du produit</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Enregistrer
            </button>
          </div>
        </form>
    
    </div>
  );
}