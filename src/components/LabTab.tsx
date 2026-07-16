/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { SimulationParams, DetectorSettings, SimulationSummary } from "../types";
import { Atom, Play, Radiation, RotateCcw, ShieldAlert, Sliders, Thermometer, Wind, Eye, Compass, RefreshCw, Sparkles, FileDown } from "lucide-react";
import LabScene3D from "./LabScene3D";
import { generateScientificReportPdf } from "../utils/pdfExport";

interface LabTabProps {
  params: SimulationParams;
  detector: DetectorSettings;
  summary: SimulationSummary;
  isDarkMode: boolean;
}

export default function LabTab({ params, detector, summary, isDarkMode }: LabTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 720, height: 450 });
  const [rotateY, setRotateY] = useState<number>(-45); // isometric rotation angles in degrees
  const [rotateX, setRotateX] = useState<number>(30);
  const [panX, setPanX] = useState<number>(0); // camera panning offset
  const [panY, setPanY] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [isFiringParticle, setIsFiringParticle] = useState<boolean>(false);
  const [particleProgress, setParticleProgress] = useState<number>(0);
  const [vacuumLevel, setVacuumLevel] = useState<number>(4.2e-8); // Torr
  const [chamberTempK, setChamberTempK] = useState<number>(293.15); // Kelvin (room temp)
  const [isLaserGuideActive, setIsLaserGuideActive] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'3D' | '4D' | '2D'>('3D');
  const [time4D, setTime4D] = useState<number>(0);
  const [is4DAnimating, setIs4DAnimating] = useState<boolean>(false);
  const [viewPlane, setViewPlane] = useState<'XY' | 'XZ' | 'YZ'>('XY');
  
  // Interactive scientific instrumentation states
  const [isTrackerActive, setIsTrackerActive] = useState<boolean>(true);
  const [isCalorimeterGated, setIsCalorimeterGated] = useState<boolean>(true);
  const [isFaradayIntegratorArmed, setIsFaradayIntegratorArmed] = useState<boolean>(true);
  const [peltierCoolingW, setPeltierCoolingW] = useState<number>(45);
  const [magneticFieldStrength, setMagneticFieldStrength] = useState<number>(params.magneticFieldTesla || 0);
  const [electricFieldStrength, setElectricFieldStrength] = useState<number>(params.electricFieldKvM || 0);
  const [beamFocusSpotSize, setBeamFocusSpotSize] = useState<number>(params.beamFwhmUm || 10);
  const [beamDivergence, setBeamDivergence] = useState<number>(params.beamDivergenceMrad || 0.5);
  const [pressureTorr, setPressureTorr] = useState<number>(vacuumLevel);
  const [detectorGain, setDetectorGain] = useState<number>(1.0);
  const [triggerThreshold, setTriggerThreshold] = useState<number>(detector.thresholdKeV || 5);
  
  // Drag rotation state
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // ResizeObserver to track container boundaries for canvas dynamic resizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      window.requestAnimationFrame(() => {
        const { width, height } = entries[0].contentRect;
        if (width <= 0) return;
        const targetWidth = Math.floor(width);
        const targetHeight = Math.floor(height || 600);
        setDimensions({ width: targetWidth, height: targetHeight });
      });
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Trigger beam pulse animation
  const handleFirePulse = () => {
    if (isFiringParticle) {
      setIsFiringParticle(false);
    } else {
      setIsFiringParticle(true);
      setParticleProgress(0);
    }
  };

  // Pulse animation loop
  useEffect(() => {
    if (!isFiringParticle) return;
    let animFrame: number;
    const speed = 0.02 + (params.beamEnergyMeV > 100 ? 0.01 : 0.005); // slightly slower for better visual loops

    const step = () => {
      setParticleProgress((prev) => {
        if (prev >= 1.0) {
          return 0; // Loop indefinitely instead of stopping
        }
        return prev + speed;
      });
      animFrame = requestAnimationFrame(step);
    };
    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [isFiringParticle, params.beamEnergyMeV]);

  // 4D time animation loop
  useEffect(() => {
    if (!is4DAnimating) return;
    let animFrame: number;
    const step = () => {
      setTime4D((prev) => (prev + 0.02) % 1);
      animFrame = requestAnimationFrame(step);
    };
    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [is4DAnimating]);

  // Adjust vacuum level randomly to simulate active cryogenic turbomolecular pump
  useEffect(() => {
    const interval = setInterval(() => {
      setVacuumLevel((prev) => {
        const delta = (Math.random() - 0.5) * 1.5e-9;
        return Math.max(1.0e-9, prev + delta);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animation state for ambient features
  const animationRef = useRef<number>(0);
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    // Only run the animation loop if we need it
    if (params.ambientCosmicRays || params.componentsActive?.hadronicShower) {
      let lastTime = performance.now();
      const animate = (time: number) => {
        if (time - lastTime > 33) { // ~30 fps
          setFrame(f => f + 1);
          lastTime = time;
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [params.ambientCosmicRays, params.componentsActive?.hadronicShower]);

  // Scientific 3D render engine using Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resizing
    const width = dimensions.width;
    const height = dimensions.height;
    ctx.clearRect(0, 0, width, height);

    // Apply viewport scale and center offsets
    const scale = Math.max(5.5, (width / 720) * 8.5); // Reduced scale factor
    const cx = (width / 2) + panX;
    const cy = (height / 2) + panY; // Centered vertically with pan

    // Trigonometric rotation precalculations
    const radY = (rotateY * Math.PI) / 180;
    const radX = (rotateX * Math.PI) / 180;

    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);

    // 3D coordinate projection function with Orthographic Depth
    const project3D = (x: number, y: number, z: number) => {
      // Apply 4D time displacement if in 4D mode
      let timeOffset = 0;
      if (viewMode === '4D') {
        timeOffset = Math.sin(time4D * Math.PI * 2) * 2;
      }

      // Center the model which has positive Z offsets up to ~120
      const zCenter = 50; 
      const zCentered = z - zCenter;

      // Rotate around Y-axis
      let x1 = (x + timeOffset) * cosY - zCentered * sinY;
      let z1 = zCentered * cosY + (x + timeOffset) * sinY;

      // Rotate around X-axis
      let y2 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;

      // Orthographic Projection
      return {
        screenX: cx + x1 * scale,
        screenY: cy - y2 * scale, // invert screen Y axis
        depth: z2,
      };
    };

    // 2D projection based on selected plane
    const project2D = (x: number, y: number, z: number) => {
      if (viewPlane === 'XY') {
        return {
          screenX: cx + x * scale,
          screenY: cy - y * scale,
          depth: z,
        };
      } else if (viewPlane === 'XZ') {
        return {
          screenX: cx + x * scale,
          screenY: cy - z * scale,
          depth: y,
        };
      } else { // YZ
        return {
          screenX: cx + z * scale,
          screenY: cy - y * scale,
          depth: x,
        };
      }
    };

    const drawAxis = () => {
      const axisLen = 15;
      const project = viewMode === '2D' ? project2D : project3D;
      
      // X-axis (Red)
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
      ctx.beginPath();
      const origin = project(0, 0, 0);
      const xEnd = project(axisLen, 0, 0);
      ctx.moveTo(origin.screenX, origin.screenY); ctx.lineTo(xEnd.screenX, xEnd.screenY);
      ctx.stroke();
      
      // Y-axis (Green)
      ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
      ctx.beginPath();
      const yEnd = project(0, axisLen, 0);
      ctx.moveTo(origin.screenX, origin.screenY); ctx.lineTo(yEnd.screenX, yEnd.screenY);
      ctx.stroke();

      // Z-axis (Blue) - Beamline
      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.beginPath();
      const zEnd = project(0, 0, axisLen);
      const zStart = project(0, 0, -axisLen);
      ctx.moveTo(zStart.screenX, zStart.screenY); ctx.lineTo(zEnd.screenX, zEnd.screenY);
      ctx.stroke();
    };
    drawAxis();

    // 1. Draw Synchronized Monte Carlo Subsystems (SEQUENTIAL ALONG Z-AXIS)
    const drawSubsystemLayers = () => {
      const project = viewMode === '2D' ? project2D : project3D;
      const layers = [
        { active: params.detectorSubsystems?.pixelTracker, r: 6, l: 8, outline: "rgba(168, 85, 247, 0.8)", zOffset: 5 },    
        { active: params.detectorSubsystems?.stripTracker, r: 8, l: 12, outline: "rgba(168, 85, 247, 0.6)", zOffset: 16 },
        { active: params.detectorSubsystems?.tpc,          r: 12, l: 20, outline: "rgba(59, 130, 246, 0.7)", zOffset: 34 },     
        { active: params.detectorSubsystems?.driftChamber, r: 14, l: 18, outline: "rgba(6, 182, 212, 0.7)", zOffset: 54 },      
        { active: params.detectorSubsystems?.rich,         r: 16, l: 10, outline: "rgba(236, 72, 153, 0.7)", zOffset: 70 },    
        { active: params.detectorSubsystems?.ecal,         r: 20, l: 14, outline: "rgba(34, 197, 94, 0.7)", zOffset: 84 },      
        { active: params.detectorSubsystems?.hcal,         r: 24, l: 20, outline: "rgba(234, 179, 8, 0.6)", zOffset: 104 },     
        { active: params.detectorSubsystems?.muonSpectrometer, r: 30, l: 16, outline: "rgba(249, 115, 22, 0.6)", zOffset: 124 },
      ];

      layers.forEach(layer => {
        if (!layer.active) return;
        ctx.lineWidth = 1;
        ctx.strokeStyle = layer.outline;
        ctx.setLineDash([2, 4]); 
        
        // Front and back rings
        [-layer.l/2, layer.l/2].forEach(zPos => {
           ctx.beginPath();
           for (let theta = 0; theta <= Math.PI * 2; theta += 0.2) {
             const p = project(layer.r * Math.cos(theta), layer.r * Math.sin(theta), layer.zOffset + zPos);
             if (theta === 0) ctx.moveTo(p.screenX, p.screenY);
             else ctx.lineTo(p.screenX, p.screenY);
           }
           ctx.closePath();
           ctx.stroke();
        });
        
        // Staves connecting them
        ctx.setLineDash([]);
        for (let i = 0; i < 6; i++) {
           const theta = (i / 6) * Math.PI * 2;
           const pStart = project(layer.r * Math.cos(theta), layer.r * Math.sin(theta), layer.zOffset - layer.l/2);
           const pEnd = project(layer.r * Math.cos(theta), layer.r * Math.sin(theta), layer.zOffset + layer.l/2);
           ctx.beginPath();
           ctx.moveTo(pStart.screenX, pStart.screenY);
           ctx.lineTo(pEnd.screenX, pEnd.screenY);
           ctx.stroke();
        }
      });
    };
    drawSubsystemLayers();

    // 1.5 Draw Monte Carlo Interactions & Reconstructions & Exotic Physics (ANIMATED)
    const drawInteractions = () => {
      const project = viewMode === '2D' ? project2D : project3D;
      
      // Ambient Cosmic Rays
      if (params.ambientCosmicRays) {
        ctx.strokeStyle = "rgba(167, 243, 208, 0.6)"; // Emerald
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 10]);
        // Use frame to offset the dash for a flowing laser effect
        ctx.lineDashOffset = -frame * 2; 
        
        // Generate pseudo-random rays based on frame ranges
        for (let i = 0; i < 3; i++) {
          const pseudoX = Math.sin((frame + i*100) / 50) * 30;
          const pseudoZ = Math.cos((frame + i*50) / 40) * 50 + 50;
          ctx.beginPath();
          const start = project(pseudoX - 20, 40, pseudoZ - 10);
          const end = project(pseudoX + 20, -40, pseudoZ + 10);
          ctx.moveTo(start.screenX, start.screenY);
          ctx.lineTo(end.screenX, end.screenY);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
      }

      // Particle Interactions
      if (params.componentsActive?.hadronicShower) {
        // Draw a spray of particles (cone)
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
        ctx.beginPath();
        const start = project(0, 0, 84); // Originating near ECAL/HCAL
        for (let i = 0; i < 8; i++) {
          // Animate the shower expanding outwards
          const spread = (frame % 30) / 30; // 0 to 1
          const r = spread * 20;
          const end = project(r * Math.cos(i), r * Math.sin(i), 84 + spread * 40);
          ctx.moveTo(start.screenX, start.screenY);
          ctx.lineTo(end.screenX, end.screenY);
          
          // Draw animated energy hits (flashes)
          if (spread > 0.1) {
            ctx.fillStyle = "rgba(252, 211, 77, 0.8)";
            ctx.beginPath();
            ctx.arc(end.screenX, end.screenY, 2, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath(); // reset
          }
        }
        ctx.stroke();
      }

      if (params.componentsActive?.muonDecay) {
        // Draw a long straight track that suddenly kinks
        ctx.strokeStyle = "rgba(147, 197, 253, 0.8)";
        ctx.beginPath();
        const p1 = project(2, 2, 0);
        const p2 = project(4, 4, 30);
        const p3 = project(8, 2, 60); // Kink
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.lineTo(p2.screenX, p2.screenY);
        ctx.lineTo(p3.screenX, p3.screenY);
        ctx.stroke();
      }

      if (params.componentsActive?.pairProduction) {
        // Draw a V shape (e+ e- pair)
        ctx.strokeStyle = "rgba(250, 204, 21, 0.8)";
        ctx.beginPath();
        const origin = project(-5, -5, 5);
        const ePlus = project(-10, -8, 15);
        const eMinus = project(0, -2, 15);
        ctx.moveTo(origin.screenX, origin.screenY);
        ctx.lineTo(ePlus.screenX, ePlus.screenY);
        ctx.moveTo(origin.screenX, origin.screenY);
        ctx.lineTo(eMinus.screenX, eMinus.screenY);
        ctx.stroke();
      }

      // ML Reconstruction
      if (params.reconstruction?.kalmanFilter) {
        // Draw a dotted smoothed track with error ellipses
        ctx.strokeStyle = "rgba(244, 114, 182, 0.8)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        const start = project(0, 5, -15);
        const mid = project(5, 8, 0);
        const end = project(10, 5, 15);
        ctx.moveTo(start.screenX, start.screenY);
        ctx.quadraticCurveTo(mid.screenX, mid.screenY, end.screenX, end.screenY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Error bounds
        [start, mid, end].forEach(p => {
          ctx.beginPath();
          ctx.ellipse(p.screenX, p.screenY, 4, 8, Math.PI/4, 0, Math.PI*2);
          ctx.stroke();
        });
      }

      if (params.reconstruction?.helixFitting) {
        // Draw a helical spiral
        ctx.strokeStyle = "rgba(167, 139, 250, 0.8)";
        ctx.beginPath();
        for (let t = -20; t < 20; t += 1) {
          const p = project(10 * Math.cos(t/2), 10 * Math.sin(t/2), t);
          if (t === -20) ctx.moveTo(p.screenX, p.screenY);
          else ctx.lineTo(p.screenX, p.screenY);
        }
        ctx.stroke();
      }

      // Exotic Physics
      if (params.exoticPhysics?.darkMatter) {
        // Missing energy dashed vector (MET)
        ctx.strokeStyle = "rgba(156, 163, 175, 0.9)";
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        const origin = project(0, 0, 0);
        const met = project(-20, 15, 0);
        ctx.moveTo(origin.screenX, origin.screenY);
        ctx.lineTo(met.screenX, met.screenY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.fillStyle = "rgba(156, 163, 175, 0.9)";
        ctx.fillText("MET (Dark Matter)", met.screenX + 5, met.screenY);
      }

      if (params.exoticPhysics?.magneticMonopoles) {
        // Highly ionizing straight track
        ctx.strokeStyle = "rgba(248, 113, 113, 1)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        const start = project(0, 0, -20);
        const end = project(15, 15, 20);
        ctx.moveTo(start.screenX, start.screenY);
        ctx.lineTo(end.screenX, end.screenY);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    };
    drawInteractions();

    // 2. Draw Chamber Shape Based on Selection
    const drawChamberShape = () => {
      const project = viewMode === '2D' ? project2D : project3D;
      const chamberShape = params.chamberShape || "Cylindrical-Beam-Pipe";
      
      ctx.strokeStyle = isDarkMode ? "rgba(148, 163, 184, 0.3)" : "rgba(100, 116, 139, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      
      switch(chamberShape) {
        case "Cylindrical-Beam-Pipe":
          // Draw cylindrical beam pipe
          ctx.beginPath();
          for (let theta = 0; theta <= Math.PI * 2; theta += 0.1) {
            const x = 16 * Math.cos(theta);
            const y = 16 * Math.sin(theta);
            const p = project(x, y, -20);
            if (theta === 0) ctx.moveTo(p.screenX, p.screenY);
            else ctx.lineTo(p.screenX, p.screenY);
          }
          ctx.stroke();
          // Second end
          ctx.beginPath();
          for (let theta = 0; theta <= Math.PI * 2; theta += 0.1) {
            const x = 16 * Math.cos(theta);
            const y = 16 * Math.sin(theta);
            const p = project(x, y, 20);
            if (theta === 0) ctx.moveTo(p.screenX, p.screenY);
            else ctx.lineTo(p.screenX, p.screenY);
          }
          ctx.stroke();
          break;
          
        case "Spherical-Reaction-Vessel":
          // Draw spherical vessel (multiple rings)
          ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
          const rSph = 16;
          for (let phi = -Math.PI/2; phi <= Math.PI/2; phi += Math.PI/6) {
            ctx.beginPath();
            const zSph = Math.sin(phi) * rSph;
            const radiusAtZ = Math.cos(phi) * rSph;
            for (let theta = 0; theta <= Math.PI * 2; theta += 0.1) {
              const xSph = radiusAtZ * Math.cos(theta);
              const ySph = radiusAtZ * Math.sin(theta);
              const p = project(xSph, ySph, zSph);
              if (theta === 0) ctx.moveTo(p.screenX, p.screenY);
              else ctx.lineTo(p.screenX, p.screenY);
            }
            ctx.stroke();
          }
          break;

        case "Toroidal-fusion-Ring":
          // Draw torus shape
          ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
          const majorR = 12;
          const minorR = 6;
          for (let theta = 0; theta < Math.PI * 2; theta += Math.PI/8) {
            ctx.beginPath();
            for (let phi = 0; phi <= Math.PI * 2; phi += 0.1) {
              const ringR = majorR + minorR * Math.cos(phi);
              const ringZ = minorR * Math.sin(phi);
              const p = project(ringR * Math.cos(theta), ringR * Math.sin(theta), ringZ);
              if (phi === 0) ctx.moveTo(p.screenX, p.screenY);
              else ctx.lineTo(p.screenX, p.screenY);
            }
            ctx.stroke();
          }
          break;

        case "Hexagonal-Cubic-Chamber":
          // Draw hexagonal prism
          ctx.strokeStyle = "rgba(20, 184, 166, 0.4)";
          const hexR = 16;
          const zFront = 20;
          const zBack = -20;
          
          ctx.beginPath();
          for (let i = 0; i <= 6; i++) {
            const angle = i * Math.PI / 3;
            const p = project(hexR * Math.cos(angle), hexR * Math.sin(angle), zFront);
            if (i === 0) ctx.moveTo(p.screenX, p.screenY);
            else ctx.lineTo(p.screenX, p.screenY);
          }
          ctx.stroke();
          
          ctx.beginPath();
          for (let i = 0; i <= 6; i++) {
            const angle = i * Math.PI / 3;
            const p = project(hexR * Math.cos(angle), hexR * Math.sin(angle), zBack);
            if (i === 0) ctx.moveTo(p.screenX, p.screenY);
            else ctx.lineTo(p.screenX, p.screenY);
          }
          ctx.stroke();
          
          for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const p1 = project(hexR * Math.cos(angle), hexR * Math.sin(angle), zFront);
            const p2 = project(hexR * Math.cos(angle), hexR * Math.sin(angle), zBack);
            ctx.beginPath();
            ctx.moveTo(p1.screenX, p1.screenY);
            ctx.lineTo(p2.screenX, p2.screenY);
            ctx.stroke();
          }
          break;
          
        case "TPC-Cylindrical":
          // Draw TPC with end caps
          ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
          // Outer cylinder
          ctx.beginPath();
          for (let theta = 0; theta <= Math.PI * 2; theta += 0.1) {
            const x = 14 * Math.cos(theta);
            const y = 14 * Math.sin(theta);
            const p = project(x, y, -18);
            if (theta === 0) ctx.moveTo(p.screenX, p.screenY);
            else ctx.lineTo(p.screenX, p.screenY);
          }
          ctx.stroke();
          ctx.beginPath();
          for (let theta = 0; theta <= Math.PI * 2; theta += 0.1) {
            const x = 14 * Math.cos(theta);
            const y = 14 * Math.sin(theta);
            const p = project(x, y, 18);
            if (theta === 0) ctx.moveTo(p.screenX, p.screenY);
            else ctx.lineTo(p.screenX, p.screenY);
          }
          ctx.stroke();
          // TPC end cap wires
          ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
          for (let i = -12; i <= 12; i += 2) {
            const p1 = project(i, -12, -18);
            const p2 = project(i, 12, -18);
            ctx.beginPath(); ctx.moveTo(p1.screenX, p1.screenY); ctx.lineTo(p2.screenX, p2.screenY); ctx.stroke();
            const p3 = project(i, -12, 18);
            const p4 = project(i, 12, 18);
            ctx.beginPath(); ctx.moveTo(p3.screenX, p3.screenY); ctx.lineTo(p4.screenX, p4.screenY); ctx.stroke();
          }
          break;
          
        case "Calorimeter-Block":
          // Draw block calorimeter
          ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
          const corners = [
            project(-15, -15, -15), project(15, -15, -15), project(15, 15, -15), project(-15, 15, -15),
            project(-15, -15, 15), project(15, -15, 15), project(15, 15, 15), project(-15, 15, 15)
          ];
          // Front face
          ctx.beginPath();
          ctx.moveTo(corners[0].screenX, corners[0].screenY);
          corners.slice(1, 5).forEach(c => ctx.lineTo(c.screenX, c.screenY));
          ctx.closePath(); ctx.stroke();
          // Back face
          ctx.beginPath();
          ctx.moveTo(corners[4].screenX, corners[4].screenY);
          corners.slice(5, 8).forEach(c => ctx.lineTo(c.screenX, c.screenY));
          ctx.lineTo(corners[4].screenX, corners[4].screenY);
          ctx.stroke();
          // Connecting edges
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(corners[i].screenX, corners[i].screenY);
            ctx.lineTo(corners[i+4].screenX, corners[i+4].screenY);
            ctx.stroke();
          }
          break;
          
        case "Muon-Spectrometer":
          // Draw drift tube layers
          ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
          for (let layer = 0; layer < 3; layer++) {
            const r = 12 + layer * 3;
            const z = -15 + layer * 15;
            ctx.beginPath();
            for (let theta = 0; theta <= Math.PI * 2; theta += 0.15) {
              const x = r * Math.cos(theta);
              const y = r * Math.sin(theta);
              const p = project(x, y, z);
              if (theta === 0) ctx.moveTo(p.screenX, p.screenY);
              else ctx.lineTo(p.screenX, p.screenY);
            }
            ctx.closePath(); ctx.stroke();
          }
          break;
          
        default:
          // Default cylindrical
          ctx.beginPath();
          for (let theta = 0; theta <= Math.PI * 2; theta += 0.1) {
            const x = 15 * Math.cos(theta);
            const y = 15 * Math.sin(theta);
            const p = project(x, y, -20);
            if (theta === 0) ctx.moveTo(p.screenX, p.screenY);
            else ctx.lineTo(p.screenX, p.screenY);
          }
          ctx.stroke();
      }
      
      ctx.setLineDash([]);
    };
    drawChamberShape();

    // 1.5 Draw Subsystem Cylindrical Barrels
    const drawDetectorLayers = () => {
      const project = viewMode === '2D' ? project2D : project3D;
      const layers = [
        { active: params.detectorSubsystems?.pixelTracker, r: 2, l: 20, color: "rgba(168, 85, 247, 0.2)", outline: "rgba(168, 85, 247, 0.5)" },    // Purple
        { active: params.detectorSubsystems?.stripTracker, r: 4, l: 24, color: "rgba(168, 85, 247, 0.1)", outline: "rgba(168, 85, 247, 0.4)" },
        { active: params.detectorSubsystems?.tpc,          r: 6, l: 26, color: "rgba(59, 130, 246, 0.1)", outline: "rgba(59, 130, 246, 0.4)" },     // Blue
        { active: params.detectorSubsystems?.driftChamber, r: 7, l: 27, color: "rgba(6, 182, 212, 0.1)", outline: "rgba(6, 182, 212, 0.5)" },       // Cyan
        { active: params.detectorSubsystems?.ecal,         r: 8, l: 28, color: "rgba(34, 197, 94, 0.15)", outline: "rgba(34, 197, 94, 0.5)" },      // Green
        { active: params.detectorSubsystems?.hcal,         r: 11, l: 30, color: "rgba(234, 179, 8, 0.1)", outline: "rgba(234, 179, 8, 0.4)" },      // Yellow
        { active: params.detectorSubsystems?.rich,         r: 13, l: 32, color: "rgba(236, 72, 153, 0.1)", outline: "rgba(236, 72, 153, 0.5)" },    // Pink
        { active: params.detectorSubsystems?.muonSpectrometer, r: 15, l: 34, color: "rgba(249, 115, 22, 0.1)", outline: "rgba(249, 115, 22, 0.4)" },// Orange
      ];

      layers.forEach(layer => {
        if (!layer.active) return;
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = layer.outline;
        
        // Draw 3 rings along Z
        [-layer.l/2, 0, layer.l/2].forEach(zPos => {
           ctx.beginPath();
           for (let theta = 0; theta <= Math.PI * 2; theta += 0.2) {
             const xVal = layer.r * Math.cos(theta);
             const yVal = layer.r * Math.sin(theta);
             const p = project(xVal, yVal, zPos);
             if (theta === 0) ctx.moveTo(p.screenX, p.screenY);
             else ctx.lineTo(p.screenX, p.screenY);
           }
           ctx.closePath();
           ctx.stroke();
        });
        
        // Draw 8 longitudinal staves
        for (let i = 0; i < 8; i++) {
           const theta = (i / 8) * Math.PI * 2;
           const xVal = layer.r * Math.cos(theta);
           const yVal = layer.r * Math.sin(theta);
           const pStart = project(xVal, yVal, -layer.l/2);
           const pEnd = project(xVal, yVal, layer.l/2);
           ctx.beginPath();
           ctx.moveTo(pStart.screenX, pStart.screenY);
           ctx.lineTo(pEnd.screenX, pEnd.screenY);
           ctx.stroke();
        }
      });
    };
    drawDetectorLayers();

    // 2. Render target medium Block / active radiator
    const matColor = 
      params.materialId === "water" || params.materialId === "heavy_water"
        ? "0, 120, 255"
        : params.materialId === "quartz"
          ? "0, 220, 220"
          : params.materialId === "lyso"
            ? "230, 200, 50"
            : "200, 200, 200";

    const tLenGlobal = (params.chamberLengthCm || 40) / 2; // e.g. 20

    const drawTargetMediumBlock = () => {
      const project = viewMode === '2D' ? project2D : project3D;
      const targetLength = tLenGlobal * 2;
      const tRad = Math.min(6, (params.radiatorThicknessMm || 15.0) / 2.5);

      // Render wireframe facets of our Target Radiator Medium centered at Z=0
      ctx.strokeStyle = `rgba(${matColor}, 0.25)`;
      ctx.lineWidth = 1;
      
      const segmentsZ = 6;
      const segmentsRadial = 12;

      for (let s = 0; s <= segmentsZ; s++) {
        const zP = (s / segmentsZ) * targetLength - targetLength / 2;
        ctx.beginPath();
        for (let r = 0; r <= segmentsRadial; r++) {
          const theta = (r / segmentsRadial) * Math.PI * 2;
          const xP = tRad * Math.cos(theta);
          const yP = tRad * Math.sin(theta);
          const p = project(xP, yP, zP);
          if (r === 0) ctx.moveTo(p.screenX, p.screenY);
          else ctx.lineTo(p.screenX, p.screenY);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Medium solid facet fill overlay
      const capP1 = project(0, 0, -targetLength/2);
      const capP2 = project(0, 0, targetLength/2);
      const capGrad = ctx.createRadialGradient(capP1.screenX, capP1.screenY, 1, capP2.screenX, capP2.screenY, scale * tRad);
      capGrad.addColorStop(0, `rgba(${matColor}, 0.05)`);
      capGrad.addColorStop(1, `rgba(${matColor}, 0.01)`);
      ctx.fillStyle = capGrad;
      
      ctx.beginPath();
      for (let r = 0; r <= segmentsRadial; r++) {
        const theta = (r / segmentsRadial) * Math.PI * 2;
        const xP = tRad * Math.cos(theta);
        const yP = tRad * Math.sin(theta);
        const p = project(xP, yP, targetLength/2);
        if (r === 0) ctx.moveTo(p.screenX, p.screenY);
        else ctx.lineTo(p.screenX, p.screenY);
      }
      ctx.closePath();
      ctx.fill();
    };
    drawTargetMediumBlock();

    // 2.5 Sensor Photodetector Array target plane (Square readout board) at Z = tLenGlobal
    const drawTargetSurface = () => {
      const project = viewMode === '2D' ? project2D : project3D;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const sSize = 80;
      const targetZ = tLenGlobal; 
      const p1 = project(-sSize, -sSize, targetZ);
      const p2 = project(sSize, -sSize, targetZ);
      const p3 = project(sSize, sSize, targetZ);
      const p4 = project(-sSize, sSize, targetZ);
      ctx.moveTo(p1.screenX, p1.screenY);
      ctx.lineTo(p2.screenX, p2.screenY);
      ctx.lineTo(p3.screenX, p3.screenY);
      ctx.lineTo(p4.screenX, p4.screenY);
      ctx.closePath();
      ctx.stroke();

      // Readout grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 0.5;
      for (let i = -sSize; i <= sSize; i += 2) {
        let l1 = project(i, -sSize, targetZ); let l2 = project(i, sSize, targetZ);
        ctx.beginPath(); ctx.moveTo(l1.screenX, l1.screenY); ctx.lineTo(l2.screenX, l2.screenY); ctx.stroke();
        let l3 = project(-sSize, i, targetZ); let l4 = project(sSize, i, targetZ);
        ctx.beginPath(); ctx.moveTo(l3.screenX, l3.screenY); ctx.lineTo(l4.screenX, l4.screenY); ctx.stroke();
      }

    };
    drawTargetSurface();

    // 3. Render Particle Beam Trajectory & Lorentz Magnetic Field Bending
    const drawTrajectory = () => {
      const project = viewMode === '2D' ? project2D : project3D;
      const tLen = tLenGlobal;
      const tRad = Math.min(6, (params.radiatorThicknessMm || 15.0) / 2.5);
      
      ctx.lineWidth = Math.max(1, Math.min(4, Math.abs(params.beamCharge || 1)));
      ctx.strokeStyle = "rgba(239, 68, 68, 0.95)"; // Charged particle trajectory (red)
      
      const incidenceRad = (params.incidenceAngleDeg * Math.PI) / 180;
      
      ctx.beginPath();
      
      const numSteps = 50;
      const points: {x: number, y: number, z: number}[] = [];
      
      for (let step = 0; step <= numSteps; step++) {
        const t = (step / numSteps);
        // Start beam slightly outside chamber on the left
        const zCoord = (t * (tLen * 2)) - tLen;
        
        // Relativistic bending arc logic (Lorentz deflection model)
        const bField = params.magneticFieldTesla || params.magneticFieldT || 0.0;
        const eField = params.electricFieldKvM || 0.0;
        
        // Scale deflection to fit within typical detector bounds
        const deflectionB = bField * 0.002 * Math.pow(zCoord + tLen, 2) * (params.beamCharge >= 0 ? 1 : -1);
        const deflectionE = eField * 0.0005 * Math.pow(zCoord + tLen, 2) * (params.beamCharge >= 0 ? 1 : -1);
        const deflection = deflectionB + deflectionE;
        
        // Incident beam angle projection
        const yCoord = (zCoord + tLen) * Math.sin(incidenceRad) + deflection;
        const xCoord = (zCoord + tLen) * Math.sin(incidenceRad) * 0.5 * (Math.abs(eField) > 0 ? 0.2 : 0);
        
        points.push({ x: xCoord, y: yCoord, z: zCoord });
        
        const proj = project(xCoord, yCoord, zCoord);
        if (step === 0) ctx.moveTo(proj.screenX, proj.screenY);
        else ctx.lineTo(proj.screenX, proj.screenY);
      }
      ctx.stroke();

      // Render Cherenkov cones projecting outward from mid track
      if (summary.isCherenkovGenerated) {
        const emittingIndex = Math.floor(numSteps / 2);
        const emitterPoint = points[emittingIndex];
        const coneAngleRad = (summary.cherenkovAngleDeg * Math.PI) / 180;

        ctx.strokeStyle = "rgba(34, 211, 238, 0.6)"; // Cherenkov emission UV UV cone color (Cyan)
        ctx.lineWidth = 1.5;

        // Draw multiple light rays spanning the cone circumference
        const targetZ = tLenGlobal;
        const requiredZDist = targetZ - emitterPoint.z;
        const rayDistance = requiredZDist / Math.cos(coneAngleRad);

        for (let ang = 0; ang < Math.PI * 2; ang += Math.PI / 8) {
          // Add some randomness for realistic photomultiplier hits
          const jitterAng = ang + (Math.random() - 0.5) * 0.1;
          const rx = rayDistance * Math.sin(coneAngleRad) * Math.cos(jitterAng);
          const ry = rayDistance * Math.sin(coneAngleRad) * Math.sin(jitterAng);
          const rz = rayDistance * Math.cos(coneAngleRad);

          const conePeak = project(emitterPoint.x, emitterPoint.y, emitterPoint.z);
          // End exactly at targetZ!
          const endPoint = {
            x: emitterPoint.x + rx,
            y: emitterPoint.y + ry,
            z: emitterPoint.z + rz
          };
          const coneEnd = project(endPoint.x, endPoint.y, endPoint.z);

          // Ray path
          ctx.beginPath();
          ctx.moveTo(conePeak.screenX, conePeak.screenY);
          ctx.lineTo(coneEnd.screenX, coneEnd.screenY);
          ctx.stroke();

          // Photon hitting the target plane (Cyan dot)
          ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
          ctx.beginPath();
          ctx.arc(coneEnd.screenX, coneEnd.screenY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw active fired particle pulse moving down the track
      if (isFiringParticle && particleProgress > 0) {
        const index = Math.min(numSteps, Math.floor(particleProgress * numSteps));
        const pulsePos = points[index];
        const pulseScreen = project(pulsePos.x, pulsePos.y, pulsePos.z);
        
        // outer blast burst
        const energyScaling = Math.max(5, Math.min(18, 5 + params.beamEnergyMeV * 0.1));
        const pulseGrad = ctx.createRadialGradient(
          pulseScreen.screenX, pulseScreen.screenY, 1,
          pulseScreen.screenX, pulseScreen.screenY, energyScaling
        );
        pulseGrad.addColorStop(0, "rgba(251, 146, 60, 1.0)"); // energetic orange core
        pulseGrad.addColorStop(0.3, "rgba(239, 68, 68, 0.85)");
        pulseGrad.addColorStop(1, "rgba(239, 68, 68, 0.0)");
        
        ctx.fillStyle = pulseGrad;
        ctx.beginPath();
        ctx.arc(pulseScreen.screenX, pulseScreen.screenY, energyScaling, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scintillation nanoparticles fluorescence background emission spheres
      if (params.nanoparticlesActive) {
        ctx.fillStyle = "rgba(34, 197, 94, 0.25)"; // fluorescent organic dopant glow (Green)
        points.forEach((p, idx) => {
          if (idx % 8 === 0) {
            const screenP = project(p.x, p.y, p.z);
            ctx.beginPath();
            ctx.arc(screenP.screenX, screenP.screenY, 6.0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // Dynamic Theoretical Radiative Animations based on Physics parameters
      if (params.componentsActive.bremsstrahlung) {
        // Render continuous energetic secondary white/yellow photon rays dispersing at extremely small angles relative to trajectory
        ctx.strokeStyle = "rgba(253, 224, 71, 0.5)"; // golden yellow
        ctx.lineWidth = 1;
        const emittingIndex = Math.floor(numSteps * 0.35); // earlier in the deceleration path
        const emPos = points[emittingIndex];
        if (emPos) {
          for (let angle = -0.3; angle <= 0.3; angle += 0.15) {
            const pStart = project(emPos.x, emPos.y, emPos.z);
            const pEnd = project(emPos.x + angle * 3, emPos.y + 1.2, emPos.z + 4);
            ctx.beginPath();
            ctx.moveTo(pStart.screenX, pStart.screenY);
            ctx.lineTo(pEnd.screenX, pEnd.screenY);
            ctx.stroke();

            ctx.fillStyle = "rgba(253, 224, 71, 0.8)";
            ctx.beginPath();
            ctx.arc(pEnd.screenX, pEnd.screenY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (params.componentsActive.opticalRayleighScattering) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.35)"; // soft blue
        ctx.lineWidth = 1;
        const emPos = points[Math.floor(numSteps * 0.5)];
        if (emPos) {
          const pC = project(emPos.x, emPos.y, emPos.z);
          ctx.beginPath();
          ctx.arc(pC.screenX, pC.screenY, 20, 0, Math.PI * 2);
          ctx.stroke();

          // Scattered direction indicators
          for (let theta = 0; theta < Math.PI * 2; theta += Math.PI / 3) {
            const pEnd = project(emPos.x + Math.cos(theta) * 3, emPos.y + Math.sin(theta) * 3, emPos.z);
            ctx.beginPath();
            ctx.moveTo(pC.screenX, pC.screenY);
            ctx.lineTo(pEnd.screenX, pEnd.screenY);
            ctx.stroke();
          }
        }
      }

      if (params.componentsActive.comptonScattering) {
        ctx.strokeStyle = "rgba(168, 85, 247, 0.5)"; // purple/pink
        ctx.lineWidth = 1.2;
        const emPos = points[Math.floor(numSteps * 0.6)];
        if (emPos) {
          const pC = project(emPos.x, emPos.y, emPos.z);
          // Wavelet path outward
          ctx.beginPath();
          for (let i = 0; i < 20; i++) {
            const dxCoord = i * 0.2;
            const dyCoord = Math.sin(i * 1.2) * 0.5;
            const pWave = project(emPos.x + dxCoord, emPos.y + dyCoord, emPos.z + i * 0.3);
            if (i === 0) ctx.moveTo(pWave.screenX, pWave.screenY);
            else ctx.lineTo(pWave.screenX, pWave.screenY);
          }
          ctx.stroke();

          // Recoil electron line
          const pRecoil = project(emPos.x - 2, emPos.y - 2, emPos.z + 1);
          ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
          ctx.beginPath();
          ctx.moveTo(pC.screenX, pC.screenY);
          ctx.lineTo(pRecoil.screenX, pRecoil.screenY);
          ctx.stroke();
        }
      }

      if (params.componentsActive.photoelectricIonization) {
        ctx.strokeStyle = "rgba(236, 72, 153, 0.5)"; // pink
        ctx.lineWidth = 1;
        const emPos = points[Math.floor(numSteps * 0.25)];
        if (emPos) {
          const pC = project(emPos.x, emPos.y, emPos.z);
          // Ejection circles
          ctx.beginPath();
          ctx.arc(pC.screenX, pC.screenY, 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(pC.screenX, pC.screenY, 14, 0, Math.PI * 2);
          ctx.stroke();

          // Ejected delta electrons
          ctx.fillStyle = "rgba(236, 72, 153, 0.9)";
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
            const pE = project(emPos.x + Math.cos(a) * 2, emPos.y + Math.sin(a) * 2, emPos.z);
            ctx.beginPath();
            ctx.arc(pE.screenX, pE.screenY, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (params.componentsActive.transitionRadiation) {
        ctx.strokeStyle = "rgba(244, 63, 94, 0.6)"; // rose red
        ctx.lineWidth = 1.5;
        const tLen = (params.trackLengthMm || 10.0) / 1.5;
        // Boundary coordinates are at -tLen/2 and tLen/2
        [-tLen/2, tLen/2].forEach((boundZ) => {
          const boundaryPos = points.find(p => p.z >= boundZ) || points[0];
          const pC = project(boundaryPos.x, boundaryPos.y, boundZ);
          
          // Interface flash lines
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            const dxCoord = Math.cos(angle) * 2;
            const dyCoord = Math.sin(angle) * 2;
            const pEnd = project(boundaryPos.x + dxCoord, boundaryPos.y + dyCoord, boundZ);
            ctx.beginPath();
            ctx.moveTo(pC.screenX, pC.screenY);
            ctx.lineTo(pEnd.screenX, pEnd.screenY);
            ctx.stroke();
          }
          
          // Halo Ring
          ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
          ctx.beginPath();
          ctx.arc(pC.screenX, pC.screenY, 10, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      if (params.componentsActive.synchrotronRadiation) {
        // High frequency helical photon emission along the magnetic curve
        ctx.strokeStyle = "rgba(167, 139, 250, 0.8)"; // bright violet
        ctx.lineWidth = 0.5;
        for (let i = 0; i < points.length; i += 3) {
          const pt = points[i];
          const pC = project(pt.x, pt.y, pt.z);
          const tangentDX = i < points.length - 1 ? points[i+1].x - pt.x : 0;
          const tangentDY = i < points.length - 1 ? points[i+1].y - pt.y : 0;
          const tangentDZ = i < points.length - 1 ? points[i+1].z - pt.z : 1;
          
          // Emit photons tangent to the curve
          const pEnd = project(pt.x + tangentDX * 5, pt.y + tangentDY * 5, pt.z + tangentDZ * 5);
          ctx.beginPath();
          ctx.moveTo(pC.screenX, pC.screenY);
          ctx.lineTo(pEnd.screenX, pEnd.screenY);
          ctx.stroke();
        }
      }

      if (params.componentsActive.pairProduction) {
        // V-shaped electron-positron tracks branching off
        ctx.lineWidth = 1;
        const emPos = points[Math.floor(numSteps * 0.4)];
        if (emPos) {
          const pC = project(emPos.x, emPos.y, emPos.z);
          // Electron branch (blue)
          ctx.strokeStyle = "rgba(59, 130, 246, 0.7)"; 
          const pE = project(emPos.x - 2, emPos.y + 3, emPos.z + 4);
          ctx.beginPath(); ctx.moveTo(pC.screenX, pC.screenY); ctx.lineTo(pE.screenX, pE.screenY); ctx.stroke();
          
          // Positron branch (red)
          ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
          const pPos = project(emPos.x + 2, emPos.y - 3, emPos.z + 4);
          ctx.beginPath(); ctx.moveTo(pC.screenX, pC.screenY); ctx.lineTo(pPos.screenX, pPos.screenY); ctx.stroke();
          
          // Gamma ray incident (yellow wavy)
          ctx.strokeStyle = "rgba(253, 224, 71, 0.5)";
          ctx.beginPath();
          for (let j = 0; j < 10; j++) {
            const gy = emPos.y - 4 + j * 0.4;
            const gz = emPos.z - 4 + j * 0.4;
            const gx = emPos.x + Math.sin(j * 1.5) * 0.5;
            const gP = project(gx, gy, gz);
            if (j === 0) ctx.moveTo(gP.screenX, gP.screenY);
            else ctx.lineTo(gP.screenX, gP.screenY);
          }
          ctx.stroke();
        }
      }

      if (params.componentsActive.hadronicShower) {
        // Multiplicity explosion creating a fan of secondary pions
        const emPos = points[Math.floor(numSteps * 0.7)];
        if (emPos) {
          const pC = project(emPos.x, emPos.y, emPos.z);
          ctx.fillStyle = "white";
          ctx.beginPath(); ctx.arc(pC.screenX, pC.screenY, 3, 0, Math.PI * 2); ctx.fill();
          
          for (let i = 0; i < 15; i++) {
            const angleX = (Math.random() - 0.5) * 6;
            const angleY = (Math.random() - 0.5) * 6;
            const pEnd = project(emPos.x + angleX, emPos.y + angleY, emPos.z + 5 + Math.random() * 5);
            ctx.strokeStyle = i % 2 === 0 ? "rgba(16, 185, 129, 0.5)" : "rgba(245, 158, 11, 0.5)"; // alternating green/amber pions
            ctx.lineWidth = Math.random() * 1.5 + 0.5;
            ctx.beginPath(); ctx.moveTo(pC.screenX, pC.screenY); ctx.lineTo(pEnd.screenX, pEnd.screenY); ctx.stroke();
          }
        }
      }

      if (params.componentsActive.neutrinoOscillation) {
        // Ghostly sinusoidal probabilities overlay
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        points.forEach((pt, idx) => {
          const displacement = Math.sin(idx * 0.4) * 3;
          const pN = project(pt.x, pt.y + displacement, pt.z);
          if (idx === 0) ctx.moveTo(pN.screenX, pN.screenY);
          else ctx.lineTo(pN.screenX, pN.screenY);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (params.cosmicRaysActive) {
        // High energy parallel muon flux showering down from space
        ctx.strokeStyle = "rgba(14, 165, 233, 0.4)"; // Sky blue
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 20; i++) {
          const startX = (Math.random() - 0.5) * 40;
          const startZ = (Math.random() - 0.5) * 40;
          const pStart = project(startX, 30, startZ);
          const pEnd = project(startX + (Math.random()-0.5)*2, -30, startZ + (Math.random()-0.5)*2);
          ctx.beginPath(); ctx.moveTo(pStart.screenX, pStart.screenY); ctx.lineTo(pEnd.screenX, pEnd.screenY); ctx.stroke();
        }
      }

      if (params.componentsActive.muonDecay || params.componentsActive.bMesonDecay) {
        // Cascading decay tree with missing energy (neutrinos)
        const emPos = points[Math.floor(numSteps * 0.55)];
        if (emPos) {
           const pC = project(emPos.x, emPos.y, emPos.z);
           // Muon / B-Meson track stops
           ctx.fillStyle = "white";
           ctx.beginPath(); ctx.arc(pC.screenX, pC.screenY, 2.5, 0, Math.PI * 2); ctx.fill();

           // Final state particle 1 (electron/pion)
           ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
           ctx.setLineDash([]);
           ctx.beginPath();
           ctx.moveTo(pC.screenX, pC.screenY);
           const p1 = project(emPos.x + 3, emPos.y - 2, emPos.z + 5);
           ctx.lineTo(p1.screenX, p1.screenY); ctx.stroke();
           
           // Missing energy invisible particles (neutrinos)
           ctx.strokeStyle = "rgba(156, 163, 175, 0.5)"; // gray
           ctx.setLineDash([2, 4]);
           ctx.beginPath();
           ctx.moveTo(pC.screenX, pC.screenY);
           const p2 = project(emPos.x - 4, emPos.y + 3, emPos.z + 4);
           ctx.lineTo(p2.screenX, p2.screenY); ctx.stroke();
           ctx.setLineDash([]);
        }
      }

      if (params.gravitationalLensingActive) {
        // Distort and bend the beam severely along a geodesic curve
        ctx.strokeStyle = "rgba(245, 158, 11, 0.2)"; // Amber gravity well
        for(let r=2; r<10; r+=2) {
          ctx.beginPath();
          for(let th=0; th<Math.PI*2; th+=0.2) {
            const gx = Math.cos(th)*r;
            const gy = Math.sin(th)*r - 5; // offset center
            const p = project(gx, gy, 0);
            if(th===0) ctx.moveTo(p.screenX, p.screenY);
            else ctx.lineTo(p.screenX, p.screenY);
          }
          ctx.stroke();
        }
      }
    };
    drawTrajectory();

    // 5. Draw Experimental Collimator & Targetal Water Matrix boundaries if Experimental Mode is checked
    if (params.experimentalModeActive) {
      const project = viewMode === '2D' ? project2D : project3D;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)"; // Experimental danger bounding rectangle
      ctx.lineWidth = 1;
      const MatrixRad = 11.0;
      const targetCylinderLength = tLenGlobal * 2;
      const pTop = project(-MatrixRad, MatrixRad, -targetCylinderLength/2);
      const pBot = project(MatrixRad, -MatrixRad, targetCylinderLength/2);

      // outer Experimental guide lines
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.rect(pTop.screenX, pTop.screenY, pBot.screenX - pTop.screenX, pBot.screenY - pTop.screenY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw focal alignment laser overlay crosshairs
      if (isLaserGuideActive) {
        ctx.strokeStyle = "rgba(22, 163, 74, 0.6)"; // Experimental alignment green lasers
        ctx.lineWidth = 1;
        ctx.beginPath();
        // horizontal line
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();
        
        ctx.beginPath();
        // vertical line
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.stroke();
      }
    }
  }, [rotateY, rotateX, params, detector, summary, isDarkMode, isFiringParticle, particleProgress, isLaserGuideActive, dimensions, viewMode, time4D, viewPlane]);

  useEffect(() => {
    // Legacy interval firing removed, we now use the single animation frame loop
  }, [params.numberFiredParticles]);

  return (
    <div className="space-y-6 flex flex-col w-full" id="spectroscopy-chamber-tab">
      
      {/* Dynamic 3D spectroscopy chamber lab core */}
      <div className="flex flex-col gap-6 w-full">
        
          {/* Visual 3D Chamber Frame */}
          <div className={`w-full flex flex-col border rounded-xl p-5 shadow-lg relative ${isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"}`}>
            
            {/* Legend moved below canvas to prevent overlap */}
          <div className="absolute top-4 left-4 flex flex-col space-y-1 select-none z-10 pointer-events-none p-3 rounded-xl border backdrop-blur-md bg-slate-900/40 border-white/10 shadow-xl">
            <h3 className={`text-xs font-black tracking-widest uppercase flex items-center space-x-1.5 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
              <Atom className="w-4 h-4 text-orange-500 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Interactive 3D Spectrometer Lab</span>
            </h3>
            <p className="text-[9px] text-slate-400 font-mono">
              Hardware-Accelerated WebGL Rendering
            </p>
          </div>

          {/* Quick guide toggle button */}
          <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
            {params.experimentalModeActive && (
              <button
                onClick={() => setIsLaserGuideActive(!isLaserGuideActive)}
                className={`py-1.5 px-3 border rounded-lg text-[9px] font-mono font-bold uppercase transition flex items-center space-x-2 cursor-pointer shadow-lg backdrop-blur-md ${isLaserGuideActive ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-slate-900/60 border-slate-700/50 text-slate-400 hover:bg-slate-800/80"}`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Collimator Laser Guide</span>
              </button>
            )}
          </div>

          {/* Core Interactive HTML5 Canvas Render Area */}
          <div ref={containerRef} className="w-full flex flex-col items-center justify-center relative mt-6 h-[80vh] min-h-[700px]">
            {/* Time Controls Overlay - Moved inside relative container to prevent blocking lower UI */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-10">
               <div className={`flex items-center space-x-2 p-1.5 rounded-lg border backdrop-blur-md ${isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-white/60 border-slate-200"}`}>
                  <button className="p-1 hover:text-emerald-500 text-slate-400 transition" title="Slow Motion">
                     <Atom className="w-3.5 h-3.5 animate-spin-slow" />
                  </button>
                  <button className="p-1 hover:text-emerald-500 text-slate-400 transition" title="Rewind">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19l-7-7 7-7"/><path d="M22 19l-7-7 7-7"/></svg>
                  </button>
                  <button className="p-1 text-emerald-500 transition" title="Play">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>
                  </button>
                  <button className="p-1 hover:text-emerald-500 text-slate-400 transition" title="Pause">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  </button>
                  <div className="flex-1 w-32 px-2">
                     <div className="h-1 bg-slate-700/50 rounded-full w-full relative">
                        <div className="absolute top-0 left-0 bg-emerald-500 h-1 rounded-full" style={{ width: `${particleProgress * 100}%` }}></div>
                     </div>
                  </div>
                  <button className="p-1 hover:text-orange-500 text-slate-500 transition" title="Event Bookmark">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  </button>
               </div>
            </div>

            <div className="absolute inset-0 block w-full h-full rounded-lg overflow-hidden">
              <LabScene3D
                params={params}
                summary={summary}
                detector={detector}
                isDarkMode={isDarkMode}
                isFiringParticle={isFiringParticle}
                particleProgress={particleProgress}
              />
            </div>
            
            {/* Realtime flashing laser guides alert box during active beamline firing */}
            {isFiringParticle && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none py-1.5 px-3 bg-red-600/15 border border-red-500/30 rounded text-red-500 font-mono text-[10px] animate-pulse flex items-center space-x-1">
                <Radiation className="w-3.5 h-3.5 animate-spin" />
                <span>BEAM ACTIVE – RADIATION TRACK ACTIVE</span>
              </div>
            )}
          </div>

          {/* Chamber Shape Legend (Moved from top to prevent overlap) */}
          <div className={`mt-2 flex flex-wrap justify-center gap-3 px-4 py-2 rounded-lg border ${isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center space-x-4 text-[10px] font-mono">
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500/50 border border-purple-400"></div>
                <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>Pixel Tracker</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500/50 border border-blue-400"></div>
                <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>TPC/Drift</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-400"></div>
                <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>ECAL</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-cyan-500/50 border border-cyan-400"></div>
                <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>Cherenkov Light</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-400"></div>
                <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>Beam Track</span>
              </div>
            </div>
          </div>

          {/* Chamber diagnostics overview console */}
          <div className="w-full mt-4 border-t border-slate-100/10 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`p-2.5 rounded border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="text-[9px] text-slate-500 font-mono uppercase font-bold flex items-center space-x-1">
                <Wind className="w-3 h-3 text-cyan-500" />
                <span>Containment Vacuum</span>
              </div>
              <div className="text-xs font-mono font-bold mt-1 text-slate-300 dark:text-slate-100">
                {vacuumLevel.toExponential(3)} Torr
              </div>
            </div>

            <div className={`p-2.5 rounded border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="text-[9px] text-slate-500 font-mono uppercase font-bold flex items-center space-x-1">
                <Thermometer className="w-3 h-3 text-red-500" />
                <span>Cryo Chamber Temp</span>
              </div>
              <div className="text-xs font-mono font-bold mt-1 text-slate-300 dark:text-slate-100">
                {chamberTempK.toFixed(2)} K
              </div>
            </div>

            <div className={`p-2.5 rounded border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="text-[9px] text-slate-500 font-mono uppercase font-bold flex items-center space-x-1">
                <Atom className="w-3 h-3 text-orange-500" />
                <span>Frank-Tamm Threshold</span>
              </div>
              <div className="text-xs font-mono font-bold mt-1 text-slate-300 dark:text-slate-100">
                {summary.cherenkovThresholdEnergyMeV.toFixed(3)} MeV
              </div>
            </div>

            <div className={`p-2.5 rounded border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="text-[9px] text-slate-500 font-mono uppercase font-bold flex items-center space-x-1">
                <Compass className="w-3 h-3 text-emerald-500" />
                <span>Refractive Index</span>
              </div>
              <div className="text-xs font-mono font-bold mt-1 text-slate-300 dark:text-slate-100 text-orange-400">
                {summary.betaThreshold > 0 ? (1.0 / summary.betaThreshold).toFixed(3) : "1.000"}
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Control Center */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Diagnostic Console panel */}
          <div className={`border p-6 rounded-xl shadow-lg flex flex-col ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100/10 pb-2 flex items-center space-x-1.5">
              <span>Chamber Action Console</span>
            </h3>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Drag on the viewport on the left to rotate. Trigger calibrated beam pulses in real-time to analyze physical dispersion tracks and Cherenkov angles on the silicon face.
              </p>

              {/* Fire Pulse Primary Action */}
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleFirePulse}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition shadow-lg cursor-pointer ${isFiringParticle ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-orange-600 hover:bg-orange-550 shadow-orange-500/15'}`}
                >
                  {isFiringParticle ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      <span>Stop Collision Sequence</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white animate-pulse" />
                      <span>Inject Calibrated Beam Pulse</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => generateScientificReportPdf(summary, params, detector, "Simulation_Report.pdf")}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-100 transition shadow-lg cursor-pointer bg-slate-800 hover:bg-slate-700 shadow-slate-900/15 border border-slate-600/50`}
                >
                  <FileDown className="w-4 h-4 text-cyan-400" />
                  <span>Export Scientific PDF</span>
                </button>
              </div>

              {/* Radiation Safety alert status */}
              <div className={`p-4 border rounded-xl flex items-start space-x-3 text-left ${isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Radiological Active Safe-watch</h4>
                  <p className="text-[11px] font-sans text-slate-500 leading-snug mt-1 font-semibold text-orange-500 dark:text-orange-400">
                    {summary.radSafetyClassification}
                  </p>
                </div>
              </div>
              
              {/* Photon Fluence / Area Intensity report metrics */}
              <div className={`p-4 border rounded-xl ${isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-150"}`}>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 mb-2 font-mono">
                  <span>Fluor Fluence</span>
                  <span className="text-cyan-500">{summary.fluencePhotonsPerMm2.toLocaleString()} ph/mm²</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-1.5 rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (summary.fluencePhotonsPerMm2 / 50000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Experimental Matrix diagnostics parameters overlay indices */}
              {params.experimentalModeActive && (
                <div className="border border-green-500/20 bg-green-500/5 p-4 rounded-xl space-y-2 text-left">
                  <h4 className="text-[10px] uppercase font-bold text-green-400 tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <span>🏥 Collimator Alignment Active</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-slate-400 mt-2">
                    <div>
                      <span className="block opacity-70">Target Profile:</span>
                      <span className="font-bold text-slate-100 uppercase text-[11px]">{(params.experimentalApplication || "").replace("_", " ")}</span>
                    </div>
                    <div>
                      <span className="block opacity-70">Fluence Accuracy Deviation:</span>
                      <span className="font-bold text-green-400 text-[11px]">± {summary.experimentalFluencePercentError} %</span>
                    </div>
                  </div>
                  <p className="text-[10px] italic text-slate-500 mt-1">
                    Nanoparticle density allows sub-millimeter target dosimetry accuracy feedback.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Quick interactive chamber temperature calibration */}
          <div className={`border p-5 rounded-xl shadow-md ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <span>Chamber Cryogenic Gas Temperature</span>
              <span className="text-orange-500 font-mono">{chamberTempK.toFixed(1)} K</span>
            </label>
            <input
              type="range"
              min="4.2" // Liquid Helium
              max="350.0"
              step="1"
              value={chamberTempK}
              onChange={(e) => setChamberTempK(parseFloat(e.target.value) || 293.15)}
              className="w-full accent-orange-500  cursor-pointer h-1.5 bg-slate-800 rounded-lg focus:outline-none"
            />
            <div className="flex justify-between text-[8.5px] font-mono text-slate-500 mt-1">
              <span>4.2K (LHe Boiling)</span>
              <span>77.3K (LN2)</span>
              <span>293.1K (Room Temp)</span>
            </div>
          </div>

          {/* ADVANCED MULTI-INSTRUMENT CONTROL CONSOLE */}
          <div className={`border p-5 rounded-xl shadow-lg space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="border-b border-slate-100/10 pb-2">
              <h4 className="text-[10px] uppercase font-black text-orange-500 tracking-wider flex items-center space-x-1.5">
                <span>🛰️ Scientific Instrumentation suite</span>
              </h4>
              <p className="text-[9px] text-slate-500 mt-0.5">Control auxiliary telemetry & detection instruments</p>
            </div>

            <div className="space-y-3">
              {/* Instrument 1: Silicon Microstrip Readout Tracker */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide">
                    1. Microstrip Tracker Readout
                  </span>
                  <input
                    type="checkbox"
                    checked={isTrackerActive}
                    onChange={(e) => setIsTrackerActive(e.target.checked)}
                    className="accent-orange-500 h-3.5 w-3.5 rounded cursor-pointer"
                  />
                </div>
                {isTrackerActive ? (
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-400">
                    <div>
                      <span className="block text-[8px] opacity-70 uppercase">Clock Gate delay:</span>
                      <span className="text-slate-100 font-bold">{detector.pixelDeadTimeNs || 25} ns</span>
                    </div>
                    <div>
                      <span className="block text-[8px] opacity-70 uppercase">Channel Noise floor:</span>
                      <span className="text-orange-400 font-bold">{detector.noiseRmsKeV ? detector.noiseRmsKeV.toFixed(2) : "0.15"} keV</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[8.5px] text-red-500 italic font-mono block">Strip logic high-impedance standby (Sleep)</span>
                )}
              </div>

              {/* Instrument 2: Peltier cooling loop */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center text-[9.5px]">
                  <span className="font-bold text-slate-300 uppercase tracking-wide">
                    2. Peltier Cryo-Pump wattage
                  </span>
                  <span className="text-orange-400 font-mono font-bold">{peltierCoolingW} W</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={peltierCoolingW}
                  onChange={(e) => setPeltierCoolingW(parseInt(e.target.value) || 0)}
                  className="w-full accent-orange-500 h-1 bg-slate-800 rounded cursor-pointer animate-none"
                />
                <div className="grid grid-cols-2 gap-1 text-[8.5px] font-mono text-slate-500">
                  <span>Power Extraction Limit: 150W</span>
                  <span className="text-right">K_peltier: 1.34 W/K</span>
                </div>
              </div>

              {/* Instrument 3: Scintillation Crystal Calorimeter */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide">
                    3. Scintillation Calorimeter
                  </span>
                  <button
                    onClick={() => setIsCalorimeterGated(!isCalorimeterGated)}
                    className={`px-1.5 py-0.5 border rounded text-[8px] font-bold uppercase cursor-pointer ${isCalorimeterGated ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" : "bg-slate-800 border-slate-700 text-slate-500"}`}
                  >
                    {isCalorimeterGated ? "Gated-Lock" : "Un-Gated"}
                  </button>
                </div>
                {isCalorimeterGated ? (
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-400">
                    <div>
                      <span className="block text-[8px] opacity-70 uppercase">Peak absorbed:</span>
                      <span className="text-cyan-400 font-bold">{(params.beamEnergyMeV * (params.numberFiredParticles || 10) / 1000).toFixed(3)} GeV</span>
                    </div>
                    <div>
                      <span className="block text-[8px] opacity-70 uppercase">Visible photons:</span>
                      <span className="text-slate-150 font-bold">{(params.beamEnergyMeV * 40).toLocaleString()} ph/MeV</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[8.5px] text-orange-500 italic font-mono block">Data integration bypassed (Self-noise)</span>
                )}
              </div>

              {/* Instrument 4: Active Faraday Cup Integrator */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide">
                    4. Faraday Cup Integrator
                  </span>
                  <span className={`h-2 w-2 rounded-full ${isFaradayIntegratorArmed ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-400">
                  <div>
                    <span className="block text-[8px] opacity-70 uppercase">Beam Current:</span>
                    <span className="text-emerald-400 font-bold">{(params.intensityFlux * 1.6e-19).toExponential(2)} A</span>
                  </div>
                  <div>
                    <span className="block text-[8px] opacity-70 uppercase">Charge collected:</span>
                    <span className="text-slate-100 font-bold">{(params.numberFiredParticles || 10 * params.beamCharge).toFixed(1)} e</span>
                  </div>
                </div>
              </div>

              {/* Instrument 5: Magnetic Field Control */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide">
                    5. Solenoid B-Field
                  </span>
                  <span className="text-purple-400 font-mono font-bold">{magneticFieldStrength.toFixed(2)} T</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={magneticFieldStrength}
                  onChange={(e) => setMagneticFieldStrength(parseFloat(e.target.value) || 0)}
                  className="w-full accent-purple-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
                <div className="text-[8.5px] font-mono text-slate-500">
                  Lorentz force: F = q(v × B)
                </div>
              </div>

              {/* Instrument 6: Electric Field Control */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide">
                    6. Acceleration E-Field
                  </span>
                  <span className="text-blue-400 font-mono font-bold">{electricFieldStrength.toFixed(1)} kV/m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={electricFieldStrength}
                  onChange={(e) => setElectricFieldStrength(parseFloat(e.target.value) || 0)}
                  className="w-full accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
                <div className="text-[8.5px] font-mono text-slate-500">
                  Acceleration: a = qE/m
                </div>
              </div>

              {/* Instrument 7: Beam Focus Control */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide">
                    7. Beam Spot Size
                  </span>
                  <span className="text-amber-400 font-mono font-bold">{beamFocusSpotSize.toFixed(1)} μm</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={beamFocusSpotSize}
                  onChange={(e) => setBeamFocusSpotSize(parseFloat(e.target.value) || 10)}
                  className="w-full accent-amber-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
                <div className="text-[8.5px] font-mono text-slate-500">
                  FWHM Gaussian profile
                </div>
              </div>

              {/* Instrument 8: Beam Divergence Control */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide">
                    8. Beam Divergence
                  </span>
                  <span className="text-pink-400 font-mono font-bold">{beamDivergence.toFixed(2)} mrad</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={beamDivergence}
                  onChange={(e) => setBeamDivergence(parseFloat(e.target.value) || 0.5)}
                  className="w-full accent-pink-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
                <div className="text-[8.5px] font-mono text-slate-500">
                  Angular spread
                </div>
              </div>

              {/* Instrument 9: Vacuum Pressure Control */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide">
                    9. Chamber Pressure
                  </span>
                  <span className="text-cyan-400 font-mono font-bold">{pressureTorr.toExponential(2)} Torr</span>
                </div>
                <input
                  type="range"
                  min="1e-9"
                  max="760"
                  step={1e-9}
                  value={pressureTorr}
                  onChange={(e) => setPressureTorr(parseFloat(e.target.value) || 1e-9)}
                  className="w-full accent-cyan-500 h-1 bg-slate-800 rounded cursor-pointer"
                  style={{ direction: 'rtl' }}
                />
                <div className="text-[8.5px] font-mono text-slate-500">
                  High vacuum → Atmospheric
                </div>
              </div>

              {/* Instrument 10: Detector Gain Control */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide">
                    10. Detector Gain
                  </span>
                  <span className="text-green-400 font-mono font-bold">{detectorGain.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={detectorGain}
                  onChange={(e) => setDetectorGain(parseFloat(e.target.value) || 1.0)}
                  className="w-full accent-green-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
                <div className="text-[8.5px] font-mono text-slate-500">
                  Signal amplification
                </div>
              </div>

              {/* Instrument 11: Trigger Threshold Control */}
              <div className="p-2.5 rounded-lg border border-slate-100/10 bg-slate-950/40 space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide">
                    11. Trigger Threshold
                  </span>
                  <span className="text-red-400 font-mono font-bold">{triggerThreshold.toFixed(1)} keV</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={triggerThreshold}
                  onChange={(e) => setTriggerThreshold(parseFloat(e.target.value) || 5)}
                  className="w-full accent-red-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
                <div className="text-[8.5px] font-mono text-slate-500">
                  Energy discrimination
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
