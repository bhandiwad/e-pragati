import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Rating,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Tooltip,
  SelectChangeEvent,
} from '@mui/material';
import {
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Group as GroupIcon,
  Speed as SpeedIcon,
  EmojiEvents as AwardIcon,
  WorkspacePremium as PremiumIcon,
} from '@mui/icons-material';

// API base URL
const API_BASE_URL = 'http://localhost:8001';

interface PerformanceMetrics {
  productivity_score: number;
  completed_tasks_count: number;
  goals_achieved: number;
  project_completion_rate: number;
  update_frequency: number;
  collaboration_score: number;
  impact_score: number;
  consistency_score: number;
  innovation_score: number;
  quality_score: number;
  blockers_resolved: number;
  avg_task_complexity: number;
  milestone_completion_rate: number;
  knowledge_sharing: number;
  team_contributions: number;
}

interface EmployeePerformance {
  name: string;
  role: string;
  department: string;
  performance_tier: string;
  metrics: PerformanceMetrics;
  ranking: number;
}

interface PerformanceData {
  top_performers: EmployeePerformance[];
  strong_performers: EmployeePerformance[];
  other_performers: EmployeePerformance[];
  total_employees: number;
  evaluation_period: string;
}

const MetricCard: React.FC<{ label: string; value: number; maxValue: number; color: string }> = ({
  label,
  value,
  maxValue,
  color,
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="subtitle2" color="textSecondary">
        {label}
      </Typography>
      <Box sx={{ mt: 2, mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={(value / maxValue) * 100}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: `${color}22`,
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
            },
          }}
        />
      </Box>
      <Typography variant="h6" sx={{ mt: 1 }}>
        {value.toFixed(2)}
      </Typography>
    </CardContent>
  </Card>
);

const PerformanceBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const color = tier === "Top 10%" ? "#FFD700" : tier === "Next 20%" ? "#C0C0C0" : "#CD7F32";
  return (
    <Chip
      icon={<StarIcon />}
      label={tier}
      sx={{
        backgroundColor: `${color}22`,
        color: color,
        fontWeight: 'bold',
        '& .MuiChip-icon': {
          color: color,
        },
      }}
    />
  );
};

export default function Performance() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchPerformanceData();
  }, [period]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/performance/ratings?period=${period}`);
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Failed to fetch performance data (Status: ${response.status})`);
        }
      }
      const data = await response.json();
      setPerformanceData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Use fallback data if API fails
      const defaultMetrics = {
        productivity_score: 0.82,
        completed_tasks_count: 15,
        goals_achieved: 8,
        project_completion_rate: 0.75,
        update_frequency: 4.2,
        collaboration_score: 0.78,
        impact_score: 0.81,
        consistency_score: 0.79,
        innovation_score: 0.72,
        quality_score: 0.85,
        blockers_resolved: 5,
        avg_task_complexity: 3.2,
        milestone_completion_rate: 0.7,
        knowledge_sharing: 4,
        team_contributions: 7
      };
      
      setPerformanceData({
        top_performers: [
          {
            name: "Anil Kumar",
            role: "Senior Developer",
            department: "Development",
            performance_tier: "Top 10%",
            metrics: defaultMetrics,
            ranking: 1
          },
          {
            name: "Priya Sharma",
            role: "Product Manager",
            department: "Product Management",
            performance_tier: "Top 10%",
            metrics: {...defaultMetrics, productivity_score: 0.85},
            ranking: 2
          }
        ],
        strong_performers: [
          {
            name: "Rajesh Singh",
            role: "Technical Lead",
            department: "Development",
            performance_tier: "Next 20%",
            metrics: {...defaultMetrics, productivity_score: 0.79},
            ranking: 3
          },
          {
            name: "Deepa Patel",
            role: "UX Designer",
            department: "Product Management",
            performance_tier: "Next 20%",
            metrics: {...defaultMetrics, productivity_score: 0.77},
            ranking: 4
          }
        ],
        other_performers: [
          {
            name: "Amit Verma",
            role: "Junior Developer",
            department: "Development",
            performance_tier: "Rest 70%",
            metrics: {...defaultMetrics, productivity_score: 0.68},
            ranking: 5
          }
        ],
        total_employees: 5,
        evaluation_period: "Last 30 days"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (event: SelectChangeEvent<string>) => {
    setPeriod(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  if (!performanceData) {
    return null;
  }

  const renderEmployeeCard = (employee: EmployeePerformance) => (
    <Paper sx={{ p: 3, mb: 2 }} elevation={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {employee.name.split(' ')[0][0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{employee.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {employee.role} • {employee.department}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2 }}>
            <PerformanceBadge tier={employee.performance_tier} />
          </Box>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <MetricCard
                label="Productivity"
                value={employee.metrics.productivity_score}
                maxValue={1}
                color="#2196f3"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <MetricCard
                label="Impact"
                value={employee.metrics.impact_score}
                maxValue={1}
                color="#4caf50"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <MetricCard
                label="Quality"
                value={employee.metrics.quality_score}
                maxValue={1}
                color="#ff9800"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Additional Metrics
            </Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item>
                <Tooltip title="Collaboration Score">
                  <Chip
                    icon={<GroupIcon />}
                    label={employee.metrics.collaboration_score.toFixed(2)}
                    size="small"
                  />
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Innovation Score">
                  <Chip
                    icon={<TrendingIcon />}
                    label={employee.metrics.innovation_score.toFixed(2)}
                    size="small"
                  />
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Consistency Score">
                  <Chip
                    icon={<SpeedIcon />}
                    label={employee.metrics.consistency_score.toFixed(2)}
                    size="small"
                  />
                </Tooltip>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Performance Rankings
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} onChange={handlePeriodChange} label="Period">
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last Quarter</MenuItem>
            <MenuItem value="180d">Last 6 Months</MenuItem>
            <MenuItem value="365d">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab
          icon={<PremiumIcon sx={{ color: '#FFD700' }} />}
          label="Top Performers"
          iconPosition="start"
        />
        <Tab
          icon={<AwardIcon sx={{ color: '#C0C0C0' }} />}
          label="Strong Performers"
          iconPosition="start"
        />
        <Tab
          icon={<StarIcon sx={{ color: '#CD7F32' }} />}
          label="Other Performers"
          iconPosition="start"
        />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {tabValue === 0 && performanceData.top_performers.map(renderEmployeeCard)}
        {tabValue === 1 && performanceData.strong_performers.map(renderEmployeeCard)}
        {tabValue === 2 && performanceData.other_performers.map(renderEmployeeCard)}
      </Box>
    </Box>
  );
} 