import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
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
import { API_BASE_URL } from '../config';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  department: string;
  projects: string[];
  tasks: string[];
}

const TeamStructure: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Team Structure
      </Typography>
      
      <Grid container spacing={3}>
        {members.map((member) => (
          <Grid item key={member.id} xs={12} md={6} lg={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: stringToColor(member.name), mr: 2 }}>
                    {getInitials(member.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{member.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {member.role} • {member.department}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Current Projects
                </Typography>
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {member.projects.map((project, index) => (
                    <Chip key={index} label={project} size="small" />
                  ))}
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  Recent Tasks
                </Typography>
                <List dense>
                  {member.tasks.map((task, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemText primary={task} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
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

export default TeamStructure; 