import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtectedPDFViewer from '../ProtectedPDFViewer';

// Mock themeConfig
jest.mock('../../theme/themeConfig', () => ({
  colors: {
    background: { paper: '#fff', light: '#f5f5f5' },
    text: { primary: '#000', secondary: '#666', tertiary: '#999' },
    primary: { main: '#1976d2' },
    borders: { light: '#e0e0e0' },
    status: {},
  },
  shadows: { soft: 'none' },
  borderRadius: { sm: '4px', md: '8px', lg: '12px' },
}));

jest.mock('../../api', () => ({
  API_URL: 'http://localhost:8000',
}));

describe('ProtectedPDFViewer', () => {
  test('renders viewer when url is provided', () => {
    render(<ProtectedPDFViewer pdfUrl="http://example.com/test.pdf" title="Test PDF" />);

    // Should render the iframe with the PDF
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('title', 'Test PDF');
  });

  test('has accessible aria-labels on buttons', () => {
    render(
      <ProtectedPDFViewer
        pdfUrl="http://example.com/test.pdf"
        title="Test PDF"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Reducir zoom')).toBeInTheDocument();
    expect(screen.getByLabelText('Ampliar zoom')).toBeInTheDocument();
    expect(screen.getByLabelText('Pantalla completa')).toBeInTheDocument();
    expect(screen.getByLabelText('Cerrar visor')).toBeInTheDocument();
  });

  test('has document role on viewer container', () => {
    render(<ProtectedPDFViewer pdfUrl="http://example.com/test.pdf" title="Test PDF" />);

    const docContainer = screen.getByRole('document');
    expect(docContainer).toBeInTheDocument();
    expect(docContainer).toHaveAttribute('aria-label', 'Visor de documento PDF');
  });

  test('shows alert when no pdfUrl is provided', () => {
    render(<ProtectedPDFViewer title="Test PDF" />);

    expect(screen.getByText('No hay documento PDF disponible')).toBeInTheDocument();
  });
});
