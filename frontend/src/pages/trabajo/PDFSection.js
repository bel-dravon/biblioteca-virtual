import React from 'react';
import { Box, Collapse } from '@mui/material';
import ProtectedPDFViewer from '../../components/ProtectedPDFViewer';

export default function PDFSection({
  verPdf,
  pdfUrl,
  title,
  username,
  onClose,
}) {
  return (
    <Collapse in={verPdf}>
      <Box sx={{ mb: 3 }}>
        <ProtectedPDFViewer
          pdfUrl={pdfUrl}
          title={title}
          onClose={onClose}
          watermarkText={username || ''}
        />
      </Box>
    </Collapse>
  );
}
