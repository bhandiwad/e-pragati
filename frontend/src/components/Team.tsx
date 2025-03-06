import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tab,
  Tabs,
} from '@mui/material';
import { 
  AccountTree as OrgChartIcon, 
  Assessment as OverviewIcon 
} from '@mui/icons-material';
import TeamOverview from './TeamOverview';
import TeamStructure from './TeamStructure';

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
      id={`team-tabpanel-${index}`}
      aria-labelledby={`team-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Team() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem'
            }
          }}
        >
          <Tab icon={<OrgChartIcon />} label="Organization Structure" iconPosition="start" />
          <Tab icon={<OverviewIcon />} label="Team Overview" iconPosition="start" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <TeamStructure />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TeamOverview />
      </TabPanel>
    </Box>
  );
} 