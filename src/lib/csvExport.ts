/**
 * CSV Export Utility
 * Export applications data to CSV format
 */

import type { Application } from './supabase';

export function exportToCSV(applications: Application[], filename?: string): void {
  // Create CSV header (all butiran pemohon + status/tarikh/sesi)
  const headers = [
    'No. Rujukan',
    'Nama',
    'E-mel',
    'Aset',
    'Status',
    'Tarikh Mohon',
    'Tarikh Penggunaan',
  ];

  // Convert applications to CSV rows
  const rows = applications.map(app => {
    const pemohon = typeof app.pemohon === 'string' ? JSON.parse(app.pemohon) : app.pemohon;
    const assets = Array.isArray(pemohon?.assets) ? pemohon.assets.join(', ') : '-';
    const tarikhPenggunaan = pemohon?.tarikhPenggunaan ? formatDate(pemohon.tarikhPenggunaan) : '-';
    
    return [
      app.ref_no,
      pemohon?.name || '-',
      pemohon?.email || '-',
      assets,
      normalizeStatus(app.status),
      formatDate(app.submitted_date),
      tarikhPenggunaan,
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Add BOM for Excel compatibility with UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || generateFilename());
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('ms-MY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function generateFilename(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return `permohonan_peralatan_ict_${dateStr}.csv`;
}

function getSession(approvedDate: string | null): string {
  if (!approvedDate) return '';
  try {
    const year = new Date(approvedDate).getFullYear();
    return `${year}/${year + 2}`;
  } catch {
    return '';
  }
}

function normalizeStatus(status: string): string {
  // Return status as-is
  return status;
}

export function exportWithDateRange(
  applications: Application[],
  dateFrom: Date,
  dateTo: Date
): void {
  // Filter applications by date range
  const filtered = applications.filter(app => {
    const submittedDate = new Date(app.submitted_date);
    if (!(submittedDate >= dateFrom && submittedDate <= dateTo)) return false;
    // Exclude not-complete statuses
    const status = normalizeStatus(app.status);
    if (status === 'Tidak Lengkap') return false;
    return true;
  });

  // Generate filename with date range
  const fromStr = formatDate(dateFrom).replace(/\//g, '-');
  const toStr = formatDate(dateTo).replace(/\//g, '-');
  const filename = `permohonan_peralatan_ict_${fromStr}_${toStr}.csv`;

  exportToCSV(filtered, filename);
}

// Example usage:
// exportToCSV(applications);
// exportWithDateRange(applications, new Date('2025-01-01'), new Date('2025-01-31'));
