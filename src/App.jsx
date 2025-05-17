import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from '@/components/SplashScreen';
import ConnexionPage from '@/pages/auth/ConnexionPage';
import AdminDashboard from '@/pages/admin/DashboardAdmin';
import GerantDashboard from '@/pages/gerant/DashboardGerant';
import StaffDashboard from '@/pages/staff/DashboardStaff';
import ProtectedRoute from '@/components/ProtectedRoute';
import AnimatedRoutes from "@/components/AnimatedRoutes";
import Layout from '@/components/Layout';
import VueEnsemble from '@/pages/shared/Vue-ensemble';
import Caisse from '@/pages/shared/Caisse';
import Commande from '@/pages/shared/Commande';
import Inventaire from '@/pages/shared/Inventaire';
import Personnel from '@/pages/shared/Personnel';
import Parametre from '@/pages/shared/Parametre';

function AppRoutes() {
  const [initialized, setInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(
    localStorage.getItem('hasSeenSplash') !== 'true'
  );
  const { checkAuth } = useAuth();

  useEffect(() => {
    if (!initialized) {
      checkAuth();
      setInitialized(true);
    }
  }, [initialized, checkAuth]);

  const handleSplashComplete = () => {
    localStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <AnimatedRoutes>
      <Routes>
        <Route path="/connexion" element={<ConnexionPage />} />
        
        {/* Route commune à tous les rôles */}
        <Route
          path="/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'GERANT', 'STAFF']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Routes spécifiques au tableau de bord */}
          <Route
            path="admin/*"
            element={<AdminDashboard />}
          />
          <Route
            path="gerant/*"
            element={<GerantDashboard />}
          />
          <Route
            path="staff/*"
            element={<StaffDashboard />}
          />
          
          {/* Routes communes */}
          <Route path="vue-ensemble" element={<VueEnsemble />} />
          <Route path="caisse" element={<Caisse />} />
          <Route path="commande" element={<Commande />} />
          <Route path="inventaire" element={<Inventaire />} />
          <Route path="personnel" element={<Personnel />} />
          <Route path="parametre" element={<Parametre />} />
          
          {/* Redirection par défaut selon le rôle */}
          <Route 
            index 
            element={
              <Navigate to={
                localStorage.getItem('userRole') === 'ADMIN' ? 'admin' :
                localStorage.getItem('userRole') === 'GERANT' ? 'gerant' :
                'staff'
              } replace 
              />
            } 
          />
        </Route>
        
        <Route path="/" element={<Navigate to="/connexion" replace />} />
        
      </Routes>
    </AnimatedRoutes>
  );
}

export default AppRoutes;