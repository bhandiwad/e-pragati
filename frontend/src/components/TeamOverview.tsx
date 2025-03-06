import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Scatter,
  ScatterChart,
  ZAxis,
  Legend,
} from 'recharts';
import axios from 'axios';

interface TeamMember {
  name: string;
  update_count: number;
  average_productivity: number;
  recent_completed: string[];
  current_projects: string[];
  next_week_plans: string[];
  blockers: string[];
}

interface DepartmentData {
  name: string;
  members: TeamMember[];
  average_productivity: number;
  total_updates: number;
  key_projects: string[];
  common_blockers: string[];
}

interface TeamOverviewData {
  departments: DepartmentData[];
  total_update_count: number;
  team_productivity: number;
  active_projects: string[];
  common_blockers: string[];
  recent_completions: string[];
}

interface CrossDepartmentMetrics {
  technicalIssues: { [dept: string]: number };
  resourceConstraints: { [dept: string]: number };
  complianceRisks: { [dept: string]: number };
  processImprovements: { [dept: string]: number };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57', '#83a6ed'];

function TabPanel(props: { children?: React.ReactNode; value: number; index: number }) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TeamOverview() {
  const [teamData, setTeamData] = useState<TeamOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchTeamOverview = async () => {
      try {
        const response = await axios.get('http://localhost:8001/team-overview');
        setTeamData(response.data);
      } catch (error) {
        console.error('Error fetching team overview:', error);
        setError('Failed to load team overview');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamOverview();
  }, []);

  const getProductivityColor = (score: number) => {
    if (score >= 0.7) return '#4caf50';
    if (score >= 0.4) return '#ff9800';
    return '#f44336';
  };

  const calculateCrossDepartmentMetrics = (departments: DepartmentData[]): CrossDepartmentMetrics => {
    const metrics: CrossDepartmentMetrics = {
      technicalIssues: {},
      resourceConstraints: {},
      complianceRisks: {},
      processImprovements: {},
    };

    departments.forEach(dept => {
      // Calculate technical issues score
      metrics.technicalIssues[dept.name] = dept.key_projects.filter(c => 
        c.toLowerCase().includes('technical') || 
        c.toLowerCase().includes('security') || 
        c.toLowerCase().includes('infrastructure')
      ).length;

      // Calculate resource constraints score
      metrics.resourceConstraints[dept.name] = dept.key_projects.filter(c =>
        c.toLowerCase().includes('resource') ||
        c.toLowerCase().includes('budget') ||
        c.toLowerCase().includes('staff')
      ).length;

      // Calculate compliance risks score
      metrics.complianceRisks[dept.name] = dept.common_blockers.filter(r =>
        r.toLowerCase().includes('compliance') ||
        r.toLowerCase().includes('regulatory') ||
        r.toLowerCase().includes('security')
      ).length;

      // Calculate process improvements score
      const improvements = dept.members.reduce((acc, member) => 
        acc + member.recent_completed.filter(a =>
          a.toLowerCase().includes('improved') ||
          a.toLowerCase().includes('optimized') ||
          a.toLowerCase().includes('reduced')
        ).length, 0);
      metrics.processImprovements[dept.name] = improvements;
    });

    return metrics;
  };

  const getRadarChartData = (departments: DepartmentData[]) => {
    const metrics = calculateCrossDepartmentMetrics(departments);
    return departments.map(dept => ({
      department: dept.name,
      'Technical Issues': metrics.technicalIssues[dept.name] || 0,
      'Resource Constraints': metrics.resourceConstraints[dept.name] || 0,
      'Compliance Risks': metrics.complianceRisks[dept.name] || 0,
      'Process Improvements': metrics.processImprovements[dept.name] || 0,
    }));
  };

  const renderCrossDepartmentPatterns = () => {
    if (!teamData) return null;

    const radarData = getRadarChartData(teamData.departments);

    const correlationData = teamData.departments.map(dept => ({
      x: dept.common_blockers.length,
      y: dept.average_productivity,
      z: radarData.find(d => d.department === dept.name)?.['Technical Issues'] || 0,
      name: dept.name,
    }));

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cross-Department Challenge Patterns
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="department" />
                  <PolarRadiusAxis />
                  <Radar name="Technical Issues" dataKey="Technical Issues" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  <Radar name="Resource Constraints" dataKey="Resource Constraints" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  <Radar name="Compliance Risks" dataKey="Compliance Risks" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                  <Radar name="Process Improvements" dataKey="Process Improvements" stroke="#ff7300" fill="#ff7300" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resource Constraints vs Sentiment Correlation
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="Resource Constraints" />
                  <YAxis type="number" dataKey="y" name="Sentiment" domain={[-1, 1]} />
                  <ZAxis type="number" dataKey="z" range={[100, 500]} name="Technical Issues" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={correlationData} fill="#8884d8">
                    {correlationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getProductivityColor(entry.y)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cross-Department Dependencies
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Technical Infrastructure & Security
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Solutions → Service Assurance"
                        secondary="Scalability and Security Issues"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="IT → Platform Engineering"
                        secondary="Infrastructure and Monitoring"
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" color="error" gutterBottom>
                    Resource & Budget Constraints
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="HR → Development"
                        secondary="Technical Recruitment"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="IT → Platform Engineering"
                        secondary="Budget and Resources"
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" color="info" gutterBottom>
                    Compliance & Risk Management
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Legal → IT"
                        secondary="Data Privacy and Compliance"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Service Assurance → Development"
                        secondary="Security Implementation"
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !teamData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'No data available'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Overview Cards */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                Team Updates
              </Typography>
              <Typography variant="h3" color="primary">
                {teamData.total_update_count}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total updates submitted
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                Productivity
              </Typography>
              <Typography 
                variant="h3" 
                sx={{ color: getProductivityColor(teamData.team_productivity) }}
              >
                {(teamData.team_productivity * 100).toFixed(0)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Average team productivity
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                Active Projects
              </Typography>
              <Typography variant="h3" color="info.main">
                {teamData.active_projects.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Projects in progress
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                Departments
              </Typography>
              <Typography variant="h3" color="success.main">
                {teamData.departments.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active departments
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Department Analysis */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Department Performance
        </Typography>
        <Grid container spacing={3}>
          {teamData.departments.map((dept, index) => (
            <Grid item xs={12} md={6} key={dept.name}>
              <Paper 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  '&:hover': {
                    boxShadow: 2
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {dept.name}
                  </Typography>
                  <Chip
                    label={`${(dept.average_productivity * 100).toFixed(0)}%`}
                    sx={{
                      bgcolor: getProductivityColor(dept.average_productivity),
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Team Members
                    </Typography>
                    <Typography variant="h6">
                      {dept.members.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Updates
                    </Typography>
                    <Typography variant="h6">
                      {dept.total_updates}
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Key Projects
                </Typography>
                <List dense sx={{ pt: 0 }}>
                  {dept.key_projects.slice(0, 3).map((project, i) => (
                    <ListItem key={i} sx={{ px: 0 }}>
                      <ListItemText 
                        primary={project}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: { lineHeight: 1.4 }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Cross-Department Analysis */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cross-Department Analysis
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, height: '500px', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" gutterBottom>
                Challenge Patterns
              </Typography>
              <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                <ResponsiveContainer>
                  <RadarChart data={getRadarChartData(teamData.departments)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="department" />
                    <PolarRadiusAxis />
                    <Radar 
                      name="Technical Issues" 
                      dataKey="Technical Issues" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3} 
                    />
                    <Radar 
                      name="Resource Constraints" 
                      dataKey="Resource Constraints" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.3} 
                    />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, height: '500px', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" gutterBottom>
                Resource vs Productivity
              </Typography>
              <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Resource Constraints"
                      label={{ value: 'Resource Constraints', position: 'bottom' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Productivity"
                      domain={[0, 1]}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      label={{ value: 'Productivity', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => [
                        name === 'y' ? `${(Number(value) * 100).toFixed(1)}%` : value,
                        name === 'y' ? 'Productivity' : 'Resource Constraints'
                      ]}
                    />
                    <Scatter 
                      data={teamData.departments.map(dept => ({
                        x: dept.common_blockers.length,
                        y: dept.average_productivity,
                        name: dept.name
                      }))} 
                      fill="#8884d8"
                    >
                      {teamData.departments.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getProductivityColor(entry.average_productivity)} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
} 