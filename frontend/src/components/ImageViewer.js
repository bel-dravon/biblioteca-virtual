import React, { useState, useEffect, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import {
    Box,
    Typography,
    IconButton,
    Slider,
    Button,
    Paper,
    Tooltip
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { API_URL } from '../api/config';

// Componente para cada página del flipbook
// react-pageflip requiere que cada "hoja" sea un componente con forwardRef
const Page = React.forwardRef(({ pagina, watermark, zoom }, ref) => {
    return (
        <div
            ref={ref}
            style={{
                background: '#fff',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                userSelect: 'none',
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <img
                src={pagina.imagen}
                alt={`Página ${pagina.numero}`}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    WebkitUserDrag: 'none',
                    display: 'block',
                }}
                draggable={false}
            />
            {/* Watermark */}
            <Typography
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-30deg)',
                    color: 'rgba(200,0,0,0.12)',
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: 4,
                }}
            >
                {watermark}
            </Typography>
            {/* Número de página */}
            <Typography
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'rgba(0,0,0,0.35)',
                    fontSize: '0.7rem',
                    pointerEvents: 'none',
                }}
            >
                {pagina.numero}
            </Typography>
        </div>
    );
});

Page.displayName = 'Page';

export default function ImageViewer({ pdfUrl, titulo, onClose, username, esPreview, trabajoId }) {
    const [paginas, setPaginas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [zoom, setZoom] = useState(100);
    const [currentPage, setCurrentPage] = useState(0);
    const [watermark] = useState(username || 'BiblioVirtual');
    const flipBookRef = useRef(null);

    // Pan (arrastrar) cuando hay zoom
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef(null);
    const panRef = useRef({ x: 0, y: 0 });

    // Resetear pan al cambiar zoom a 100
    useEffect(() => {
        if (zoom === 100) {
            setPan({ x: 0, y: 0 });
            panRef.current = { x: 0, y: 0 };
        }
    }, [zoom]);

    const handleMouseDown = (e) => {
        if (zoom <= 100) return;
        e.preventDefault();
        setIsDragging(true);
        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            panX: panRef.current.x,
            panY: panRef.current.y,
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !dragStart.current) return;
        const dx = e.clientX - dragStart.current.mouseX;
        const dy = e.clientY - dragStart.current.mouseY;
        const newPan = {
            x: dragStart.current.panX + dx,
            y: dragStart.current.panY + dy,
        };
        panRef.current = newPan;
        setPan({ ...newPan });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        dragStart.current = null;
    };

    // Touch support para móvil
    const handleTouchStart = (e) => {
        if (zoom <= 100 || e.touches.length !== 1) return;
        const touch = e.touches[0];
        dragStart.current = {
            mouseX: touch.clientX,
            mouseY: touch.clientY,
            panX: panRef.current.x,
            panY: panRef.current.y,
        };
    };

    const handleTouchMove = (e) => {
        if (!dragStart.current || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const dx = touch.clientX - dragStart.current.mouseX;
        const dy = touch.clientY - dragStart.current.mouseY;
        const newPan = {
            x: dragStart.current.panX + dx,
            y: dragStart.current.panY + dy,
        };
        panRef.current = newPan;
        setPan({ ...newPan });
    };

    const handleTouchEnd = () => {
        dragStart.current = null;
    };

    // Deshabilitar clic derecho globalmente en el visor
    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    // Cargar imágenes del PDF
    useEffect(() => {
        const cargarPaginas = async () => {
            if (!trabajoId) {
                setError('ID de trabajo no válido');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/documentos/${trabajoId}/paginas/`, {
                    headers: {
                        'Authorization': localStorage.getItem('authToken')
                            ? `Token ${localStorage.getItem('authToken')}`
                            : ''
                    }
                });

                if (!response.ok) throw new Error('Error al cargar el documento');

                const data = await response.json();
                setPaginas(data.paginas);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarPaginas();
    }, [trabajoId]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
    const handleZoomOut = () => {
        setZoom(prev => {
            const next = Math.max(prev - 25, 50);
            if (next === 100) {
                setPan({ x: 0, y: 0 });
                panRef.current = { x: 0, y: 0 };
            }
            return next;
        });
    };

    const handlePrevPage = () => {
        flipBookRef.current?.pageFlip()?.flipPrev();
    };

    const handleNextPage = () => {
        flipBookRef.current?.pageFlip()?.flipNext();
    };

    const handleFlip = (e) => {
        setCurrentPage(e.data);
    };

    // Dimensiones base del flipbook (una sola página visible)
    const PAGE_WIDTH = 560;
    const PAGE_HEIGHT = 780;

    if (loading) {
        return (
            <Box sx={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                bgcolor: 'rgba(0,0,0,0.9)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Typography color="white" variant="h6">Cargando documento...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                bgcolor: 'rgba(0,0,0,0.9)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
            }}>
                <Typography color="error" variant="h6">{error}</Typography>
                <Button variant="contained" onClick={onClose}>Cerrar</Button>
            </Box>
        );
    }

    return (
        <Box sx={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            bgcolor: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Paper sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                borderRadius: 0,
                bgcolor: '#1a1a1a'
            }}>
                <Typography variant="subtitle1" color="white" noWrap sx={{ maxWidth: '40%' }}>
                    {titulo}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Zoom */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title="Alejar">
                            <IconButton onClick={handleZoomOut} size="small" sx={{ color: 'white' }}>
                                <ZoomOutIcon />
                            </IconButton>
                        </Tooltip>
                        <Slider
                            value={zoom}
                            min={50}
                            max={200}
                            step={25}
                            onChange={(e, v) => setZoom(v)}
                            sx={{ width: 80, color: 'primary.main' }}
                        />
                        <Tooltip title="Acercar">
                            <IconButton onClick={handleZoomIn} size="small" sx={{ color: 'white' }}>
                                <ZoomInIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Navegación */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                            onClick={handlePrevPage}
                            disabled={currentPage === 0}
                            size="small"
                            sx={{ color: 'white' }}
                        >
                            <NavigateBeforeIcon />
                        </IconButton>
                        <Typography color="white" variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
                            {currentPage + 1} / {paginas.length}
                        </Typography>
                        <IconButton
                            onClick={handleNextPage}
                            disabled={currentPage === paginas.length - 1}
                            size="small"
                            sx={{ color: 'white' }}
                        >
                            <NavigateNextIcon />
                        </IconButton>
                    </Box>

                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Paper>

            {/* Visor con efecto libro */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: '#2a2a2a',
                    p: 2,
                    cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    userSelect: 'none',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <Box sx={{
                    transform: `scale(${zoom / 100}) translate(${pan.x / (zoom / 100)}px, ${pan.y / (zoom / 100)}px)`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.2s ease',
                }}>
                    {paginas.length > 0 && (
                        <HTMLFlipBook
                            ref={flipBookRef}
                            width={PAGE_WIDTH}
                            height={PAGE_HEIGHT}
                            size="fixed"
                            // Una sola página visible a la vez (no modo libro abierto)
                            showCover={false}
                            singlePage={true}
                            flippingTime={700}
                            usePortrait={true}
                            startPage={0}
                            drawShadow={true}
                            useMouseEvents={true}
                            swipeDistance={30}
                            onFlip={handleFlip}
                            style={{
                                boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
                            }}
                            className="flip-book"
                            // Deshabilitar clic derecho dentro del flipbook
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {paginas.map((pagina) => (
                                <Page
                                    key={pagina.numero}
                                    pagina={pagina}
                                    watermark={watermark}
                                    zoom={zoom}
                                />
                            ))}
                        </HTMLFlipBook>
                    )}
                </Box>
            </Box>
        </Box>
    );
}