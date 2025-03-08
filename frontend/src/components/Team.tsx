import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tab,
  Tabs,
  Card,
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
} from '@mui/material';
import { 
  AccountTree as OrgChartIcon, 
  Assessment as OverviewIcon,
  Groups as GroupsIcon,
  BarChart as ChartIcon 
} from '@mui/icons-material';
import TeamOverview from './TeamOverview';
import TeamStructure from './TeamStructure';
import { API_BASE_URL } from '../config';

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
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  department: string;
  projects: string[];
  tasks: string[];
}

const Team: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/team-members`);
        if (!response.ok) {
          throw new Error(`Failed to fetch team members (Status: ${response.status})`);
        }
        const data = await response.json();
        setMembers(data.members);
        setError(null);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        
        // Fallback data
        setMembers([
          {
            id: 1,
            name: 'Anil Kumar',
            role: 'Senior Developer',
            department: 'Development',
            projects: ['Backend API Development', 'Database Migration'],
            tasks: ['API Documentation', 'Bug Fixes', 'Performance Optimization']
          },
          {
            id: 2,
            name: 'Priya Sharma',
            role: 'Frontend Developer',
            department: 'Development',
            projects: ['Frontend Integration', 'UI Redesign'],
            tasks: ['Component Library', 'Navigation Implementation', 'Responsive Design']
          },
          {
            id: 3,
            name: 'Rajesh Singh',
            role: 'Product Manager',
            department: 'Product Management',
            projects: ['Product Roadmap', 'Market Research'],
            tasks: ['User Research', 'Feature Prioritization', 'Competitive Analysis']
          },
          {
            id: 4,
            name: 'Deepa Patel',
            role: 'UX Designer',
            department: 'Design',
            projects: ['Design System', 'User Testing'],
            tasks: ['Wireframes', 'Prototypes', 'User Flows']
          },
          {
            id: 5,
            name: 'Vikram Reddy',
            role: 'DevOps Engineer',
            department: 'Platform',
            projects: ['CI/CD Pipeline', 'Cloud Migration'],
            tasks: ['Infrastructure Setup', 'Automated Deployments', 'Monitoring']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab icon={<GroupsIcon />} label="TEAM STRUCTURE" />
          <Tab icon={<ChartIcon />} label="TEAM OVERVIEW" />
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
};

// Helper functions
function stringToColor(string: string): string {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default Team; 