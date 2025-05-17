import { useState, useEffect } from 'react';
import api from '@/services/api';
import '@/styles/Vue-ensemble.css';
import ProtectedContent from '@/components/ProtectedContent';

const VueDensemble = () => {
  const [stats, setStats] = useState({
    revenuTotal: 0,
    totalCommandes: 0,
    moyenneCommandesParJour: 0,
    produitsVendus: 0
  });

  const [topProduits, setTopProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periode, setPeriode] = useState('7j');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [percentages, setPercentages] = useState({
    revenueChange: 0,
    ordersChange: 0,
    dailyOrdersChange: 0
  });

  // Fonction utilitaire pour les dates
  const getPreviousDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const diff = periode === '7j' ? 7 : 30;
    d.setDate(d.getDate() - diff);
    return d.toISOString().split('T')[0];
  };

  // Calculer les pourcentages dynamiquement
  const calculerPourcentages = (currentData, previousData) => {
    if (!previousData || previousData.nombreVentes === 0) {
      return {
        revenueChange: 0,
        ordersChange: 0,
        dailyOrdersChange: 0
      };
    }

    return {
      revenueChange: ((currentData.chiffreAffaires - previousData.chiffreAffaires) / previousData.chiffreAffaires * 100),
      ordersChange: ((currentData.nombreVentes - previousData.nombreVentes) / previousData.nombreVentes * 100),
      dailyOrdersChange: ((currentData.nombreVentes / (periode === '7j' ? 7 : 30) - 
                         previousData.nombreVentes / (periode === '7j' ? 7 : 30)) / 
                        (previousData.nombreVentes / (periode === '7j' ? 7 : 30)) * 100 )
    };
  };

  // Charger les données
  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        setLoading(true);
        
        // Paramètres de requête
        const params = {};
        if (periode === 'custom' && dateDebut && dateFin) {
          params.dateDebut = dateDebut;
          params.dateFin = dateFin;
        } else if (periode !== 'custom') {
          params.periode = periode;
        }

        // Charger les stats actuelles
        const reponseStats = await api.get('/statistiques/gerant/ventes', { params });
        const data = reponseStats.data;
        
        // Charger les stats de la période précédente pour comparaison
        const previousParams = {};
        if (periode === 'custom' && dateDebut && dateFin) {
          previousParams.dateDebut = getPreviousDate(dateDebut);
          previousParams.dateFin = getPreviousDate(dateFin);
        } else if (periode !== 'custom') {
          previousParams.periode = periode;
        }
        
        const reponsePreviousStats = await api.get('/statistiques/gerant/ventes', { params: previousParams });
        const previousData = reponsePreviousStats.data;

        // Calculer la moyenne des commandes par jour
        const jours = periode === '7j' ? 7 : 30;
        const moyenne = data.nombreVentes / jours;

        setStats({
          revenuTotal: data.chiffreAffaires || 0,
          totalCommandes: data.nombreVentes || 0,
          moyenneCommandesParJour: moyenne.toFixed(1),
          produitsVendus: data.produitsVendus || 0
        });

        // Calculer les pourcentages de changement
        setPercentages(calculerPourcentages(data, previousData));

        // Charger les produits les plus vendus
        const reponseProduits = await api.get('/statistiques/gerant/produits', { 
          params: { ...params, limit: 15 } 
        });
        setTopProduits(reponseProduits.data.produitsPlusVendus || []);
        
      } catch (err) {
        setError(err.response?.data?.message || "Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    };

    chargerDonnees();
  }, [periode, dateDebut, dateFin]);

  if (loading) return <div className="loading">Chargement en cours...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="vue-densemble-container">
      <h1>Vue d'ensemble</h1>
      
      {/* Filtres de période - accessible à tous */}
      <div className="filtres-periode">
        <button 
          className={periode === '7j' ? 'active' : ''}
          onClick={() => setPeriode('7j')}
        >
          7 derniers jours
        </button>
        <button 
          className={periode === '30j' ? 'active' : ''}
          onClick={() => setPeriode('30j')}
        >
          30 derniers jours
        </button>
        <div className="custom-filtre">
          <input 
            type="date" 
            value={dateDebut}
            onChange={(e) => {
              setDateDebut(e.target.value);
              setPeriode('custom');
            }}
            placeholder="Date début"
          />
          <input 
            type="date" 
            value={dateFin}
            onChange={(e) => {
              setDateFin(e.target.value);
              setPeriode('custom');
            }}
            placeholder="Date fin"
          />
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="stats-principales">
        {/* Carte Revenu Total - Seulement pour ADMIN */}
          <ProtectedContent 
            allowedRoles={['ADMIN']}
            fallback={<div className="hidden-card"></div>}
          >
            <div className="stat-card">
              <div className="card-header">
                <h3>Revenu Total (TTC)</h3>
                <div className={`percentage-change ${percentages.revenueChange >= 0 ? 'positive' : 'negative'}`}>
                  {percentages.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(percentages.revenueChange).toFixed(1)}%
                </div>
              </div>
              <div className="stat-value">{stats.revenuTotal.toLocaleString('fr-FR')} FCFA</div>
            </div>
          </ProtectedContent>
        {/* Carte Commandes - Accessible à ADMIN et GERANT */}
        <div className="stat-card">
          <div className="card-header">
            <h3>Commandes</h3>
            <div className={`percentage-change ${percentages.ordersChange >= 0 ? 'positive' : 'negative'}`}>
              {percentages.ordersChange >= 0 ? '↑' : '↓'} {Math.abs(percentages.ordersChange).toFixed(1)}%
            </div>
          </div>
          <div className="stat-value">{stats.totalCommandes}</div>
        </div>

        {/* Carte Commandes/Jour - Accessible à ADMIN et GERANT */}
        <div className="stat-card">
          <div className="card-header">
            <h3>Commandes/Jour</h3>
            <div className={`percentage-change ${percentages.dailyOrdersChange >= 0 ? 'positive' : 'negative'}`}>
              {percentages.dailyOrdersChange >= 0 ? '↑' : '↓'} {Math.abs(percentages.dailyOrdersChange).toFixed(1)}%
            </div>
          </div>
          <div className="stat-value">{stats.moyenneCommandesParJour}</div>
        </div>
      </div>

      {/* Ventes par produit - Accessible à ADMIN et GERANT */}
      <div className="ventes-produit">
        <h2>Ventes par Produit</h2>
        <p className="total-produits">{stats.produitsVendus} produits vendus</p>

        <div className="top-produits-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Produit</th>
                <th>Quantité vendue</th>
              </tr>
            </thead>
            <tbody>
              {topProduits.map((produit, index) => (
                <tr key={produit.produit}>
                  <td>#{index + 1}</td>
                  <td>{produit.produit}</td>
                  <td>{produit.quantite} vendus</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VueDensemble;