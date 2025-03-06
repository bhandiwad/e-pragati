import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Chip,
  Grid,
  ListItemButton,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

interface HistoryEntry {
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

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:8001/history');
        setHistory(response.data.history);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    fetchHistory();
  }, []);

  const handleExpandClick = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const getProductivityColor = (score: number) => {
    if (score >= 0.7) return '#4caf50';
    if (score >= 0.4) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Weekly Updates History
        </Typography>
        {history.length === 0 ? (
          <Typography color="textSecondary">No updates found</Typography>
        ) : (
          <List sx={{ mt: 2 }}>
            {history.map((entry, index) => (
              <Paper 
                key={index} 
                sx={{ 
                  mb: 2, 
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: 2
                  }
                }}
                elevation={1}
              >
                <ListItemButton 
                  onClick={() => handleExpandClick(index)}
                  sx={{ 
                    p: 2,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {entry.team_member}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                        {format(new Date(entry.timestamp), 'MMMM d, yyyy HH:mm')}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {entry.update}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={`Productivity: ${(entry.analysis.Productivity_Score * 100).toFixed(0)}%`}
                        sx={{
                          bgcolor: getProductivityColor(entry.analysis.Productivity_Score),
                          color: 'white',
                          fontWeight: 500,
                          minWidth: 120
                        }}
                      />
                      {expandedItem === index ? <ExpandLess /> : <ExpandMore />}
                    </Grid>
                  </Grid>
                </ListItemButton>
                <Collapse in={expandedItem === index} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 3, bgcolor: 'background.default' }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Completed Tasks
                          </Typography>
                          <List dense sx={{ pt: 0 }}>
                            {entry.analysis.Completed_Tasks.map((task, i) => (
                              <ListItem key={i} sx={{ px: 0 }}>
                                <ListItemText 
                                  primary={task}
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
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="info.main" gutterBottom>
                            Project Progress
                          </Typography>
                          <List dense sx={{ pt: 0 }}>
                            {entry.analysis.Project_Progress.map((progress, i) => (
                              <ListItem key={i} sx={{ px: 0 }}>
                                <ListItemText 
                                  primary={progress}
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
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="success.main" gutterBottom>
                            Goals Status
                          </Typography>
                          <List dense sx={{ pt: 0 }}>
                            {entry.analysis.Goals_Status.map((goal, i) => (
                              <ListItem key={i} sx={{ px: 0 }}>
                                <ListItemText 
                                  primary={goal}
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
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                          <Typography variant="subtitle2" color="error.main" gutterBottom>
                            Blockers
                          </Typography>
                          <List dense sx={{ pt: 0 }}>
                            {entry.analysis.Blockers.map((blocker, i) => (
                              <ListItem key={i} sx={{ px: 0 }}>
                                <ListItemText 
                                  primary={blocker}
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
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="info.main" gutterBottom>
                            Next Week's Plans
                          </Typography>
                          <List dense sx={{ pt: 0 }}>
                            {entry.analysis.Next_Week_Plans.map((plan, i) => (
                              <ListItem key={i} sx={{ px: 0 }}>
                                <ListItemText 
                                  primary={plan}
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
                    </Grid>
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
} 