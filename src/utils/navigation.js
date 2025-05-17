export const getDefaultRoute = (role) => {
  const defaultRoutes = {
    STAFF: '/caisse',
    GERANT: '/vue-ensemble',
    ADMIN: '/vue-ensemble'
  };
  
  return defaultRoutes[role] || '/vue-ensemble';
};