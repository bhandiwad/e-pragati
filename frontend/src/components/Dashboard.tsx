import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as TaskIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface DashboardData {
  totalEmployees: number;
  activeProjects: number;
  averageProductivity: number;
  openBlockers: number;
  departmentStats: {
    name: string;
    productivity: number;
    employees: number;
  }[];
  productivityTrend: {
    date: string;
    value: number;
  }[];
  projectDistribution: {
    department: string;
    projects: number;
  }[];
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Simulated data for now
      const data: DashboardData = {
        totalEmployees: 45,
        activeProjects: 23,
        averageProductivity: 0.78,
        openBlockers: 5,
        departmentStats: [
          { name: 'Development', productivity: 0.82, employees: 12 },
          { name: 'Product', productivity: 0.75, employees: 8 },
          { name: 'Design', productivity: 0.79, employees: 6 },
        ],
        productivityTrend: [
          { date: '2024-01', value: 0.72 },
          { date: '2024-02', value: 0.75 },
          { date: '2024-03', value: 0.78 },
        ],
        projectDistribution: [
          { department: 'Development', projects: 10 },
          { department: 'Product', projects: 8 },
          { department: 'Design', projects: 5 },
        ],
      };
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
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

  if (!dashboardData) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Executive Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Employees</Typography>
              </Box>
              <Typography variant="h4">{dashboardData.totalEmployees}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TaskIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Projects</Typography>
              </Box>
              <Typography variant="h4">{dashboardData.activeProjects}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Productivity</Typography>
              </Box>
              <Typography variant="h4">
                {(dashboardData.averageProductivity * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Open Blockers</Typography>
              </Box>
              <Typography variant="h4">{dashboardData.openBlockers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Productivity Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Productivity Trend
            </Typography>
            <ResponsiveContainer>
              <LineChart data={dashboardData.productivityTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`} />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Project Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Project Distribution
            </Typography>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dashboardData.projectDistribution}
                  dataKey="projects"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {dashboardData.projectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Department Performance */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Department Performance
            </Typography>
            <Grid container spacing={2}>
              {dashboardData.departmentStats.map((dept) => (
                <Grid item xs={12} md={4} key={dept.name}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {dept.name}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Productivity
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={dept.productivity * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Employees: {dept.employees}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 