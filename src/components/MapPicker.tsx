"use client";

import React, { useEffect, useRef } from 'react';
import { geocodeAddress, reverseGeocode, extractDaerahMukim } from '@/lib/geo';

export interface MapPickerProps {
  address: string;
  lat?: number | null;
  lon?: number | null;
  onLocationChange: (loc: { lat: number; lon: number; address?: string; daerah?: string; mukim?: string }) => void;
  invalid?: boolean; // when true, show warning popup and red border
}

// Lightweight Leaflet loader via CDN to avoid adding package dependency
function ensureLeafletLoaded(): Promise<typeof window & { L: any } > {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    const w = window as any;
    if (w.L) return resolve(w);

    // Inject CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // Inject JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window as any);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export const MapPicker: React.FC<MapPickerProps> = ({ address, lat, lon, onLocationChange, invalid }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const popupRef = useRef<any>(null);
  const lastAddressRef = useRef<string>(address);
  const debounceRef = useRef<number | null>(null);

  // Init map once
  useEffect(() => {
    let destroyed = false;
    (async () => {
      try {
        const w = await ensureLeafletLoaded();
        if (destroyed || !containerRef.current) return;
        const L = (w as any).L;
        mapRef.current = L.map(containerRef.current).setView([lat ?? 3.5547, lon ?? 101.6463], lat && lon ? 15 : 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);

        // Add marker if lat/lon present
        const initialLat = lat ?? 3.5547;
        const initialLon = lon ?? 101.6463;
        markerRef.current = L.marker([initialLat, initialLon], { draggable: true }).addTo(mapRef.current);

        markerRef.current.on('dragend', async () => {
          const pos = markerRef.current.getLatLng();
          const rev = await reverseGeocode({ lat: pos.lat, lon: pos.lng });
          const em = extractDaerahMukim(rev?.address);
          onLocationChange({ lat: pos.lat, lon: pos.lng, address: rev?.display_name, daerah: em.daerah, mukim: em.mukim });
        });

        // If we have an address, attempt geocode initially
        if (address && address.trim().length > 3) {
          const g = await geocodeAddress(address);
          if (g && mapRef.current && markerRef.current) {
            markerRef.current.setLatLng([g.lat, g.lon]);
            mapRef.current.setView([g.lat, g.lon], 16);
            const em = extractDaerahMukim(g.address);
            onLocationChange({ lat: g.lat, lon: g.lon, address: g.display_name, daerah: em.daerah, mukim: em.mukim });
          }
        }
      } catch (e) {
        console.error('Map init failed', e);
      }
    })();
    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to address changes (debounced)
  useEffect(() => {
    if (address === lastAddressRef.current) return;
    lastAddressRef.current = address;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      if (!address || address.trim().length < 3) return;
      const g = await geocodeAddress(address);
      if (g && mapRef.current && markerRef.current) {
        markerRef.current.setLatLng([g.lat, g.lon]);
        mapRef.current.setView([g.lat, g.lon], 16);
        const em = extractDaerahMukim(g.address);
        onLocationChange({ lat: g.lat, lon: g.lon, address: g.display_name, daerah: em.daerah, mukim: em.mukim });
      }
    }, 600);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [address, onLocationChange]);

  // React to external lat/lon changes
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || lat == null || lon == null) return;
    markerRef.current.setLatLng([lat, lon]);
    // do not auto-zoom to avoid fighting the user
  }, [lat, lon]);

  // Watch invalid flag to show/hide popup
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const w: any = window as any;
    const L = (w && (w as any).L) ? (w as any).L : null;
    if (!L) return;
    if (invalid) {
      const content = `<div style="background:#FEE2E2;color:#991B1B;border:1px solid #EF4444;border-radius:8px;padding:8px 10px;max-width:240px;">
        <strong>Lokasi di luar kawasan Hulu Selangor.</strong>
      </div>`;
      if (popupRef.current) {
        popupRef.current.setContent(content);
        popupRef.current.setLatLng(markerRef.current.getLatLng()).openOn(mapRef.current);
      } else {
        popupRef.current = L.popup({ closeButton: true, autoPan: true })
          .setLatLng(markerRef.current.getLatLng())
          .setContent(content)
          .openOn(mapRef.current);
      }
    } else {
      if (popupRef.current) {
        mapRef.current.closePopup(popupRef.current);
      }
    }
  }, [invalid]);

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-2">Peta interaktif: seret pin atau ubah alamat untuk selaraskan lokasi.</div>
      <div
        ref={containerRef}
        style={{
          height: 320,
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          border: invalid ? '2px solid #EF4444' : '1px solid hsl(var(--border))'
        }}
      />
    </div>
  );
};

export default MapPicker;
