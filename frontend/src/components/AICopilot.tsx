import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as CopilotIcon,
  Person as UserIcon,
  AutoGraph as InsightIcon,
  Warning as AlertIcon,
  Lightbulb as SuggestionIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'insight' | 'alert' | 'suggestion';
    data?: any;
    suggestedQuestions?: string[];
  };
}

interface QuickAction {
  id: string;
  label: string;
  query: string;
}

const STORAGE_KEY = 'copilot_history';
const MAX_HISTORY = 50; // Maximum number of messages to store

export default function Copilot() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert stored timestamps back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (e) {
        console.error('Error parsing stored messages:', e);
        return [getWelcomeMessage()];
      }
    }
    return [getWelcomeMessage()];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Store messages in localStorage whenever they change
  useEffect(() => {
    const messagesToStore = messages.slice(-MAX_HISTORY); // Keep only the last MAX_HISTORY messages
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToStore));
  }, [messages]);

  function getWelcomeMessage(): Message {
    return {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your Copilot. I can help you with:' +
        '\n• Team updates and productivity insights' +
        '\n• Employee engagement analysis' +
        '\n• Project progress tracking' +
        '\n• Department performance metrics' +
        '\n\nHow can I assist you today?',
      timestamp: new Date(),
      metadata: {
        type: 'suggestion',
        suggestedQuestions: [
          'Show me team productivity trends',
          'Who are the top performers this month?',
          'What are the current project blockers?'
        ]
      }
    };
  }

  const quickActions: QuickAction[] = [
    {
      id: 'missing-updates',
      label: 'Missing Updates',
      query: 'Who has not submitted their update this week?'
    },
    {
      id: 'productivity',
      label: 'Team Productivity',
      query: 'Show me team productivity trends for the last month'
    },
    {
      id: 'blockers',
      label: 'Current Blockers',
      query: 'What are the current blockers across teams?'
    },
    {
      id: 'engagement',
      label: 'Team Engagement',
      query: 'Which teams have the highest engagement?'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateSuggestedQuestions = (content: string): string[] => {
    // This is a simple implementation. In production, you'd want to use
    // the backend to generate contextually relevant questions
    const lowercased = content.toLowerCase();
    const suggestions: string[] = [];

    if (lowercased.includes('productivity')) {
      suggestions.push(
        'How does this compare to last month?',
        'Which team members improved the most?',
        'What factors contributed to these productivity changes?'
      );
    }
    if (lowercased.includes('blocker') || lowercased.includes('issue')) {
      suggestions.push(
        'Are there any patterns in these blockers?',
        'How long have these blockers been active?',
        'Who can help resolve these blockers?'
      );
    }
    if (lowercased.includes('team') || lowercased.includes('department')) {
      suggestions.push(
        'What is the team\'s current workload?',
        'How is the team engagement level?',
        'What are the team\'s key achievements?'
      );
    }
    if (lowercased.includes('update')) {
      suggestions.push(
        'What are the key highlights from recent updates?',
        'Are there any concerning trends?',
        'Who are the most consistent updaters?'
      );
    }

    // Always add some general follow-up questions
    suggestions.push(
      'Can you provide more details about this?',
      'What actions should we take based on this?',
      'How can we improve these metrics?'
    );

    // Return 3-4 relevant questions
    return suggestions.slice(0, 4);
  };

  const processQuery = async (query: string) => {
    try {
      // Include only relevant context from the last conversation
      const recentContext = messages
        .slice(-3) // Last 3 messages for context
        .filter(m => m.type === 'assistant' || m.content.trim() === query.trim()) // Only include assistant responses and the current query
        .map(m => ({
          role: m.type,
          content: m.content
        }));

      const response = await fetch('http://localhost:8001/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          context: recentContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process query');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await processQuery(input);
      
      const suggestedQuestions = generateSuggestedQuestions(response.message);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: {
          ...response.metadata,
          suggestedQuestions
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        metadata: {
          type: 'alert',
          suggestedQuestions: [
            'Try rephrasing your question',
            'Ask a different question',
            'Check system status'
          ]
        }
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.query);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const renderMessage = (message: Message) => {
    const isAssistant = message.type === 'assistant';
    const metadata = message.metadata;

    return (
      <ListItem
        key={message.id}
        sx={{
          flexDirection: 'column',
          alignItems: isAssistant ? 'flex-start' : 'flex-end',
          py: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          {isAssistant ? (
            <CopilotIcon sx={{ mr: 1, color: 'primary.main' }} />
          ) : (
            <UserIcon sx={{ ml: 1, color: 'secondary.main' }} />
          )}
          <Typography variant="caption" color="text.secondary">
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </Box>
        <Card
          sx={{
            maxWidth: '80%',
            bgcolor: isAssistant ? 'background.paper' : 'primary.main',
            color: isAssistant ? 'text.primary' : 'white'
          }}
        >
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            {metadata?.type && (
              <Box sx={{ mb: 1 }}>
                {metadata.type === 'insight' && <InsightIcon color="info" />}
                {metadata.type === 'alert' && <AlertIcon color="error" />}
                {metadata.type === 'suggestion' && <SuggestionIcon color="success" />}
              </Box>
            )}
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {message.content}
            </Typography>
            {metadata?.data && (
              <Box sx={{ mt: 2 }}>
                {/* Render additional data visualizations here based on metadata.data */}
              </Box>
            )}
            {isAssistant && metadata?.suggestedQuestions && (
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                <HelpIcon color="action" sx={{ mr: 1 }} />
                {metadata.suggestedQuestions.map((question, index) => (
                  <Chip
                    key={index}
                    label={question}
                    variant="outlined"
                    size="small"
                    onClick={() => handleSuggestedQuestion(question)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  />
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </ListItem>
    );
  };

  return (
    <Paper sx={{ 
      height: 'calc(100vh - 140px)',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <CopilotIcon sx={{ mr: 1 }} />
          Copilot
        </Typography>
      </Box>

      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant="outlined"
            size="small"
            onClick={() => handleQuickAction(action)}
            startIcon={
              action.id === 'missing-updates' ? <AlertIcon /> :
              action.id === 'productivity' ? <InsightIcon /> :
              action.id === 'blockers' ? <AlertIcon /> :
              <SuggestionIcon />
            }
          >
            {action.label}
          </Button>
        ))}
      </Box>

      <List sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
        bgcolor: 'grey.50'
      }}>
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </List>

      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Ask me anything about your team..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={loading}
            multiline
            maxRows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white'
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            sx={{ 
              alignSelf: 'flex-end',
              p: 1,
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled'
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
} 