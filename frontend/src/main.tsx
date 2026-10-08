import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import './index.css'
import App from './App.tsx'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#5e7cff', light: '#7ce1ff', dark: '#435ed6' },
    secondary: { main: '#a875ff' },
    background: { default: '#09111f', paper: '#0c1628' },
    text: { primary: '#e5edf9', secondary: '#a9bfed' },
    success: { main: '#70cf9b' },
    warning: { main: '#ffc469' },
    error: { main: '#ff7272' },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { letterSpacing: '-0.035em', fontWeight: 700 },
    h5: { letterSpacing: '-0.025em', fontWeight: 700 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          color: '#e5edf9',
          backgroundColor: 'rgba(6, 12, 22, 0.84)',
          borderBottom: '1px solid rgba(139, 164, 255, 0.14)',
          backdropFilter: 'blur(18px)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(6, 12, 22, 0.72)' },
        indicator: {
          height: 3,
          borderRadius: 3,
          background: 'linear-gradient(90deg, #5e7cff, #73d0ff)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#9bb6ef',
          '&.Mui-selected': { color: '#e5edf9' },
          '&:hover': { color: '#ffffff', backgroundColor: 'rgba(94, 124, 255, 0.08)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          color: '#e5edf9',
          backgroundColor: 'rgba(10, 18, 31, 0.78)',
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          backdropFilter: 'blur(16px)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          color: '#e5edf9',
          backgroundColor: 'rgba(12, 21, 35, 0.84)',
          backgroundImage: 'none',
          borderColor: 'rgba(255, 255, 255, 0.07)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 14,
          '&.MuiButton-containedPrimary': {
            color: '#081724',
            background: 'linear-gradient(135deg, #5e7cff, #7ce1ff)',
            boxShadow: '0 10px 24px rgba(94, 124, 255, 0.24)',
            '&:hover': {
              background: 'linear-gradient(135deg, #718cff, #91e7ff)',
              boxShadow: '0 12px 28px rgba(94, 124, 255, 0.34)',
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: '#edf4ff',
          backgroundColor: 'rgba(8, 14, 24, 0.72)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148, 168, 255, 0.22)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148, 168, 255, 0.48)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#7c98ff',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { color: '#e8f0ff', borderBottomColor: 'rgba(148, 168, 255, 0.12)' },
        head: {
          color: '#a9bfed',
          fontWeight: 700,
          backgroundColor: 'rgba(7, 13, 22, 0.72)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontSize: '0.75rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0c1628',
          border: '1px solid rgba(139, 164, 255, 0.18)',
        },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
