/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/**
 * Seedable 32-bit pseudo-random generator: xoshiro128** (Blackman and Vigna), seeded by splitmix32.
 * Deterministic for a given seed. Not for cryptography. Only src/core may use it for simulation.
 */
export class Rng {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number) {
    // splitmix32 to expand one seed into four non-zero words.
    let x = seed >>> 0;
    const next = () => {
      x = (x + 0x9e3779b9) >>> 0;
      let z = x;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
      return (z ^ (z >>> 16)) >>> 0;
    };
    this.s0 = next();
    this.s1 = next();
    this.s2 = next();
    this.s3 = next();
    if ((this.s0 | this.s1 | this.s2 | this.s3) === 0) this.s0 = 1;
  }

  private rotl(x: number, k: number): number {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
  }

  /** Next 32-bit unsigned integer. */
  nextU32(): number {
    const result = Math.imul(this.rotl(Math.imul(this.s1, 5) >>> 0, 7), 9) >>> 0;
    const t = (this.s1 << 9) >>> 0;
    this.s2 = (this.s2 ^ this.s0) >>> 0;
    this.s3 = (this.s3 ^ this.s1) >>> 0;
    this.s1 = (this.s1 ^ this.s2) >>> 0;
    this.s0 = (this.s0 ^ this.s3) >>> 0;
    this.s2 = (this.s2 ^ t) >>> 0;
    this.s3 = this.rotl(this.s3, 11);
    return result;
  }

  /** Uniform in [0, 1). Uses 32 bits, so the resolution is 2^-32. */
  uniform(): number {
    return this.nextU32() / 4294967296;
  }

  /** Poisson variate with mean mu (Knuth for small mu, normal approximation above 30). */
  poisson(mu: number): number {
    if (!(mu > 0)) return 0;
    if (mu > 30) {
      // Box-Muller normal approximation; adequate for the large-mean case used here.
      const u1 = Math.max(this.uniform(), 1e-12);
      const u2 = this.uniform();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return Math.max(0, Math.round(mu + Math.sqrt(mu) * z));
    }
    const L = Math.exp(-mu);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.uniform();
    } while (p > L);
    return k - 1;
  }
}
