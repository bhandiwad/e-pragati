import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon, History as HistoryIcon } from '@mui/icons-material';
import SubmitUpdate from './SubmitUpdate';
import History from './History';

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
      id={`updates-tabpanel-${index}`}
      aria-labelledby={`updates-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Updates() {
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
          <Tab icon={<SendIcon />} label="Submit Update" iconPosition="start" />
          <Tab icon={<HistoryIcon />} label="Update History" iconPosition="start" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <SubmitUpdate onSubmitSuccess={() => setTabValue(1)} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <History />
      </TabPanel>
    </Box>
  );
} 