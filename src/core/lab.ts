/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { Rng } from "./rng";

/**
 * Geometric-optics model of one radiator block, used by the 3D Chamber Lab view.
 *
 * Frame: z is the beam axis, the block spans z in [0, thickness] and x, y in [-half, +half].
 * Photons are emitted uniformly along the track inside the radiator, on a cone of half-angle
 * thetaC around +z with uniform azimuth. Each ray is followed in straight lines; at a face it either
 * leaves (n sin(incidence) < 1, no Fresnel reflection) or is totally internally reflected.
 * Rays that leave through the downstream face (z = thickness) are the ones a detector placed there
 * would see. Scattering, absorption and chromatic spread are not modelled here; the mean angle is used.
 */

export type RayFate = "detector" | "side" | "upstream" | "trapped";

export interface LabRay {
  /** Polyline, mm: emission point, any reflection points, and the exit point (or last point if trapped). */
  points: [number, number, number][];
  fate: RayFate;
}

export interface LabModel {
  thicknessMm: number;
  halfWidthMm: number;
  emissionMm: number;
  thetaCDeg: number;
  criticalAngleDeg: number;
  /** True when thetaC exceeds the critical angle of the downstream face: all primary rays are trapped there. */
  trappedAtBackFace: boolean;
  rays: LabRay[];
  detectorFraction: number;
}

const MAX_BOUNCES = 8;

export function buildLabModel(
  thetaCDeg: number,
  refractiveIndex: number,
  thicknessMm: number,
  emissionMm: number,
  generated: boolean,
  rayCount: number,
  seed: number
): LabModel {
  const halfWidthMm = Math.max(15, thicknessMm * 0.75);
  const emission = Math.min(Math.max(emissionMm, 0), thicknessMm);
  const criticalAngleDeg = refractiveIndex > 1 ? (Math.asin(1 / refractiveIndex) * 180) / Math.PI : 90;
  const model: LabModel = {
    thicknessMm,
    halfWidthMm,
    emissionMm: emission,
    thetaCDeg,
    criticalAngleDeg,
    trappedAtBackFace: generated && thetaCDeg > criticalAngleDeg,
    rays: [],
    detectorFraction: 0,
  };
  if (!generated || !(thetaCDeg > 0)) return model;

  const rng = new Rng(seed);
  const th = (thetaCDeg * Math.PI) / 180;
  const sinT = Math.sin(th);
  const cosT = Math.cos(th);
  // A face lets a ray out when cos(incidence) > sqrt(1 - 1/n^2)
  const escapeCos = Math.sqrt(Math.max(0, 1 - 1 / (refractiveIndex * refractiveIndex)));
  let detected = 0;

  for (let i = 0; i < rayCount; i++) {
    const phi = 2 * Math.PI * rng.uniform();
    let p: [number, number, number] = [0, 0, emission * rng.uniform()];
    const d: [number, number, number] = [sinT * Math.cos(phi), sinT * Math.sin(phi), cosT];
    const points: [number, number, number][] = [[p[0], p[1], p[2]]];
    let fate: RayFate = "trapped";

    for (let b = 0; b <= MAX_BOUNCES; b++) {
      // Distance to each face along the ray
      const tx = d[0] > 0 ? (halfWidthMm - p[0]) / d[0] : d[0] < 0 ? (-halfWidthMm - p[0]) / d[0] : Infinity;
      const ty = d[1] > 0 ? (halfWidthMm - p[1]) / d[1] : d[1] < 0 ? (-halfWidthMm - p[1]) / d[1] : Infinity;
      const tz = d[2] > 0 ? (thicknessMm - p[2]) / d[2] : d[2] < 0 ? (0 - p[2]) / d[2] : Infinity;
      const t = Math.min(tx, ty, tz);
      p = [p[0] + d[0] * t, p[1] + d[1] * t, p[2] + d[2] * t];
      points.push([p[0], p[1], p[2]]);
      const axis = t === tz ? 2 : t === tx ? 0 : 1;
      if (Math.abs(d[axis]) > escapeCos) {
        fate = axis === 2 ? (d[2] > 0 ? "detector" : "upstream") : "side";
        break;
      }
      d[axis] = -d[axis];
    }
    if (fate === "detector") detected++;
    model.rays.push({ points, fate });
  }
  model.detectorFraction = model.rays.length ? detected / model.rays.length : 0;
  return model;
}

/** Rotate then perspective-project a point; returns screen coords (unit scale) and depth. */
export function project(
  p: [number, number, number],
  yawRad: number,
  pitchRad: number
): { x: number; y: number; depth: number } {
  // Centre the model on the origin before rotating: caller passes already-centred points.
  const cy = Math.cos(yawRad);
  const sy = Math.sin(yawRad);
  const x1 = p[0] * cy + p[2] * sy;
  const z1 = -p[0] * sy + p[2] * cy;
  const cp = Math.cos(pitchRad);
  const sp = Math.sin(pitchRad);
  const y2 = p[1] * cp - z1 * sp;
  const z2 = p[1] * sp + z1 * cp;
  return { x: x1, y: y2, depth: z2 };
}
