import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Grid, 
  Card, 
  CardHeader, 
  CardContent,
  Divider,
  Chip,
  useTheme,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { API_BASE_URL } from '../config';

// Type definitions
interface KeywordCount {
  keyword: string;
  count: number;
}

interface TeamMemberKeywords {
  team_member: string;
  repeated_keywords: KeywordCount[];
  total_updates: number;
}

// Helper function to get color based on count value
const getHeatmapColor = (count: number, maxCount: number, theme: any) => {
  // Colors from blue (low) to red (high)
  const colorScale = [
    theme.palette.info.light,    // Lowest (blue)
    theme.palette.primary.light, // Low-medium (light blue)
    theme.palette.warning.light, // Medium (yellow/orange)
    theme.palette.warning.main,  // Medium-high (orange)
    theme.palette.error.main     // Highest (red)
  ];
  
  // Normalize count to 0-1 range
  const normalizedCount = Math.min(count / maxCount, 1);
  
  // Map to color index
  const index = Math.floor(normalizedCount * (colorScale.length - 1));
  
  return colorScale[index];
};

// Fallback data for demonstration
const FALLBACK_DATA: TeamMemberKeywords[] = [
  {
    team_member: "John Doe",
    repeated_keywords: [
      { keyword: "blocked", count: 5 },
      { keyword: "dependency", count: 4 },
      { keyword: "waiting", count: 3 },
      { keyword: "issue", count: 2 },
      { keyword: "pending", count: 2 }
    ],
    total_updates: 8
  },
  {
    team_member: "Jane Smith",
    repeated_keywords: [
      { keyword: "progress", count: 4 },
      { keyword: "completed", count: 3 },
      { keyword: "review", count: 2 }
    ],
    total_updates: 7
  },
  {
    team_member: "Alex Johnson",
    repeated_keywords: [
      { keyword: "stuck", count: 6 },
      { keyword: "problem", count: 5 },
      { keyword: "blocker", count: 4 },
      { keyword: "delay", count: 3 },
      { keyword: "missing", count: 2 },
      { keyword: "requirement", count: 2 }
    ],
    total_updates: 10
  },
  {
    team_member: "Sarah Williams",
    repeated_keywords: [
      { keyword: "meeting", count: 4 },
      { keyword: "discussion", count: 3 },
      { keyword: "planning", count: 2 }
    ],
    total_updates: 6
  },
  {
    team_member: "Michael Brown",
    repeated_keywords: [
      { keyword: "testing", count: 5 },
      { keyword: "bugs", count: 4 },
      { keyword: "fixing", count: 3 },
      { keyword: "issue", count: 2 }
    ],
    total_updates: 9
  },
  {
    team_member: "Emily Davis",
    repeated_keywords: [
      { keyword: "documentation", count: 3 },
      { keyword: "writing", count: 2 },
      { keyword: "explaining", count: 2 }
    ],
    total_updates: 5
  }
];

// Component to display the keyword frequency heatmap
const KeywordRepetition: React.FC = () => {
  const [data, setData] = useState<TeamMemberKeywords[]>(FALLBACK_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      
      try {
        console.log(`Fetching keyword repetition data for the last ${timeRange} days...`);
        const response = await fetch(`${API_BASE_URL}/keyword-repetition?days=${timeRange}`);
        
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Received data:', result);
        
        // Only update the data if we have results, otherwise keep fallback
        if (result && Array.isArray(result) && result.length > 0) {
          console.log(`Found ${result.length} team members with keyword data`);
          setData(result);
        } else {
          // Keep using the fallback data if the API returns empty results
          console.log('Received empty or invalid data from API, using fallback data');
          setUsingFallback(true);
          setError("Backend returned empty data. Using sample data for demonstration.");
          // Keeping fallback data (already in state)
        }
      } catch (err) {
        console.error('Error fetching keyword repetition data:', err);
        setError(`Error connecting to API. Using sample data for demonstration.`);
        setUsingFallback(true);
        
        // Fallback data is already set as initial state
        console.log('Using fallback data due to API error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);

  const handleTimeRangeChange = (event: SelectChangeEvent<number>) => {
    setTimeRange(event.target.value as number);
  };

  // Find the maximum count for color scaling
  const maxCount = data.length > 0 
    ? Math.max(...data.flatMap(item => 
        item.repeated_keywords.map(kw => kw.count)
    )) 
    : 1;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Keyword Repetition Analysis
            <Tooltip title="This visualization highlights team members who repeat the same keywords across consecutive updates, which may indicate they are stuck on the same issues.">
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Identifying team members who may be stuck on the same issues
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
          >
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={14}>Last 14 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
            <MenuItem value={60}>Last 60 days</MenuItem>
            <MenuItem value={90}>Last 90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>{error}</Alert>
          {usingFallback && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Using sample data. The backend may be experiencing issues with NLTK language resources.
            </Alert>
          )}
          <Grid container spacing={3}>
            {data.map((memberData) => (
              <Grid item xs={12} md={6} lg={4} key={memberData.team_member}>
                <Card elevation={3}>
                  <CardHeader
                    title={memberData.team_member}
                    subheader={`${memberData.total_updates} updates analyzed`}
                  />
                  <Divider />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Keywords repeated across consecutive updates:
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {memberData.repeated_keywords
                        .sort((a, b) => b.count - a.count)
                        .map((kw) => (
                          <Chip
                            key={kw.keyword}
                            label={`${kw.keyword} (${kw.count})`}
                            sx={{
                              bgcolor: getHeatmapColor(kw.count, maxCount, theme),
                              color: kw.count > maxCount / 2 ? 'white' : 'inherit',
                              fontWeight: kw.count === maxCount ? 'bold' : 'normal',
                            }}
                          />
                        ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <Grid container spacing={3}>
          {data.map((memberData) => (
            <Grid item xs={12} md={6} lg={4} key={memberData.team_member}>
              <Card elevation={3}>
                <CardHeader
                  title={memberData.team_member}
                  subheader={`${memberData.total_updates} updates analyzed`}
                />
                <Divider />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Keywords repeated across consecutive updates:
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {memberData.repeated_keywords
                      .sort((a, b) => b.count - a.count)
                      .map((kw) => (
                        <Chip
                          key={kw.keyword}
                          label={`${kw.keyword} (${kw.count})`}
                          sx={{
                            bgcolor: getHeatmapColor(kw.count, maxCount, theme),
                            color: kw.count > maxCount / 2 ? 'white' : 'inherit',
                            fontWeight: kw.count === maxCount ? 'bold' : 'normal',
                          }}
                        />
                      ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default KeywordRepetition; 