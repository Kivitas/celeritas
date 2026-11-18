/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo, useRef, useState } from "react";
import { DetectorSettings, SimulationParams, SimulationSummary } from "../types";
import { buildLabModel, project, type RayFate } from "../core/lab";

interface LabTabProps {
  params: SimulationParams;
  detector: DetectorSettings;
  summary: SimulationSummary;
  isDarkMode: boolean;
}

const FATE_COLOUR: Record<RayFate, string> = {
  detector: "#22d3ee",
  side: "#f59e0b",
  upstream: "#a3e635",
  trapped: "#c084fc",
};
const FATE_LABEL: Record<RayFate, string> = {
  detector: "leaves downstream face (detector)",
  side: "leaves a side face",
  upstream: "leaves upstream face",
  trapped: "trapped (total internal reflection)",
};

const RAYS = 150;
const SEED = 2024;

// Geometric-optics model of the radiator block (src/core/lab.ts). Rays are drawn from the same
// quantities the analytic engine uses (mean angle, refractive index, emission length), with seeded
// random emission points and azimuths. Drag to rotate, scroll to zoom.
export default function LabTab({ params, detector, summary, isDarkMode }: LabTabProps) {
  const [yaw, setYaw] = useState(-0.7);
  const [pitch, setPitch] = useState(0.45);
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; y: number } | null>(null);

  // Reference-wavelength index, recovered from the threshold beta = 1/n
  const n = 1 / summary.betaThreshold;
  const T = params.radiatorThicknessMm;
  const emission = Math.min(params.trackLengthMm, T);
  const model = useMemo(
    () => buildLabModel(summary.cherenkovAngleDeg, n, T, emission, summary.isCherenkovGenerated, RAYS, SEED),
    [summary.cherenkovAngleDeg, n, T, emission, summary.isCherenkovGenerated]
  );

  const W = 720;
  const H = 440;
  const h = model.halfWidthMm;
  const pad = Math.max(T * 0.35, 8);
  const extent = Math.max(T / 2 + pad, h) * 1.15;
  const scale = (Math.min(W, H) / 2 / extent) * zoom;
  const centre = (p: [number, number, number]): [number, number, number] => [p[0], p[1], p[2] - T / 2];
  const proj = (p: [number, number, number]) => {
    const q = project(centre(p), yaw, pitch);
    return { x: W / 2 + q.x * scale, y: H / 2 - q.y * scale, depth: q.depth };
  };

  const stroke = isDarkMode ? "#94a3b8" : "#475569";
  const label = isDarkMode ? "#cbd5e1" : "#334155";

  const corners: [number, number, number][] = [];
  for (const z of [0, T]) for (const y of [-h, h]) for (const x of [-h, h]) corners.push([x, y, z]);
  // index = z*4 + y*2 + x (each 0/1)
  const edges: [number, number][] = [
    [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const quad = (idx: number[]) => idx.map((i) => { const q = proj(corners[i]); return `${q.x},${q.y}`; }).join(" ");

  const counts: Record<RayFate, number> = { detector: 0, side: 0, upstream: 0, trapped: 0 };
  model.rays.forEach((r) => counts[r.fate]++);

  const downstreamHits = model.rays.filter((r) => r.fate === "detector").map((r) => r.points[r.points.length - 1]);

  // Painter's order for rays: far first
  const drawn = model.rays
    .map((r) => ({ r, d: proj(r.points[r.points.length - 1]).depth }))
    .sort((a, b) => b.d - a.d);

  const beamA = proj([0, 0, -pad]);
  const beamB = proj([0, 0, T + pad]);

  return (
    <div className={`border rounded-xl p-5 shadow-lg ${isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`} id="lab-tab">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-sm font-semibold uppercase tracking-wider">3D Chamber Lab</h2>
        <span className="text-[10px] font-mono uppercase opacity-70">Geometric optics, seeded · drag to rotate, scroll to zoom</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto touch-none cursor-grab select-none rounded-lg"
        style={{ background: isDarkMode ? "#020617" : "#f8fafc" }}
        role="img"
        aria-label="3D radiator block with Cherenkov rays"
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setYaw((v) => v + (e.clientX - drag.current!.x) * 0.01);
          setPitch((v) => Math.max(-1.5, Math.min(1.5, v + (e.clientY - drag.current!.y) * 0.01)));
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => { drag.current = null; }}
        onWheel={(e) => setZoom((z) => Math.max(0.4, Math.min(3, z * (e.deltaY > 0 ? 0.92 : 1.08))))}
      >
        {/* Detector plane at the downstream face */}
        <polygon points={quad([4, 5, 7, 6])} fill="rgba(34,211,238,0.10)" stroke="#22d3ee" strokeWidth={1.5} />
        {/* Radiator block faces */}
        <polygon points={quad([0, 1, 3, 2])} fill="rgba(59,130,246,0.10)" stroke="none" />
        {edges.map(([a, b], i) => {
          const pa = proj(corners[a]);
          const pb = proj(corners[b]);
          return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#3b82f6" strokeWidth={1.5} />;
        })}

        {/* Beam axis */}
        <line x1={beamA.x} y1={beamA.y} x2={beamB.x} y2={beamB.y} stroke="#f97316" strokeWidth={2.5} />
        <circle cx={beamA.x} cy={beamA.y} r={4} fill="#f97316" />
        <text x={beamA.x + 8} y={beamA.y - 6} fill={label} fontSize={11}>beam +z</text>

        {/* Rays */}
        {drawn.map(({ r }, i) => (
          <polyline
            key={i}
            points={r.points.map((p) => { const q = proj(p); return `${q.x},${q.y}`; }).join(" ")}
            fill="none"
            stroke={FATE_COLOUR[r.fate]}
            strokeOpacity={0.55}
            strokeWidth={1}
          />
        ))}

        {/* Hits on the detector plane */}
        {downstreamHits.map((p, i) => {
          const q = proj(p);
          return <circle key={i} cx={q.x} cy={q.y} r={2.2} fill="#22d3ee" />;
        })}

        {!summary.isCherenkovGenerated && (
          <text x={16} y={24} fill="#f59e0b" fontSize={12}>below Cherenkov threshold: no photons</text>
        )}
      </svg>

      <div className="grid sm:grid-cols-2 gap-3 mt-4 text-[11px] font-mono">
        <div className="space-y-1">
          <div>radiator: {T} mm thick, {(2 * h).toFixed(0)} mm square</div>
          <div>emission length: {emission} mm</div>
          <div>θc: {summary.cherenkovAngleDeg.toFixed(2)}°, n = {n.toFixed(4)}</div>
          <div>critical angle (n·sinθ = 1): {model.criticalAngleDeg.toFixed(2)}°</div>
        </div>
        <div className="space-y-1">
          {(Object.keys(counts) as RayFate[]).map((f) => (
            <div key={f} className="flex items-center gap-2">
              <span className="inline-block w-3 h-0.5" style={{ background: FATE_COLOUR[f] }} />
              <span>{counts[f]} / {model.rays.length} {FATE_LABEL[f]}</span>
            </div>
          ))}
        </div>
      </div>

      {model.trappedAtBackFace && (
        <p className="text-[11px] mt-3 text-amber-400">
          θc exceeds the critical angle of the downstream face, so direct Cherenkov light cannot leave through it.
          Real detectors couple it out with a prism, a tapered or textured face, or by changing the geometry.
        </p>
      )}
      <p className="text-[10px] opacity-70 mt-3 font-sans leading-relaxed">
        {RAYS} rays with seeded random emission points along the track and random azimuth, all at the mean Cherenkov
        angle. Fresnel reflection, scattering, absorption, chromatic spread and multiple scattering of the particle are
        not modelled here; the Monte Carlo panel and the analytic engine cover yield and transmission. Detector QE
        ({detector.quantumEfficiencyPct}%) is applied there, not in this drawing.
      </p>
    </div>
  );
}
