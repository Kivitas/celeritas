import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Grid, Float, Sphere } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { SimulationParams, SimulationSummary, DetectorSettings } from "../types";

interface LabScene3DProps {
  params: SimulationParams;
  summary: SimulationSummary;
  detector: DetectorSettings;
  isDarkMode: boolean;
  isFiringParticle: boolean;
  particleProgress: number; // 0 to 1
}

// 1. CERN-Style Collider Event
const ColliderEvent = ({ params, isFiringParticle, particleProgress }: any) => {
  const activeComps = params.componentsActive || {};
  
  // Base tracks, plus a massive shower if hadronicShower is enabled
  const numTracks = activeComps.hadronicShower ? 120 : 40; 
  
  const tracks = useMemo(() => {
    const trks = [];
    const bField = params.magneticFieldTesla || params.magneticFieldT || 0.0;
    
    for (let i = 0; i < numTracks; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      const charge = Math.random() > 0.5 ? 1 : -1;
      const actualCharge = Math.random() > 0.8 ? 0 : charge; 
      
      const pts = [];
      const numSteps = 60;
      const maxRadius = 35; 
      
      let x = 0, y = 0, z = 0;
      let vx = Math.sin(phi) * Math.cos(theta);
      let vy = Math.sin(phi) * Math.sin(theta);
      let vz = Math.cos(phi);
      
      const p = 0.5 + Math.random() * 1.5;
      vx *= p; vy *= p; vz *= p;
      
      // Determine particle type based on toggles
      let particleType = "standard";
      let trackColor = actualCharge > 0 ? "#ff3366" : actualCharge < 0 ? "#3b82f6" : "#22c55e";
      
      // Inject specialized particles if toggled
      if (activeComps.primaryCherenkov && Math.random() > 0.85) {
        particleType = "cherenkov";
        trackColor = "#00ffff"; // Bright Cyan
      } else if (activeComps.bremsstrahlung && actualCharge === 0 && Math.random() > 0.8) {
        particleType = "photon";
        trackColor = "#eab308"; // Amber/Yellow
      } else if (activeComps.pairProduction && Math.random() > 0.9) {
        particleType = "pair";
        trackColor = "#a855f7"; // Purple
      }
      
      for (let step = 0; step <= numSteps; step++) {
        pts.push(new THREE.Vector3(x, y, z));
        
        const dt = maxRadius / numSteps;
        // Only charged particles bend
        if (actualCharge !== 0 && particleType !== "photon") {
          const ax = actualCharge * bField * vy * 0.1;
          const ay = -actualCharge * bField * vx * 0.1;
          vx += ax * dt;
          vy += ay * dt;
        }
        
        x += vx * dt;
        y += vy * dt;
        z += vz * dt;
        
        if (Math.sqrt(x*x + y*y + z*z) > maxRadius) break;
      }
      
      trks.push({ points: pts, color: trackColor, isNeutral: actualCharge === 0 && particleType !== "cherenkov" });
    }
    return trks;
  }, [params.magneticFieldTesla, params.magneticFieldT, activeComps]);

  if (!isFiringParticle) return null;

  return (
    <group>
      {/* Collision Point Flash */}
      <Sphere args={[0.8, 16, 16]}>
        <meshStandardMaterial emissive="#ffffff" emissiveIntensity={10} color="#ffffff" toneMapped={false} />
      </Sphere>
      <pointLight color="#ffffff" intensity={20} distance={20} />

      {/* Particle Tracks */}
      {tracks.map((trk, i) => {
        // Animate tracks shooting outwards
        const displayPts = trk.points.slice(0, Math.max(2, Math.floor(particleProgress * trk.points.length)));
        return (
          <Line 
            key={`track-${i}`} 
            points={displayPts} 
            color={trk.color} 
            lineWidth={trk.isNeutral ? 1 : 2} 
            transparent 
            opacity={trk.isNeutral ? 0.3 : 0.7} 
          />
        );
      })}
    </group>
  );
};

// 2. Centered Subsystem Layers (CERN Barrel Geometry)
const SubsystemLayers = ({ activeSubsystems }: any) => {
  const layers = [
    { id: 'pixelTracker', active: activeSubsystems?.pixelTracker, r: 6, l: 40, color: "#a855f7", segments: 8 },
    { id: 'stripTracker', active: activeSubsystems?.stripTracker, r: 8, l: 50, color: "#d946ef", segments: 8 },
    { id: 'tpc', active: activeSubsystems?.tpc, r: 12, l: 60, color: "#3b82f6", segments: 12 },
    { id: 'driftChamber', active: activeSubsystems?.driftChamber, r: 14, l: 60, color: "#0ea5e9", segments: 12 },
    { id: 'rich', active: activeSubsystems?.rich, r: 16, l: 70, color: "#ec4899", segments: 16 },
    { id: 'ecal', active: activeSubsystems?.ecal, r: 20, l: 70, color: "#22c55e", segments: 16 },
    { id: 'hcal', active: activeSubsystems?.hcal, r: 24, l: 80, color: "#eab308", segments: 24 },
    { id: 'muonSpectrometer', active: activeSubsystems?.muonSpectrometer, r: 30, l: 90, color: "#f97316", segments: 24 },
  ];

  return (
    <group>
      {layers.map((layer, i) => {
        if (!layer.active) return null;
        return (
          <group key={`subsystem-${i}`}>
            {/* Segmented Wireframe (Realistic Detector Struts) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[layer.r, layer.r, layer.l, layer.segments, 1, false]} />
              <meshBasicMaterial 
                color={layer.color} 
                wireframe 
                transparent 
                opacity={0.15} 
                toneMapped={false}
              />
            </mesh>
            {/* Faint Energy Shell */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[layer.r, layer.r, layer.l, layer.segments, 1, false]} />
              <meshBasicMaterial 
                color={layer.color} 
                transparent 
                opacity={0.03} 
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export default function LabScene3D({ params, summary, detector, isDarkMode, isFiringParticle, particleProgress }: LabScene3DProps) {
  return (
    <Canvas camera={{ position: [50, 40, 60], fov: 45 }}>
      {/* Pure color background to optimize rendering and remove expensive environment/stars */}
      <color attach="background" args={[isDarkMode ? '#000000' : '#f1f5f9']} />
      
      {/* Dynamic Grid Floor */}
      <Grid 
        position={[0, -35, 0]} 
        args={[300, 300]} 
        cellColor={isDarkMode ? "#00ffff" : "#94a3b8"} 
        sectionColor={isDarkMode ? "#00ffff" : "#cbd5e1"} 
        cellThickness={isDarkMode ? 0.2 : 1}
        sectionThickness={isDarkMode ? 0.5 : 1.5}
        fadeDistance={150} 
      />

      {/* Controls */}
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={10} maxDistance={200} autoRotate={!isFiringParticle} autoRotateSpeed={0.5} />
      
      {/* Lighting */}
      <ambientLight intensity={isDarkMode ? 0.2 : 1.0} />
      <pointLight position={[-20, -20, -20]} intensity={isDarkMode ? 2 : 0.5} color="#00d4ff" />
      <pointLight position={[20, 30, 20]} intensity={2} color="#a855f7" />
      
      {/* Collider Geometry */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <ColliderEvent 
          params={params} 
          isFiringParticle={isFiringParticle} 
          particleProgress={particleProgress} 
        />
        <SubsystemLayers activeSubsystems={params.detectorSubsystems} />
      </Float>

      {/* Post Processing for Glow */}
      {isDarkMode && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.2} />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.001, 0.001)} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
