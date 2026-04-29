import { Snackbar, Alert, Box, Typography, Button } from "@mui/material"
import { colors } from "../theme/themeConfig"

const LoanStatusNotification = ({ open, onClose, status = "success", message, action }) => {
  const statusConfig = {
    success: {
      severity: "success",
      title: "Solicitud Enviada",
      message: "Tu solicitud de préstamo ha sido registrada correctamente.",
    },
    pending: {
      severity: "info",
      title: "En Espera",
      message: "Tu solicitud está siendo revisada por el administrador.",
    },
    approved: {
      severity: "success",
      title: "Solicitud Aprobada",
      message: "Tu préstamo ha sido aprobado. Puedes descargar el documento.",
    },
    rejected: {
      severity: "error",
      title: "Solicitud Rechazada",
      message: "Tu solicitud fue rechazada. Contacta al administrador para más información.",
    },
  }

  const config = statusConfig[status] || statusConfig.success

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={onClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} >
      <Alert onClose={onClose} severity={config.severity} role="alert" sx={{ borderRadius: "12px", backgroundColor: status === "success" ? colors.status.success : status === "rejected" ? colors.status.error : colors.status.pending, color: "white", "& .MuiAlert-icon": { color: "white", }, }} >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "white", }} >
            {message || config.message}
          </Typography>
          {action && (
            <Button size="small" sx={{ color: "white", fontWeight: 600, mt: 1, }} onClick={action.onClick} >
              {action.label}
            </Button>
          )}
        </Box>
      </Alert>
    </Snackbar>
  )
}

export default LoanStatusNotification
