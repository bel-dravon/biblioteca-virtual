import { createTheme } from "@mui/material/styles"

export const colors = {
  primary: {
    main: "#5B86E5",
    light: "#82A5F8",
    dark: "#3A5FBF",
    lighter: "#EEF2FF",
  },
  secondary: {
    main: "#FDE047",
    light: "#FEF08A",
    dark: "#EAB308",
    lighter: "#FEFCE8",
  },
  background: {
    default: "#F3F6F9",
    paper: "#FFFFFF",
    light: "#F1F5F9",
  },
  text: {
    primary: "#2D3748",
    secondary: "#718096",
    tertiary: "#94A3B8",
  },
  borders: {
    light: "#E2E8F0",
  },
  status: {
    success: "#4ADE80",
    error: "#EF4444",
    warning: "#FBBF24",
    pending: "#3B82F6",
  },
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: "#1F2937",
    },
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
    success: {
      main: colors.status.success,
    },
    warning: {
      main: colors.status.warning,
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: "#1A202C",
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "0.5px",
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      borderRadius: 50,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: "8px 24px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(91, 134, 229, 0.2)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(45deg, #5B86E5 30%, #36D1DC 90%)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "none",
          boxShadow: "0 4px 20px -5px rgba(0, 0, 0, 0.05)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 12px 30px -10px rgba(91, 134, 229, 0.15)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          color: "#2D3748",
        },
      },
    },
  },
})

export default theme
