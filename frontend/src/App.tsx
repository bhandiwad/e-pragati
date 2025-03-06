import React, { useState } from 'react';
import {
  Container,
  Box,
  Tab,
  Tabs,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Update as UpdateIcon,
  Groups as TeamIcon,
  Analytics as AnalyticsIcon,
  EmojiEvents as PerformanceIcon,
  SmartToy as CopilotIcon,
} from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import Updates from './components/Updates';
import Team from './components/Team';
import Analytics from './components/Analytics';
import Performance from './components/Performance';
import AICopilot from './components/AICopilot';

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth={false}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="main navigation"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<DashboardIcon />}
              label="Dashboard"
              iconPosition="start"
            />
            <Tab
              icon={<UpdateIcon />}
              label="Updates"
              iconPosition="start"
            />
            <Tab
              icon={<TeamIcon />}
              label="Team"
              iconPosition="start"
            />
            <Tab
              icon={<AnalyticsIcon />}
              label="Analytics"
              iconPosition="start"
            />
            <Tab
              icon={<PerformanceIcon />}
              label="Performance"
              iconPosition="start"
            />
            <Tab
              icon={<CopilotIcon />}
              label="AI Copilot"
              iconPosition="start"
            />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <Dashboard />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Updates />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <Team />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <Analytics />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <Performance />
        </TabPanel>
        <TabPanel value={value} index={5}>
          <AICopilot />
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
}

export default App;
