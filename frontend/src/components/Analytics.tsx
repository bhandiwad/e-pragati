import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

// API base URL
const API_BASE_URL = 'http://localhost:8001';

interface AnalyticsData {
  team_productivity: number;
  total_updates: number;
  active_projects: string[];
  completed_tasks: string[];
  common_blockers: string[];
  department_stats: {
    [key: string]: {
      productivity: number;
      updates: number;
      active_members: number;
    };
  };
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/analytics/overview?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalyticsData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (event: SelectChangeEvent<string>) => {
    setPeriod(event.target.value);
  };

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

  if (!analyticsData) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Team Analytics
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} onChange={handlePeriodChange} label="Period">
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last Quarter</MenuItem>
            <MenuItem value="180d">Last 6 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Team Productivity</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {(analyticsData.team_productivity * 100).toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analyticsData.team_productivity * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Updates</Typography>
              </Box>
              <Typography variant="h4">{analyticsData.total_updates}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Projects</Typography>
              </Box>
              <Typography variant="h4">{analyticsData.active_projects.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Department Stats */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>Department Performance</Typography>
          <Grid container spacing={2}>
            {Object.entries(analyticsData.department_stats).map(([dept, stats]) => (
              <Grid item xs={12} md={4} key={dept}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>{dept}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Productivity</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={stats.productivity * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Updates</Typography>
                      <Typography variant="body1">{stats.updates}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Active Members</Typography>
                      <Typography variant="body1">{stats.active_members}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Lists */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Recent Completed Tasks</Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {analyticsData.completed_tasks.slice(0, 5).map((task, index) => (
                <Typography component="li" key={index} sx={{ mb: 1 }}>
                  {task}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Active Projects</Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {analyticsData.active_projects.slice(0, 5).map((project, index) => (
                <Typography component="li" key={index} sx={{ mb: 1 }}>
                  {project}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Common Blockers</Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {analyticsData.common_blockers.slice(0, 5).map((blocker, index) => (
                <Typography component="li" key={index} sx={{ mb: 1 }}>
                  {blocker}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics; 