import { useState } from "react"
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, TextField, RadioGroup, 
  FormControlLabel, Radio, Alert, CircularProgress, Stepper, Step, StepLabel, Card, CardContent,
} from "@mui/material"
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from "@mui/icons-material"
import { colors, shadows, borderRadius } from "../theme/themeConfig"
import { solicitudesService } from "../api"

const steps = ["Información", "Confirmación", "Resultado"]

const LoanRequestModal = ({ open, onClose, book, onSubmit }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loanType, setLoanType] = useState("fisico")
  const [duration, setDuration] = useState("15")
  const [purpose, setPurpose] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const handleNext = async () => {
    if (activeStep === steps.length - 2) {
      setLoading(true)
      setSubmitError(null)
      try {
        await solicitudesService.create({
          trabajo: book.id,
          tipo_solicitud: loanType,
          duracion_dias: parseInt(duration, 10),
          proposito: purpose || undefined,
        })
        setSubmitSuccess(true)
        onSubmit?.({
          bookId: book.id,
          loanType,
          duration,
          purpose,
        })
        setActiveStep(steps.length)
      } catch (error) {
        setSubmitSuccess(false)
        setSubmitError(error.message || "Hubo un error al procesar tu solicitud. Intenta de nuevo.")
        setActiveStep(steps.length)
      } finally {
        setLoading(false)
      }
    } else {
      setActiveStep(activeStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(activeStep - 1)
  }

  const handleClose = () => {
    setActiveStep(0)
    setLoanType("fisico")
    setDuration("15")
    setPurpose("")
    setSubmitSuccess(false)
    setSubmitError(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth aria-labelledby="loan-modal-title" PaperProps={{ sx: { borderRadius: borderRadius.lg, boxShadow: shadows.softHover, }, }} >
      <DialogTitle id="loan-modal-title" sx={{ fontWeight: 700, fontSize: "1.3rem", color: colors.text.primary, pb: 1, }} >
        Solicitar Préstamo
      </DialogTitle>

      <Box sx={{ px: 3, pt: 2 }}>
        <Stepper activeStep={activeStep}
          sx={{
            "& .MuiStepIcon-root": {
              color: colors.borders.light,
            },
            "& .MuiStepIcon-root.Mui-active": {
              color: colors.primary.main,
            },
            "& .MuiStepIcon-root.Mui-completed": {
              color: colors.status.success,
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        {activeStep === 0 && (
          <Box>
            <Card sx={{ mb: 3, bgcolor: colors.background.light, boxShadow: "none", }} >
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.text.primary, mb: 0.5, }} >
                  {book.titulo}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.secondary, }} >
                  {book.autores_texto || `${book.autores?.[0]?.nombre || ''} ${book.autores?.[0]?.apellido || ''}`.trim()}
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.text.primary, mb: 1.5, }} >
                Tipo de Préstamo
              </Typography>
              <RadioGroup value={loanType} onChange={(e) => setLoanType(e.target.value)}>
                <FormControlLabel value="fisico" control={<Radio />} label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary, }} >
                      Préstamo Físico
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text.secondary, }} >
                      Retira el libro en la biblioteca
                    </Typography>
                  </Box>
                } sx={{ mb: 2 }} />
                <FormControlLabel value="digital" control={<Radio />} label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary, }} >
                      Acceso Digital
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text.secondary, }} >
                      Descarga el documento PDF
                    </Typography>
                  </Box>
                } />
              </RadioGroup>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.text.primary, mb: 1.5, }} >
                Duración del Préstamo
              </Typography>
              <RadioGroup value={duration} onChange={(e) => setDuration(e.target.value)}>
                <FormControlLabel value="7" control={<Radio />} label="7 días" />
                <FormControlLabel value="15" control={<Radio />} label="15 días" />
                <FormControlLabel value="30" control={<Radio />} label="30 días" />
              </RadioGroup>
            </Box>

            <TextField fullWidth multiline rows={3} label="Propósito del Préstamo (opcional)" value={purpose} onChange={(e) => setPurpose(e.target.value)}
              placeholder="Ej: Trabajo de investigación, lectura personal..." sx={{ "& .MuiOutlinedInput-root": { borderRadius: borderRadius.md, }, }} />
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2, }} >
              Confirma los detalles de tu solicitud:
            </Typography>

            <Card sx={{ bgcolor: colors.background.light, boxShadow: "none", mb: 2, }} >
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: colors.text.tertiary, fontWeight: 600, }}>
                    DOCUMENTO
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text.primary, fontWeight: 500, }} >
                    {book.titulo}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: colors.text.tertiary, fontWeight: 600, }} >
                    TIPO DE PRÉSTAMO
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text.primary, fontWeight: 500, textTransform: "capitalize", }} >
                    {loanType === "fisico" ? "Préstamo Físico" : "Acceso Digital"}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: colors.text.tertiary, fontWeight: 600, }} >
                    DURACIÓN
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text.primary, fontWeight: 500, }} >
                    {duration} días
                  </Typography>
                </Box>

                {purpose && (
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.text.tertiary, fontWeight: 600, }} >
                      PROPÓSITO
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.primary, fontWeight: 500, }} >
                      {purpose}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ borderRadius: borderRadius.md }}>
              Tu solicitud será revisada y aprobada en las próximas 24 horas.
            </Alert>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: "center", py: 3 }}>
            {submitSuccess ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 64, color: colors.status.success, mb: 2, }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1, }} >
                  Solicitud Enviada
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2, }} >
                  Tu solicitud de préstamo ha sido enviada exitosamente. Recibirás una notificación cuando sea aprobada.
                </Typography>
              </>
            ) : (
              <>
                <ErrorIcon sx={{ color: colors.status.error, mb: 2, }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1, }} >
                  Error en la Solicitud
                </Typography>
                <Typography variant="body2" sx={{color: colors.text.secondary, }} >
                  {submitError || "Hubo un problema. Intenta de nuevo."}
                </Typography>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.borders.light}`, }} >
        {activeStep < steps.length - 1 ? (
          <>
            <Button onClick={handleBack} disabled={activeStep === 0} sx={{ color: colors.text.secondary, }} >
              Atrás
            </Button>
            <Button onClick={handleNext} disabled={loading} variant="contained" sx={{ bgcolor: colors.primary.main, color: "white", "&:hover": { bgcolor: colors.primary.dark, }, }} >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : activeStep === steps.length - 2 ? (
                "Enviar Solicitud"
              ) : (
                "Siguiente"
              )}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="contained" fullWidth sx={{ bgcolor: colors.primary.main, "&:hover": { bgcolor: colors.primary.dark, }, }} >
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default LoanRequestModal
