import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import AppHeader from '../components/AppHeader';

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 68 : 240;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-midnight)' }}>
      <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <AppHeader sidebarWidth={sidebarWidth} />
        <main
          style={{
            flex: 1,
            marginTop: 64,
            padding: '2rem',
            maxWidth: '100%',
            overflowX: 'hidden',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            key={window.location.pathname}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
