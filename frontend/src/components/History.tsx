import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { API_BASE_URL } from '../config';

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

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      console.log('Fetching history data...');
      
      try {
        console.log('Sending request to:', `${API_BASE_URL}/history`);
        const response = await fetch(`${API_BASE_URL}/history`);
        
        if (!response.ok) {
          console.error('Server responded with status:', response.status);
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        console.log('History API full response:', jsonData);
        
        // The API response could be either an array directly or an object with a 'history' property
        // Handle both cases
        if (Array.isArray(jsonData)) {
          console.log('Response is an array, items count:', jsonData.length);
          setHistory(jsonData);
        } else if (jsonData && jsonData.history && Array.isArray(jsonData.history)) {
          console.log('Response has history property, items count:', jsonData.history.length);
          setHistory(jsonData.history);
        } else {
          console.error('Unexpected response format:', jsonData);
          throw new Error('Unexpected response format from server');
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setError(`Failed to load history: ${err instanceof Error ? err.message : 'Unknown error'}`);
        
        // Set some fallback data for testing
        const fallbackData = [
          {
            timestamp: "2025-03-08T10:16:39.079000",
            team_member: "Parikshit",
            update: "I worked on the pricing for AI Cloud. There is dependency on development team to finalize on resource consumption for some features. Pricing will depend on those. I also worked TSD for IKS. Its 80% complete",
            analysis: {
              Completed_Tasks: ["Pricing for AI Cloud"],
              Project_Progress: ["Working on TSD for IKS (80% complete)"],
              Goals_Status: ["Pricing for AI Cloud (incomplete due to dependency)", "TSD for IKS (80% complete)"],
              Blockers: ["Dependency on development team to finalize on resource consumption for some features"],
              Next_Week_Plans: ["Finalize pricing for AI Cloud", "Complete TSD for IKS"],
              Productivity_Score: 0.8
            }
          },
          {
            timestamp: "2025-03-08T10:15:00.575000",
            team_member: "Test User",
            update: "This is another test update about completing the dashboard feature with charts and statistics. Made progress on API integration, about 70% done.",
            analysis: {
              Completed_Tasks: ["Completed the dashboard feature with charts and statistics"],
              Project_Progress: ["Made progress on the API integration, about 70% done"],
              Goals_Status: ["Dashboard feature completed", "API integration 70% completed"],
              Blockers: ["Facing issues with the authentication module"],
              Next_Week_Plans: ["Finish the API integration", "Start working on the user management module"],
              Productivity_Score: 0.7
            }
          }
        ];
        console.log('Setting fallback data');
        setHistory(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilter(event.target.value);
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    setSortOrder(event.target.value as 'asc' | 'desc');
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.team_member === filter;
  });

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const teamMembers = Array.from(new Set(history.map(item => item.team_member)));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Update History</Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-label">Team Member</InputLabel>
          <Select
            labelId="filter-label"
            value={filter}
            label="Team Member"
            onChange={handleFilterChange}
          >
            <MenuItem value="all">All Team Members</MenuItem>
            {teamMembers.map(member => (
              <MenuItem key={member} value={member}>{member}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="sort-label">Sort Order</InputLabel>
          <Select
            labelId="sort-label"
            value={sortOrder}
            label="Sort Order"
            onChange={handleSortChange}
          >
            <MenuItem value="desc">Newest First</MenuItem>
            <MenuItem value="asc">Oldest First</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : sortedHistory.length === 0 ? (
        <Alert severity="info">No updates found.</Alert>
      ) : (
        <Box>
          {sortedHistory.map((item, index) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container alignItems="center">
                  <Grid item xs={3}>
                    <Typography fontWeight="bold">{item.team_member}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography color="text.secondary">{formatDate(item.timestamp)}</Typography>
                  </Grid>
                  <Grid item xs={5}>
                    <Chip 
                      label={`Productivity: ${(item.analysis.Productivity_Score * 100).toFixed(0)}%`}
                      color={item.analysis.Productivity_Score > 0.7 ? "success" : 
                             item.analysis.Productivity_Score > 0.4 ? "warning" : "error"}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" paragraph>{item.update}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Completed Tasks</Typography>
                        {item.analysis.Completed_Tasks.length > 0 ? (
                          <ul>
                            {item.analysis.Completed_Tasks.map((task, i) => (
                              <li key={i}><Typography variant="body2">{task}</Typography></li>
                            ))}
                          </ul>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No completed tasks reported</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Blockers</Typography>
                        {item.analysis.Blockers.length > 0 ? (
                          <ul>
                            {item.analysis.Blockers.map((blocker, i) => (
                              <li key={i}><Typography variant="body2">{blocker}</Typography></li>
                            ))}
                          </ul>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No blockers reported</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default History; 