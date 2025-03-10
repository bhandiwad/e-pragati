import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';

interface SubmitUpdateProps {
  onSubmitSuccess: () => void;
}

export default function SubmitUpdate({ onSubmitSuccess }: SubmitUpdateProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const departments = [
    'Development',
    'Product Management',
    'Solutions',
    'Service Delivery',
    'Service Assurance',
    'IT',
    'HR',
    'Legal',
    'Platform Engineering',
  ];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleRoleChange = (e: SelectChangeEvent) => {
    setRole(e.target.value);
  };

  const handleUpdateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateText(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !updateText) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const teamMember = `${name} - ${role}`;
      
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_member: teamMember,
          text: updateText
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit update (Status: ${response.status})`);
      }

      setSuccess(true);
      setName('');
      setRole('');
      setUpdateText('');
      onSubmitSuccess();
    } catch (err) {
      console.error('Error submitting update:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Submit Weekly Update
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Name"
              value={name}
              onChange={handleNameChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                value={role}
                label="Department"
                onChange={handleRoleChange}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              multiline
              rows={10}
              label="Weekly Update"
              value={updateText}
              onChange={handleUpdateTextChange}
              helperText="Provide a detailed update of your week including completed tasks, project progress, any blockers, and your plans for next week. The system will automatically analyze your update to extract the relevant information."
            />
          </Grid>
          <Grid item xs={12}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Update submitted successfully! The system has analyzed your update and extracted the relevant information.
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            >
              Submit Update
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
} 