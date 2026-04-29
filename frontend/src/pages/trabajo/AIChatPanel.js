import React, { useState, useRef, useEffect } from 'react';
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ReactMarkdown from 'react-markdown';
import { borderRadius, colors, shadows } from '../../theme/themeConfig';
import { trabajosService } from '../../api';

export default function AIChatPanel({ trabajoId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0 && !loading) {
      return;
    }

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    const question = inputValue.trim();
    if (!question || loading) return;

    const userMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await trabajosService.chatConIA(trabajoId, question);
      const aiMessage = { role: 'assistant', content: response.respuesta || 'No se obtuvo respuesta.' };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error en chat IA:', err);
      const errorMessage = { role: 'assistant', content: 'Error al conectar con la IA.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper
      sx={{
        mt: 3,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        border: `1px solid ${colors.borders.light}`,
        boxShadow: shadows.soft,
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <AutoAwesomeIcon sx={{ color: 'white' }} />
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" color="white" lineHeight={1.2}>
            Asistente IA
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.9)">
            Pregunta sobre el contenido
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          p: 2,
          bgcolor: colors.background.light,
          minHeight: { xs: '200px', md: '250px' },
          maxHeight: { xs: '300px', md: '400px' },
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Mensaje de bienvenida cuando no hay historial */}
        {messages.length === 0 && !loading && (
          <Box sx={{ display: 'flex', gap: 2, opacity: 0.8 }}>
            <Avatar sx={{ bgcolor: '#E0E7FF', color: '#6366F1', width: 32, height: 32 }}>
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <Paper
              sx={{
                p: 2,
                borderRadius: `4px ${borderRadius.md} ${borderRadius.md} ${borderRadius.md}`,
                bgcolor: 'white',
                maxWidth: '85%',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Hola. He analizado el documento. Que te gustaria saber?
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Historial de mensajes */}
        {messages.map((msg, index) => (
          msg.role === 'user' ? (
            <Box key={index} sx={{ display: 'flex', gap: 2, flexDirection: 'row-reverse' }}>
              <Avatar sx={{ bgcolor: '#3B82F6', width: 32, height: 32 }}>
                <PersonOutlineIcon fontSize="small" />
              </Avatar>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: `${borderRadius.md} 4px ${borderRadius.md} ${borderRadius.md}`,
                  bgcolor: '#3B82F6',
                  color: 'white',
                  maxWidth: '85%',
                }}
              >
                <Typography variant="body2">{msg.content}</Typography>
              </Paper>
            </Box>
          ) : (
            <Box key={index} sx={{ display: 'flex', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#8B5CF6', width: 32, height: 32 }}>
                <AutoAwesomeIcon fontSize="small" />
              </Avatar>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: `4px ${borderRadius.md} ${borderRadius.md} ${borderRadius.md}`,
                  bgcolor: 'white',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  maxWidth: '90%',
                  '& p': { m: 0, mb: 1, fontSize: '0.85rem', color: colors.text.primary },
                  '& strong': { color: '#6366F1', fontWeight: 600 },
                  '& ul, & ol': { pl: 2.5, mb: 1 },
                  '& li': { mb: 0.5, fontSize: '0.85rem' },
                }}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </Paper>
            </Box>
          )
        ))}

        {/* Indicador de carga */}
        {loading && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: '#E0E7FF', color: '#6366F1', width: 32, height: 32 }}>
              <CircularProgress size={18} color="inherit" />
            </Avatar>
            <Typography variant="caption" color="text.secondary" fontStyle="italic">
              Analizando documento...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Box
        sx={{
          p: 2,
          bgcolor: 'white',
          borderTop: `1px solid ${colors.borders.light}`,
          display: 'flex',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Escribe tu pregunta..."
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          disabled={loading}
          onKeyDown={handleKeyDown}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: borderRadius.md,
              bgcolor: colors.background.light,
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={loading || !inputValue.trim()}
          sx={{
            bgcolor: '#6366F1',
            color: 'white',
            borderRadius: borderRadius.md,
            '&:hover': { bgcolor: '#4F46E5' },
            '&:disabled': { bgcolor: colors.borders.light },
            width: 40,
            height: 40,
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}
