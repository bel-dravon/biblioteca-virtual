import { Card, Box, Typography } from "@mui/material"
import { colors, shadows } from "../theme/themeConfig"

const StatCard = ({ title, value, icon: IconComponent, color = "primary", trend }) => {
  const colorMap = {
    primary: colors.primary.main,
    secondary: colors.secondary.main,
    success: colors.status.success,
    warning: colors.status.warning,
  }

  return (
    <Card aria-label={`${title}: ${value}`} sx={{ p: 2.5, border: "none", boxShadow: shadows.soft, transition: "all 0.3s ease", "&:hover": {
      transform: "translateY(-4px)", boxShadow: shadows.softHover, }, bgcolor: colors.background.paper, 
    }} >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="body2" sx={{ color: colors.text.secondary, fontWeight: 500, mb: 1, }} >
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, }} >
            {value}
          </Typography>
          {trend && (
            <Typography variant="caption" sx={{ color: trend > 0 ? colors.status.success : colors.status.error, fontWeight: 600, mt: 0.5, }} >
              {trend > 0 ? "+" : ""}
              {trend}% vs mes anterior
            </Typography>
          )}
        </Box>
        {IconComponent && (
          <Box sx={{ width: 50, height: 50, borderRadius: "12px",
              bgcolor: `${colorMap[color]}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconComponent
              sx={{
                color: colorMap[color],
                fontSize: 24,
              }}
            />
          </Box>
        )}
      </Box>
    </Card>
  )
}

export default StatCard
