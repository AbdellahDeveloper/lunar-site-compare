import React, { useRef, useEffect, useState } from 'react';
import { Site } from '../types';
import { Button } from '@/components/ui';

interface MapPicker2DProps {
  selectedSiteId: string;
  currentLat: number;
  currentLon: number;
  onSelectSite: (site: Site) => void;
  onSelectCoordinates: (lat: number, lon: number, name: string) => void;
  sites: Site[];
}

export const MapPicker2D: React.FC<MapPicker2DProps> = ({
  selectedSiteId,
  currentLat,
  currentLon,
  onSelectSite,
  onSelectCoordinates,
  sites,
}) => {
  const [projection, setProjection] = useState<'polar' | 'global'>('polar');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (projection === 'polar') {
      // --- SOUTH POLAR STEREOGRAPHIC PROJECTION (80°S to 90°S) ---
      const cx = width / 2;
      const cy = height / 2;
      const maxR = cx - 35; // outer circle corresponds to -80° latitude

      // Background
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, width, height);

      // Outer bounding circle (80°S)
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fillStyle = '#141c2e';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Convert (lat, lon) to canvas (x, y)
      // lat: -90 (center) to -80 (maxR)
      const latLonToPolarXY = (lat: number, lon: number) => {
        const clampedLat = Math.max(-90, Math.min(-80, lat));
        const r = ((clampedLat - (-90)) / 10) * maxR;
        const rad = (lon * Math.PI) / 180;
        return {
          x: cx + r * Math.sin(rad),
          y: cy - r * Math.cos(rad),
        };
      };

      // Latitude Rings: -82°, -84°, -86°, -88°
      const latGrid = [-82, -84, -86, -88];
      for (const lat of latGrid) {
        const r = ((lat - (-90)) / 10) * maxR;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.setLineDash([3, 4]);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`${lat}°S`, cx + 4, cy - r - 2);
      }
      ctx.setLineDash([]);

      // Longitude Meridians
      for (let deg = 0; deg < 360; deg += 45) {
        const rad = (deg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.sin(rad), cy - maxR * Math.cos(rad));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        // Label on perimeter
        const lx = cx + (maxR + 14) * Math.sin(rad);
        const ly = cy - (maxR + 14) * Math.cos(rad);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${deg}°`, lx, ly);
      }

      // Draw Key South Pole Craters & PSRs
      const polarFeatures = [
        { name: 'Shackleton', lat: -89.78, lon: 129.5, rKm: 21, isPsr: true },
        { name: 'Haworth', lat: -87.4, lon: -5.1, rKm: 51, isPsr: true },
        { name: 'Shoemaker', lat: -88.1, lon: 45.0, rKm: 50, isPsr: true },
        { name: 'Faustini', lat: -87.3, lon: 77.0, rKm: 39, isPsr: true },
        { name: 'de Gerlache', lat: -88.5, lon: -88.0, rKm: 32, isPsr: true },
        { name: 'Nobile', lat: -85.2, lon: 35.8, rKm: 73, isPsr: false },
        { name: 'Cabeus', lat: -84.9, lon: -35.5, rKm: 98, isPsr: true },
        { name: 'Malapert', lat: -84.9, lon: 12.9, rKm: 69, isPsr: false },
        { name: 'Amundsen', lat: -84.5, lon: 82.8, rKm: 101, isPsr: false },
      ];

      for (const feat of polarFeatures) {
        const pos = latLonToPolarXY(feat.lat, feat.lon);
        // Scale crater radius in pixels (approx 10 degrees lat = ~303 km)
        const radiusPx = Math.max(6, (feat.rKm / 303) * maxR);

        // Draw crater floor
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radiusPx, 0, Math.PI * 2);

        if (feat.isPsr) {
          // Permanently Shadowed Region (Deep Violet / Ice Blue)
          ctx.fillStyle = 'rgba(76, 29, 149, 0.65)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = feat.isPsr ? '#c4b5fd' : '#cbd5e1';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(feat.name, pos.x, pos.y + radiusPx + 9);
      }

      // Draw Site Pins from Catalog
      for (const site of sites) {
        if (site.lat < -80) {
          const pos = latLonToPolarXY(site.lat, site.lon);
          const isSelected = site.id === selectedSiteId;

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, isSelected ? 6.5 : 4.5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#ef4444' : '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          if (isSelected) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      // Draw Selected Coordinates Pin
      if (currentLat < -80) {
        const curPos = latLonToPolarXY(currentLat, currentLon);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(curPos.x, curPos.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // South Pole Center Marker
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillText('South Pole (90°S)', cx, cy - 8);
    } else {
      // --- GLOBAL EQUIRECTANGULAR PROJECTION (-90° to +90°, -180° to +180°) ---
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, width, height);

      // Map rectangle
      const mx = 30;
      const my = 25;
      const mw = width - 60;
      const mh = height - 50;

      ctx.fillStyle = '#161f33';
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mx, my, mw, mh);

      const latLonToGlobalXY = (lat: number, lon: number) => {
        const x = mx + ((lon + 180) / 360) * mw;
        const y = my + ((90 - lat) / 180) * mh;
        return { x, y };
      };

      // Latitude lines
      for (const lat of [-60, -30, 0, 30, 60]) {
        const y = my + ((90 - lat) / 180) * mh;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(mx, y);
        ctx.lineTo(mx + mw, y);
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`${lat}°`, mx - 24, y + 3);
      }

      // Longitude lines
      for (const lon of [-120, -60, 0, 60, 120]) {
        const x = mx + ((lon + 180) / 360) * mw;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(x, my);
        ctx.lineTo(x, my + mh);
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${lon}°`, x, my + mh + 14);
      }

      // South Pole target strip highlight (80°S to 90°S)
      const spY = my + ((90 - (-80)) / 180) * mh;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fillRect(mx, spY, mw, my + mh - spY);

      // Maria blobs (near side, -90 to +90 lon)
      ctx.fillStyle = '#1e293b';
      const maria = [
        { lat: 0, lon: 23, r: 24, name: 'Tranquillitatis' },
        { lat: 28, lon: 17, r: 22, name: 'Serenitatis' },
        { lat: 35, lon: -17, r: 28, name: 'Imbrium' },
        { lat: 18, lon: -57, r: 32, name: 'Oceanus Procellarum' },
        { lat: 17, lon: 59, r: 16, name: 'Crisium' },
        { lat: -53, lon: 169, r: 35, name: 'SPA Basin' },
      ];
      for (const m of maria) {
        const pos = latLonToGlobalXY(m.lat, m.lon);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw All Site Pins
      for (const site of sites) {
        const pos = latLonToGlobalXY(site.lat, site.lon);
        const isSelected = site.id === selectedSiteId;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#ef4444' : '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(site.name.split(' ')[0], pos.x, pos.y - 7);
      }

      // Current Location Pin
      const curPos = latLonToGlobalXY(currentLat, currentLon);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(curPos.x, curPos.y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }, [projection, selectedSiteId, currentLat, currentLon, sites]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;

    if (projection === 'polar') {
      const cx = width / 2;
      const cy = height / 2;
      const maxR = cx - 35;

      const dx = x - cx;
      const dy = cy - y; // North is up
      const r = Math.hypot(dx, dy);

      if (r <= maxR) {
        // Calculate latitude (-90 to -80)
        const lat = -90 + (r / maxR) * 10;
        // Calculate longitude (degrees)
        let lon = (Math.atan2(dx, dy) * 180) / Math.PI;
        if (lon > 180) lon -= 360;

        onSelectCoordinates(
          Number(lat.toFixed(2)),
          Number(lon.toFixed(2)),
          `Custom Polar (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`
        );
      }
    } else {
      const mx = 30;
      const my = 25;
      const mw = width - 60;
      const mh = height - 50;

      if (x >= mx && x <= mx + mw && y >= my && y <= my + mh) {
        const lon = -180 + ((x - mx) / mw) * 360;
        const lat = 90 - ((y - my) / mh) * 180;

        onSelectCoordinates(
          Number(lat.toFixed(2)),
          Number(lon.toFixed(2)),
          `Custom Site (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`
        );
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-slate-300">
            Interactive Landing Map
          </span>
          <span className="text-xs text-slate-400">Click anywhere to place lander</span>
        </div>
        <div className="flex items-center gap-1 bg-space-850 p-0.5 rounded-lg border border-slate-700">
          <Button
            variant={projection === 'polar' ? 'nasa' : 'ghost'}
            size="xs"
            onClick={() => setProjection('polar')}
          >
            South Pole (80°S-90°S)
          </Button>
          <Button
            variant={projection === 'global' ? 'nasa' : 'ghost'}
            size="xs"
            onClick={() => setProjection('global')}
          >
            Global Equirectangular
          </Button>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] max-h-[380px] rounded-xl overflow-hidden border border-slate-700/60 bg-space-950 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={520}
          height={380}
          onClick={handleCanvasClick}
          className="w-full h-full block cursor-crosshair"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" />
            <span className="text-slate-300">Permanently Shadowed Regions (PSRs)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-300">Candidate Sites</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span className="text-slate-300">Active Landing Pin</span>
          </span>
        </div>
        <div className="text-cyan-300">
          Current: {currentLat.toFixed(2)}°, {currentLon.toFixed(2)}°
        </div>
      </div>
    </div>
  );
};

