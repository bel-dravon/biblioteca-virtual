import { useState, useEffect, useCallback } from "react"
import {
  Box, FormControl, Select, MenuItem, TextField, Button,
  InputLabel, Chip, Collapse, useMediaQuery, useTheme,
  Paper, Typography, Badge
} from "@mui/material"
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from "@mui/icons-material"
import { colors, borderRadius, shadows } from "../theme/themeConfig"
import { useDebounce } from "../hooks"

const FilterBar = ({ onFiltersChange }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    year: "",
    autor: "",
    palabraClave: "",
  })

  const debouncedSearch = useDebounce(searchText, 300)

  // Sincronizar el valor debounced con los filtros
  useEffect(() => {
    const newFilters = { ...filters, search: debouncedSearch }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const activeFiltersCount = Object.values(filters).filter(v => v !== "").length

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      onFiltersChange?.(newFilters)
      return newFilters
    })
  }, [onFiltersChange])

  const clearFilters = useCallback(() => {
    const emptyFilters = {
      search: "",
      type: "",
      year: "",
      autor: "",
      palabraClave: "",
    }
    setSearchText("")
    setFilters(emptyFilters)
    onFiltersChange?.(emptyFilters)
  }, [onFiltersChange])

  // Estilos Soft UI consistentes
  const softInputStyle = {
    bgcolor: colors.background.light,
    borderRadius: borderRadius.md,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: colors.primary.light,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: colors.primary.main,
      borderWidth: '1.5px',
    },
    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.8)',
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: colors.background.paper,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.soft,
        border: `1px solid ${colors.borders.light}`,
      }}
    >
      {/* Barra de búsqueda principal */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
      }}>
        <TextField
          placeholder="Buscar por título..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="small"
          fullWidth
          aria-label="Buscar por titulo"
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: colors.text.tertiary }} />,
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': softInputStyle,
          }}
        />

        {/* Filtros rápidos en desktop */}
        {!isMobile && (
          <>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                displayEmpty
                aria-label="Tipo de material"
                sx={softInputStyle}
              >
                <MenuItem value="">Todos los tipos</MenuItem>
                <MenuItem value="tesis">Tesis</MenuItem>
                <MenuItem value="proyecto_grado">Proyecto de Grado</MenuItem>
                <MenuItem value="trabajo_dirigido">Trabajo Dirigido</MenuItem>
                <MenuItem value="monografia">Monografía</MenuItem>
                <MenuItem value="libro">Libro</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={filters.year}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                displayEmpty
                aria-label="Año de publicacion"
                sx={softInputStyle}
              >
                <MenuItem value="">Cualquier año</MenuItem>
                {years.map(year => (
                  <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        {/* Botón filtros avanzados */}
        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowAdvanced(!showAdvanced)}
          startIcon={
            <Badge badgeContent={activeFiltersCount} color="primary" max={9}>
              <FilterIcon />
            </Badge>
          }
          endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            borderColor: showAdvanced ? colors.primary.main : colors.borders.light,
            color: showAdvanced ? colors.primary.main : colors.text.secondary,
            bgcolor: showAdvanced ? colors.primary.lighter : 'transparent',
            minWidth: { xs: '100%', sm: 'auto' },
            '&:hover': {
              borderColor: colors.primary.main,
              bgcolor: colors.primary.lighter,
            },
          }}
        >
          {isSmall ? 'Filtros' : 'Más filtros'}
        </Button>
      </Box>

      {/* Panel de filtros avanzados */}
      <Collapse in={showAdvanced}>
        <Box sx={{
          mt: 3,
          pt: 3,
          borderTop: `1px dashed ${colors.borders.light}`,
        }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
            Filtros avanzados
          </Typography>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 2,
          }}>
            {/* Tipo (solo en mobile, ya que en desktop está arriba) */}
            {isMobile && (
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ bgcolor: colors.background.paper, px: 0.5 }}>Tipo</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  label="Tipo"
                  sx={softInputStyle}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="tesis">Tesis</MenuItem>
                  <MenuItem value="proyecto_grado">Proyecto de Grado</MenuItem>
                  <MenuItem value="trabajo_dirigido">Trabajo Dirigido</MenuItem>
                  <MenuItem value="monografia">Monografía</MenuItem>
                  <MenuItem value="libro">Libro</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Año (solo en mobile) */}
            {isMobile && (
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ bgcolor: colors.background.paper, px: 0.5 }}>Año</InputLabel>
                <Select
                  value={filters.year}
                  onChange={(e) => handleFilterChange("year", e.target.value)}
                  label="Año"
                  sx={softInputStyle}
                >
                  <MenuItem value="">Cualquier año</MenuItem>
                  {years.map(year => (
                    <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Autor */}
            <TextField
              size="small"
              fullWidth
              label="Autor"
              placeholder="Nombre o apellido..."
              value={filters.autor}
              onChange={(e) => handleFilterChange("autor", e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': softInputStyle }}
            />

            {/* Palabra clave */}
            <TextField
              size="small"
              fullWidth
              label="Palabra clave"
              placeholder="Tema o descriptor..."
              value={filters.palabraClave}
              onChange={(e) => handleFilterChange("palabraClave", e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': softInputStyle }}
            />

          </Box>

          {/* Filtros activos y botón limpiar */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 3,
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filters.search && (
                <Chip
                  label={`Título: "${filters.search}"`}
                  size="small"
                  onDelete={() => { setSearchText(""); handleFilterChange("search", ""); }}
                  sx={{ bgcolor: colors.primary.lighter, color: colors.primary.dark }}
                />
              )}
              {filters.type && (
                <Chip
                  label={`Tipo: ${filters.type}`}
                  size="small"
                  onDelete={() => handleFilterChange("type", "")}
                  sx={{ bgcolor: colors.primary.lighter, color: colors.primary.dark }}
                />
              )}
              {filters.year && (
                <Chip
                  label={`Año: ${filters.year}`}
                  size="small"
                  onDelete={() => handleFilterChange("year", "")}
                  sx={{ bgcolor: colors.primary.lighter, color: colors.primary.dark }}
                />
              )}
              {filters.autor && (
                <Chip
                  label={`Autor: ${filters.autor}`}
                  size="small"
                  onDelete={() => handleFilterChange("autor", "")}
                  sx={{ bgcolor: colors.primary.lighter, color: colors.primary.dark }}
                />
              )}
              {filters.palabraClave && (
                <Chip
                  label={`Tema: ${filters.palabraClave}`}
                  size="small"
                  onDelete={() => handleFilterChange("palabraClave", "")}
                  sx={{ bgcolor: colors.primary.lighter, color: colors.primary.dark }}
                />
              )}
            </Box>

            {activeFiltersCount > 0 && (
              <Button
                variant="text"
                size="small"
                startIcon={<CloseIcon />}
                onClick={clearFilters}
                sx={{
                  color: colors.text.secondary,
                  '&:hover': { color: colors.status.error }
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default FilterBar
