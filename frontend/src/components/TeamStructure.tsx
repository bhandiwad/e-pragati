import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  reports_to?: string;
}

interface DepartmentNode {
  id: string;
  name: string;
  children: (DepartmentNode | TeamMember)[];
}

export default function TeamStructure() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [organizationData, setOrganizationData] = useState<DepartmentNode | null>(null);

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Simulated data for now
      const data: DepartmentNode = {
        id: 'org',
        name: 'Organization',
        children: [
          {
            id: 'dev',
            name: 'Development',
            children: [
              {
                id: 'dev-1',
                name: 'John Smith',
                role: 'Engineering Director',
                department: 'Development'
              },
              {
                id: 'dev-2',
                name: 'Sarah Johnson',
                role: 'Lead Developer',
                department: 'Development'
              },
              {
                id: 'dev-3',
                name: 'Michael Chen',
                role: 'Senior Developer',
                department: 'Development'
              },
              {
                id: 'dev-4',
                name: 'Emily Davis',
                role: 'Full Stack Developer',
                department: 'Development'
              },
              {
                id: 'dev-5',
                name: 'David Wilson',
                role: 'Backend Developer',
                department: 'Development'
              },
              {
                id: 'dev-6',
                name: 'Lisa Anderson',
                role: 'Frontend Developer',
                department: 'Development'
              },
              {
                id: 'dev-7',
                name: 'James Taylor',
                role: 'DevOps Engineer',
                department: 'Development'
              },
              {
                id: 'dev-8',
                name: 'Anna Martinez',
                role: 'QA Engineer',
                department: 'Development'
              }
            ]
          },
          {
            id: 'product',
            name: 'Product',
            children: [
              {
                id: 'prod-1',
                name: 'Mike Wilson',
                role: 'Product Director',
                department: 'Product'
              },
              {
                id: 'prod-2',
                name: 'Rachel Brown',
                role: 'Senior Product Manager',
                department: 'Product'
              },
              {
                id: 'prod-3',
                name: 'Tom Harris',
                role: 'Product Manager',
                department: 'Product'
              },
              {
                id: 'prod-4',
                name: 'Sophie Lee',
                role: 'Product Analyst',
                department: 'Product'
              },
              {
                id: 'prod-5',
                name: 'Alex Turner',
                role: 'UX Researcher',
                department: 'Product'
              }
            ]
          },
          {
            id: 'design',
            name: 'Design',
            children: [
              {
                id: 'des-1',
                name: 'Emily Chen',
                role: 'Design Director',
                department: 'Design'
              },
              {
                id: 'des-2',
                name: 'Daniel Kim',
                role: 'Senior UI Designer',
                department: 'Design'
              },
              {
                id: 'des-3',
                name: 'Jessica Wong',
                role: 'UX Designer',
                department: 'Design'
              },
              {
                id: 'des-4',
                name: 'Ryan Park',
                role: 'Visual Designer',
                department: 'Design'
              }
            ]
          },
          {
            id: 'marketing',
            name: 'Marketing',
            children: [
              {
                id: 'mkt-1',
                name: 'Laura Thompson',
                role: 'Marketing Director',
                department: 'Marketing'
              },
              {
                id: 'mkt-2',
                name: 'Chris Evans',
                role: 'Content Manager',
                department: 'Marketing'
              },
              {
                id: 'mkt-3',
                name: 'Maria Garcia',
                role: 'Social Media Manager',
                department: 'Marketing'
              },
              {
                id: 'mkt-4',
                name: 'Kevin White',
                role: 'SEO Specialist',
                department: 'Marketing'
              },
              {
                id: 'mkt-5',
                name: 'Nina Patel',
                role: 'Marketing Analyst',
                department: 'Marketing'
              }
            ]
          },
          {
            id: 'sales',
            name: 'Sales',
            children: [
              {
                id: 'sales-1',
                name: 'Robert Miller',
                role: 'Sales Director',
                department: 'Sales'
              },
              {
                id: 'sales-2',
                name: 'Amanda Clark',
                role: 'Senior Account Executive',
                department: 'Sales'
              },
              {
                id: 'sales-3',
                name: 'Steven Wright',
                role: 'Account Manager',
                department: 'Sales'
              },
              {
                id: 'sales-4',
                name: 'Linda Rodriguez',
                role: 'Sales Representative',
                department: 'Sales'
              },
              {
                id: 'sales-5',
                name: 'Paul Green',
                role: 'Sales Operations',
                department: 'Sales'
              },
              {
                id: 'sales-6',
                name: 'Sarah Foster',
                role: 'Business Development',
                department: 'Sales'
              }
            ]
          },
          {
            id: 'hr',
            name: 'Human Resources',
            children: [
              {
                id: 'hr-1',
                name: 'Patricia Adams',
                role: 'HR Director',
                department: 'HR'
              },
              {
                id: 'hr-2',
                name: 'Mark Johnson',
                role: 'HR Manager',
                department: 'HR'
              },
              {
                id: 'hr-3',
                name: 'Helen Brooks',
                role: 'Recruiter',
                department: 'HR'
              },
              {
                id: 'hr-4',
                name: 'George Taylor',
                role: 'HR Specialist',
                department: 'HR'
              }
            ]
          },
          {
            id: 'finance',
            name: 'Finance',
            children: [
              {
                id: 'fin-1',
                name: 'William Turner',
                role: 'Finance Director',
                department: 'Finance'
              },
              {
                id: 'fin-2',
                name: 'Susan Lee',
                role: 'Financial Controller',
                department: 'Finance'
              },
              {
                id: 'fin-3',
                name: 'David Chen',
                role: 'Financial Analyst',
                department: 'Finance'
              },
              {
                id: 'fin-4',
                name: 'Karen White',
                role: 'Accountant',
                department: 'Finance'
              }
            ]
          },
          {
            id: 'ops',
            name: 'Operations',
            children: [
              {
                id: 'ops-1',
                name: 'Richard Baker',
                role: 'Operations Director',
                department: 'Operations'
              },
              {
                id: 'ops-2',
                name: 'Jennifer Hill',
                role: 'Operations Manager',
                department: 'Operations'
              },
              {
                id: 'ops-3',
                name: 'Thomas Young',
                role: 'Project Manager',
                department: 'Operations'
              },
              {
                id: 'ops-4',
                name: 'Michelle Lee',
                role: 'Operations Analyst',
                department: 'Operations'
              },
              {
                id: 'ops-5',
                name: 'Brian Wilson',
                role: 'Business Analyst',
                department: 'Operations'
              }
            ]
          },
          {
            id: 'legal',
            name: 'Legal',
            children: [
              {
                id: 'legal-1',
                name: 'Catherine Moore',
                role: 'Legal Director',
                department: 'Legal'
              },
              {
                id: 'legal-2',
                name: 'Andrew Ross',
                role: 'Senior Counsel',
                department: 'Legal'
              },
              {
                id: 'legal-3',
                name: 'Elizabeth Ward',
                role: 'Legal Counsel',
                department: 'Legal'
              },
              {
                id: 'legal-4',
                name: 'Peter Collins',
                role: 'Compliance Officer',
                department: 'Legal'
              }
            ]
          }
        ]
      };
      setOrganizationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const renderTree = (node: DepartmentNode | TeamMember) => {
    const isTeamMember = 'role' in node;
    const label = isTeamMember ? (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
        <PersonIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
        <Box>
          <Typography variant="body1">{node.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {node.role}
          </Typography>
        </Box>
      </Box>
    ) : (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
        <GroupIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
        <Typography variant="body1">{node.name}</Typography>
      </Box>
    );

    return (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={label}
      >
        {!isTeamMember && node.children.map((child) => renderTree(child))}
      </TreeItem>
    );
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

  if (!organizationData) {
    return null;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Organization Structure
      </Typography>
      <Box sx={{ maxWidth: '100%', overflow: 'auto' }}>
        <TreeView
          aria-label="organization structure"
          defaultExpandIcon={<ChevronRightIcon />}
          defaultCollapseIcon={<ExpandMoreIcon />}
          expanded={expanded}
          onNodeToggle={handleToggle}
          sx={{ 
            flexGrow: 1,
            maxWidth: 800,
            '& .MuiTreeItem-root': {
              '& .MuiTreeItem-content': {
                py: 0.5
              }
            }
          }}
        >
          {renderTree(organizationData)}
        </TreeView>
      </Box>
    </Paper>
  );
} 