import React, { useState } from 'react';
import {
  Container,
  Box,
  Tab,
  Tabs,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Toolbar,
  AppBar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Update as UpdateIcon,
  Groups as TeamIcon,
  Analytics as AnalyticsIcon,
  EmojiEvents as PerformanceIcon,
  SmartToy as CopilotIcon,
  PeopleAlt as PeopleAltIcon,
  History as HistoryIcon,
  Speed as SpeedIcon,
  AccountTree as AccountTreeIcon,
  BarChart as BarChartIcon,
  Loop as LoopIcon,
  Create as CreateIcon,
  CompareArrows as SemanticIcon,
} from '@mui/icons-material';
import { Routes, Route, Link } from 'react-router-dom';

// Component imports
import Dashboard from './components/Dashboard';
import TeamOverview from './components/TeamOverview';
import SubmitUpdate from './components/SubmitUpdate';
import Team from './components/Team';
import Analytics from './components/Analytics';
import Performance from './components/Performance';
import AICopilot from './components/AICopilot';
import TeamStructure from './components/TeamStructure';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import KeywordRepetition from './components/KeywordRepetition';
import History from './components/History';
import SemanticSimilarity from './components/SemanticSimilarity';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleSubmitSuccess = () => {
    // Refresh data or show notification if needed
    console.log('Update submitted successfully');
  };

  // Define drawer width
  const drawerWidth = 240;

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Team Overview', icon: <PeopleAltIcon />, path: '/team-overview' },
    { text: 'Team Structure', icon: <AccountTreeIcon />, path: '/team-structure' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'Advanced Analytics', icon: <BarChartIcon />, path: '/advanced-analytics' },
    { text: 'Keyword Repetition', icon: <LoopIcon />, path: '/keyword-repetition' },
    { text: 'Semantic Similarity', icon: <SemanticIcon />, path: '/semantic-similarity' },
    { text: 'Performance', icon: <SpeedIcon />, path: '/performance' },
    { text: 'Submit Update', icon: <CreateIcon />, path: '/submit-update' },
    { text: 'History', icon: <HistoryIcon />, path: '/history' },
    { text: 'AI Copilot', icon: <CopilotIcon />, path: '/ai-copilot' },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* AppBar */}
        <AppBar
          position="fixed"
          sx={{ 
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` } 
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              E-Pragati
            </Typography>
          </Toolbar>
        </AppBar>
        
        {/* Drawer */}
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {menuItems.map((item) => (
                  <ListItem 
                    key={item.text} 
                    disablePadding
                    component={Link}
                    to={item.path}
                  >
                    <ListItemButton>
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>
        </Box>
        
        {/* Main content area */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }}}>
          <Toolbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/team-overview" element={<TeamOverview />} />
            <Route path="/team-structure" element={<TeamStructure />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
            <Route path="/keyword-repetition" element={<KeywordRepetition />} />
            <Route path="/semantic-similarity" element={<SemanticSimilarity />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/submit-update" element={<SubmitUpdate onSubmitSuccess={handleSubmitSuccess} />} />
            <Route path="/history" element={<History />} />
            <Route path="/ai-copilot" element={<AICopilot />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;

