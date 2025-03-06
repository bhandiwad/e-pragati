import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import axios from 'axios';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ProductivityTrend {
  date: string;
  productivity: number;
  updates: number;
  department: string;
}

interface DepartmentMetrics {
  name: string;
  productivity: number;
  updates: number;
  blockers: number;
  completedTasks: number;
}

interface TeamVelocity {
  sprint: string;
  planned: number;
  completed: number;
  department: string;
}

export default function AdvancedAnalytics() {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('week');
  const [department, setDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  const [productivityTrends, setProductivityTrends] = useState<ProductivityTrend[]>([]);
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([]);
  const [teamVelocity, setTeamVelocity] = useState<TeamVelocity[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:8001/analytics/departments/list');
        setDepartments(['all', ...response.data]);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Fetch productivity trends
        const trendsResponse = await axios.get(`http://localhost:8001/analytics/trends?timeRange=${timeRange}&department=${department}`);
        setProductivityTrends(trendsResponse.data);

        // Fetch department metrics
        const metricsResponse = await axios.get('http://localhost:8001/analytics/departments');
        setDepartmentMetrics(metricsResponse.data);

        // Fetch team velocity
        const velocityResponse = await axios.get(`http://localhost:8001/analytics/velocity?department=${department}`);
        setTeamVelocity(velocityResponse.data);

      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, department]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderProductivityTrends = () => (
    <Paper sx={{ p: 3, height: '400px' }}>
      <Typography variant="h6" gutterBottom>
        Productivity Trends
      </Typography>
      <ResponsiveContainer>
        <LineChart data={productivityTrends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="productivity"
            stroke="#8884d8"
            name="Productivity Score"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="updates"
            stroke="#82ca9d"
            name="Number of Updates"
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );

  const renderDepartmentComparison = () => (
    <Paper sx={{ p: 3, height: '400px' }}>
      <Typography variant="h6" gutterBottom>
        Department Performance
      </Typography>
      <ResponsiveContainer>
        <RadarChart data={departmentMetrics}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
          <Radar
            name="Productivity"
            dataKey="productivity"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Paper>
  );

  const renderTeamVelocity = () => (
    <Paper sx={{ p: 3, height: '400px' }}>
      <Typography variant="h6" gutterBottom>
        Team Velocity
      </Typography>
      <ResponsiveContainer>
        <BarChart data={teamVelocity}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="sprint" 
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <Box sx={{ bgcolor: 'background.paper', p: 2, border: '1px solid #ccc' }}>
                    <Typography variant="subtitle2">{`Sprint: ${label}`}</Typography>
                    <Typography variant="body2">{`Department: ${payload[0]?.payload.department}`}</Typography>
                    <Typography variant="body2">{`Planned Tasks: ${payload[0]?.value}`}</Typography>
                    <Typography variant="body2">{`Completed Tasks: ${payload[1]?.value}`}</Typography>
                    <Typography variant="body2">{`Completion Rate: ${
                      payload[1]?.value && payload[0]?.value
                        ? `${((Number(payload[1].value) / Number(payload[0].value)) * 100).toFixed(1)}%`
                        : 'N/A'
                    }`}</Typography>
                  </Box>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar 
            dataKey="planned" 
            fill="#8884d8" 
            name="Planned Tasks"
            stackId="department"
          />
          <Bar 
            dataKey="completed" 
            fill="#82ca9d" 
            name="Completed Tasks"
            stackId="department"
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );

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
    <Box sx={{ width: '100%', p: 3 }}>
      <Grid container spacing={3}>
        {/* Controls Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <MenuItem value="week">Last Week</MenuItem>
                    <MenuItem value="month">Last Month</MenuItem>
                    <MenuItem value="quarter">Last Quarter</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={department}
                    label="Department"
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept === 'all' ? 'All Departments' : dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Error Message */}
        {error && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography>{error}</Typography>
            </Paper>
          </Grid>
        )}

        {/* Charts Section */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: '500px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Productivity Trends
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              <ResponsiveContainer>
                <LineChart data={productivityTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left" 
                    domain={[0, 1]} 
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    label={{ value: 'Productivity', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, 'auto']}
                    label={{ value: 'Updates', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36}/>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="productivity"
                    stroke="#8884d8"
                    name="Productivity Score"
                    dot={{ strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="updates"
                    stroke="#82ca9d"
                    name="Number of Updates"
                    dot={{ strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '500px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Department Performance
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              <ResponsiveContainer>
                <RadarChart data={departmentMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="name"
                    tick={{ fill: 'rgba(0, 0, 0, 0.87)', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    domain={[0, 1]} 
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Radar
                    name="Productivity"
                    dataKey="productivity"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36}/>
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: '500px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Team Velocity
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              <ResponsiveContainer>
                <BarChart 
                  data={teamVelocity}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="sprint" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    label={{ value: 'Tasks', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2">{`Sprint: ${label}`}</Typography>
                            <Typography variant="body2">{`Department: ${payload[0]?.payload.department}`}</Typography>
                            <Typography variant="body2">{`Planned Tasks: ${payload[0]?.value}`}</Typography>
                            <Typography variant="body2">{`Completed Tasks: ${payload[1]?.value}`}</Typography>
                            <Typography variant="body2">{`Completion Rate: ${
                              payload[1]?.value && payload[0]?.value
                                ? `${((Number(payload[1].value) / Number(payload[0].value)) * 100).toFixed(1)}%`
                                : 'N/A'
                            }`}</Typography>
                          </Paper>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar 
                    dataKey="planned" 
                    fill="#8884d8" 
                    name="Planned Tasks"
                  />
                  <Bar 
                    dataKey="completed" 
                    fill="#82ca9d" 
                    name="Completed Tasks"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 