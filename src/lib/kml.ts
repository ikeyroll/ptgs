import type { Application } from './supabase';

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateKML(apps: Application[]): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n  <name>PTGS Applications</name>`;
  const footer = `\n</Document>\n</kml>`;

  // Group by daerah -> mukim
  const byDaerah = new Map<string, Application[]>();
  for (const app of apps) {
    if (app.latitude == null || app.longitude == null) continue;
    const key = (app.daerah || 'Tidak Ditetapkan') + '|' + (app.mukim || 'Tidak Ditetapkan');
    const list = byDaerah.get(key) || [];
    list.push(app);
    byDaerah.set(key, list);
  }

  let body = '';
  for (const [key, list] of byDaerah.entries()) {
    const [daerah, mukim] = key.split('|');
    const folderName = `${daerah} - ${mukim}`;
    body += `\n  <Folder>\n    <name>${escapeXml(folderName)}</name>`;
    for (const app of list) {
      const pemohon = typeof app.pemohon === 'string' ? JSON.parse(app.pemohon as unknown as string) : app.pemohon;
      const title = `${app.ref_no} - ${pemohon?.name || ''}`;
      const desc = `Jenis: ${app.application_type}\nIC: ${pemohon?.ic || ''}\nAlamat: ${pemohon?.address || ''}`;
      body += `\n    <Placemark>\n      <name>${escapeXml(title)}</name>\n      <description>${escapeXml(desc)}</description>\n      <Point>\n        <coordinates>${app.longitude},${app.latitude},0</coordinates>\n      </Point>\n    </Placemark>`;
    }
    body += `\n  </Folder>`;
  }

  return header + body + footer;
}
