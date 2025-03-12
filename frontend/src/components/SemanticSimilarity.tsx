import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  LinearProgress,
  useTheme,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import { API_BASE_URL } from '../config';

interface SimilarityScore {
  score: number;
  date1: string;
  date2: string;
  update1_id: number;
  update2_id: number;
}

interface StalledPeriod {
  start_date: string;
  end_date: string;
  similarity: number;
  update1_id: number;
  update2_id: number;
}

interface TeamMemberResult {
  team_member: string;
  role: string;
  department: string;
  average_similarity: number;
  update_count: number;
  similarity_trend: SimilarityScore[];
  stalled_periods: StalledPeriod[];
}

interface SimilarityResponse {
  analysis_period: string;
  similarity_threshold: number;
  results: TeamMemberResult[];
}

const SemanticSimilarity: React.FC = () => {
  const [data, setData] = useState<SimilarityResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number>(60);
  const [threshold, setThreshold] = useState<number>(0.85);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  
  const theme = useTheme();

  useEffect(() => {
    fetchData();
  }, [days, threshold]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/semantic-similarity?days=${days}&threshold=${threshold}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      setData(responseData);
      setError(null);
    } catch (err) {
      console.error('Error fetching semantic similarity data:', err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDaysChange = (event: SelectChangeEvent<number>) => {
    setDays(event.target.value as number);
  };

  const handleThresholdChange = (_event: Event, newValue: number | number[]) => {
    setThreshold(newValue as number);
  };

  const toggleMemberExpand = (memberName: string) => {
    if (expandedMember === memberName) {
      setExpandedMember(null);
    } else {
      setExpandedMember(memberName);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= threshold) {
      return theme.palette.error.main; // Red for high similarity (bad)
    } else if (score >= threshold - 0.15) {
      return theme.palette.warning.main; // Orange for medium similarity
    } else {
      return theme.palette.success.main; // Green for low similarity (good)
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Semantic Similarity Analysis
        <Tooltip title="This analysis uses AI to detect if employees are submitting similar updates over time without making real progress. High similarity scores with stable or decreasing productivity may indicate stalling.">
          <IconButton>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Analysis Settings
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                value={days}
                label="Time Range"
                onChange={handleDaysChange}
              >
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={60}>Last 60 days</MenuItem>
                <MenuItem value={90}>Last 90 days</MenuItem>
                <MenuItem value={180}>Last 6 months</MenuItem>
                <MenuItem value={365}>Last year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography id="similarity-threshold-slider" gutterBottom>
              Similarity Threshold: {threshold.toFixed(2)}
            </Typography>
            <Slider
              value={threshold}
              onChange={handleThresholdChange}
              aria-labelledby="similarity-threshold-slider"
              step={0.01}
              marks={[
                { value: 0.7, label: '0.7' },
                { value: 0.8, label: '0.8' },
                { value: 0.9, label: '0.9' },
                { value: 1.0, label: '1.0' },
              ]}
              min={0.7}
              max={1.0}
            />
            <Typography variant="caption" color="text.secondary">
              Higher values (closer to 1.0) detect only very similar updates
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Analyzing semantic similarity...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : data && data.results.length > 0 ? (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            Analysis period: {data.analysis_period} | Threshold: {data.similarity_threshold.toFixed(2)}
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            Employees with Potential Stalling ({data.results.length})
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Team Member</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Avg. Similarity</TableCell>
                  <TableCell>Updates</TableCell>
                  <TableCell>Stalled Periods</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.results.map((result) => (
                  <React.Fragment key={result.team_member}>
                    <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                      <TableCell component="th" scope="row">
                        {result.team_member}
                      </TableCell>
                      <TableCell>{result.department}</TableCell>
                      <TableCell>{result.role}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={result.average_similarity * 100}
                              sx={{
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: theme.palette.grey[300],
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getSimilarityColor(result.average_similarity),
                                  borderRadius: 5,
                                }
                              }}
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {(result.average_similarity * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{result.update_count}</TableCell>
                      <TableCell>
                        <Chip 
                          icon={<WarningIcon />}
                          label={result.stalled_periods.length}
                          color={result.stalled_periods.length > 2 ? "error" : "warning"}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          aria-label="expand row"
                          size="small"
                          onClick={() => toggleMemberExpand(result.team_member)}
                        >
                          {expandedMember === result.team_member ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded details */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={expandedMember === result.team_member} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Stalled Periods
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Start Date</TableCell>
                                  <TableCell>End Date</TableCell>
                                  <TableCell>Similarity Score</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {result.stalled_periods.map((period, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{period.start_date}</TableCell>
                                    <TableCell>{period.end_date}</TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LinearProgress
                                          variant="determinate"
                                          value={period.similarity * 100}
                                          sx={{
                                            height: 8,
                                            width: '100px',
                                            borderRadius: 5,
                                            backgroundColor: theme.palette.grey[300],
                                            '& .MuiLinearProgress-bar': {
                                              backgroundColor: getSimilarityColor(period.similarity),
                                              borderRadius: 5,
                                            }
                                          }}
                                        />
                                        <Typography sx={{ ml: 1 }} variant="body2">
                                          {(period.similarity * 100).toFixed(0)}%
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            
                            <Typography variant="h6" sx={{ mt: 3 }} gutterBottom component="div">
                              Similarity Trend
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {result.similarity_trend.map((score, index) => (
                                <Tooltip 
                                  key={index}
                                  title={`${score.date1} to ${score.date2}: ${(score.score * 100).toFixed(0)}% similar`}
                                >
                                  <Chip
                                    label={`${(score.score * 100).toFixed(0)}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: getSimilarityColor(score.score),
                                      color: score.score >= threshold - 0.1 ? 'white' : 'inherit',
                                    }}
                                  />
                                </Tooltip>
                              ))}
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Alert severity="info">
          No employees showing patterns of stalled progress were detected.
        </Alert>
      )}
    </Box>
  );
};

export default SemanticSimilarity; 