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

interface UpdateFormData {
  name: string;
  department: string;
  project_progress: string;
  completed_tasks: string;
  blockers: string;
  next_week_plans: string;
}

interface SubmitUpdateProps {
  onSubmitSuccess: () => void;
}

export default function SubmitUpdate({ onSubmitSuccess }: SubmitUpdateProps) {
  const [formData, setFormData] = useState<UpdateFormData>({
    name: '',
    department: '',
    project_progress: '',
    completed_tasks: '',
    blockers: '',
    next_week_plans: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const departments = [
    'Development',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'HR',
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit update (Status: ${response.status})`);
      }

      setSuccess(true);
      setFormData({
        name: '',
        department: '',
        project_progress: '',
        completed_tasks: '',
        blockers: '',
        next_week_plans: '',
      });
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
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                name="department"
                value={formData.department}
                label="Department"
                onChange={handleChange}
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
              rows={3}
              label="Project Progress"
              name="project_progress"
              value={formData.project_progress}
              onChange={handleChange}
              helperText="List your key achievements and progress this week"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Completed Tasks"
              name="completed_tasks"
              value={formData.completed_tasks}
              onChange={handleChange}
              helperText="List the tasks you completed this week"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Blockers"
              name="blockers"
              value={formData.blockers}
              onChange={handleChange}
              helperText="List any blockers or challenges you're facing"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Next Week's Plans"
              name="next_week_plans"
              value={formData.next_week_plans}
              onChange={handleChange}
              helperText="Outline your plans and goals for next week"
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
                Update submitted successfully!
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