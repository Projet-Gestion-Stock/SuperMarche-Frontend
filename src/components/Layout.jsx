import { Outlet } from 'react-router-dom';
import Sidebar from '@/pages/composants/Sidebar'; 
import Header from '@/pages/composants/Header';
import AnimatedRoutes from "@/components/AnimatedRoutes";

const Layout = () => {
  return (
    <AnimatedRoutes>

      <div className="app-layout">
        <Sidebar />
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </AnimatedRoutes>
    
  );
};

export default Layout;