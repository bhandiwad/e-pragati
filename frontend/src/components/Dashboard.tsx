import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Assignment,
  Error as ErrorIcon,
  CheckCircle,
} from '@mui/icons-material';

// API base URL
const API_BASE_URL = 'http://localhost:8001';

interface TeamOverviewData {
  departments: {
    name: string;
    members: Array<{
      name: string;
      role: string;
      department: string;
      update_count: number;
      average_productivity: number;
      recent_completed: string[];
      current_projects: string[];
      next_week_plans: string[];
      blockers: string[];
    }>;
    average_productivity: number;
    total_updates: number;
    key_projects: string[];
    common_blockers: string[];
  }[];
  total_update_count: number;
  team_productivity: number;
  active_projects: string[];
  common_blockers: string[];
  recent_completions: string[];
}

interface HistoryItem {
  timestamp: string;
  team_member: string;
  update: string;
  analysis: {
    Completed_Tasks: string[];
    Project_Progress: string[];
    Goals_Status: string[];
    Blockers: string[];
    Next_Week_Plans: string[];
    Productivity_Score: number;
  };
}

interface HistoryData {
  history: HistoryItem[];
}

const Dashboard: React.FC = () => {
  const [teamData, setTeamData] = useState<TeamOverviewData | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch team overview data
        const teamResponse = await fetch(`${API_BASE_URL}/team-overview`);
        if (!teamResponse.ok) {
          throw new Error('Failed to fetch team overview data');
        }
        const teamOverview = await teamResponse.json();
        
        // Fetch history data
        const historyResponse = await fetch(`${API_BASE_URL}/history`);
        if (!historyResponse.ok) {
          throw new Error('Failed to fetch history data');
        }
        const history = await historyResponse.json();
        
        setTeamData(teamOverview);
        setHistoryData(history);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  // If data isn't available yet, show a loading message
  if (!teamData || !historyData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard data...</Typography>
      </Box>
    );
  }

  // Get recent updates (last 5)
  const recentUpdates = historyData.history.slice(0, 5);

  // Calculate total completed tasks from recent updates
  const completedTasksCount = recentUpdates.reduce(
    (sum, update) => sum + (update.analysis.Completed_Tasks?.length || 0),
    0
  );

  // Get unique active projects
  const activeProjects = new Set<string>();
  recentUpdates.forEach(update => {
    update.analysis.Project_Progress?.forEach(project => {
      activeProjects.add(project);
    });
  });

  // Get common blockers
  const blockers = recentUpdates.flatMap(update => update.analysis.Blockers || []);
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Executive Dashboard
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Team Members</Typography>
              </Box>
              <Typography variant="h4">
                {teamData.departments.reduce((total, dept) => total + dept.members.length, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Completed Tasks</Typography>
              </Box>
              <Typography variant="h4">
                {teamData.recent_completions?.length || 
                 teamData.departments.reduce((sum, dept) => 
                   sum + dept.members.reduce((memberSum, member) => 
                     memberSum + (member.recent_completed?.length || 0), 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Projects</Typography>
              </Box>
              <Typography variant="h4">{teamData.active_projects?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Current Blockers</Typography>
              </Box>
              <Typography variant="h4">{teamData.common_blockers?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Updates */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Updates
            </Typography>
            <List>
              {recentUpdates.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography fontWeight="bold">
                          {item.team_member} - {new Date(item.timestamp).toLocaleDateString()}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" color="textPrimary" sx={{ mt: 1 }}>
                            {item.update}
                          </Typography>
                          {item.analysis.Completed_Tasks && item.analysis.Completed_Tasks.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                                <CheckCircle fontSize="small" sx={{ mr: 0.5 }} />
                                {item.analysis.Completed_Tasks.length} tasks completed
                              </Typography>
                            </Box>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < recentUpdates.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
        
        {/* Department Summary */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Department Overview
            </Typography>
            <List>
              {teamData.departments.map((dept) => (
                <ListItem key={dept.name}>
                  <ListItemText
                    primary={dept.name}
                    secondary={
                      <React.Fragment>
                        <Typography variant="body2">
                          Updates: {dept.total_updates} | Productivity: {(dept.average_productivity * 100).toFixed(0)}%
                        </Typography>
                        {dept.key_projects.length > 0 && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Key project: {dept.key_projects[0]}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 