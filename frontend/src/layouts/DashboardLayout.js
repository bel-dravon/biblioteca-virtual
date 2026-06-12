import React, { useEffect, useRef, useState } from 'react';
import { Box, useTheme, CssBaseline } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const DRAWER_WIDTH = 260;
const MINI_DRAWER_WIDTH = 80;

export default function DashboardLayout({ children }) {
  const theme = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const scrollContainerRef = useRef(null);

  const currentSidebarWidth = collapsed ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} collapsed={collapsed} setCollapsed={setCollapsed} drawerWidth={DRAWER_WIDTH} miniDrawerWidth={MINI_DRAWER_WIDTH} />

      <Box component="main"
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: { md: `calc(100% - ${currentSidebarWidth}px)` }, ml: { md: 0 }, height: '100vh', overflow: 'hidden', transition: theme.transitions.create(['width', 'margin'], { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen, }), }} >
        <Box ref={scrollContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} >
          <Box sx={{ p: { xs: 2, md: 4 }, flexGrow: 1 }}>
            {children}
          </Box>
          <Footer /> 
        </Box>
      </Box>
    </Box>
  );
}
