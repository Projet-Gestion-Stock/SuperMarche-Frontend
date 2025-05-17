import '@/styles/AdminDashboard.css';
import Sidebar from '@/pages/composants/Sidebar'; 
import Header from '@/pages/composants/Header';

function AdminDashboard() {
  
  return (
  <div className="admin-layout">
    <Header />
    <Sidebar />
    <main className="main-content">
      {/* Votre contenu principal ici */}
    </main>
  </div>
);
}

export default AdminDashboard;