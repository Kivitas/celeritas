# Physics model

This document describes every model the simulator computes, the assumptions it makes, the range where it is
expected to hold, and what is not modelled. Each function named here is in `src/core/`. Reference values and
their sources are in `validation/references.json`, and the current comparison is in `validation/report.md`.

## 1. Kinematics (`src/core/kinematics.ts`)

Kinetic energy T, rest mass m, γ = 1 + T/m, β = v/c.

- β = √(T(T + 2m)) / (T + m). No clamp; β → 1 smoothly.
- δ = 1 − β = 1 / (γ²(1 + β)). Computed from T directly, so δ stays precise when β is close to 1.
- Momentum p = √(T² + 2Tm).
- Cherenkov threshold kinetic energy: E_thr = m(γ_thr − 1), γ_thr = n / √(n² − 1). No threshold when n ≤ 1.
- Larmor radius ρ [m] = p[GeV/c] / (0.3 B[T]).
- Synchrotron critical energy ε_c [keV] = 665 E²[GeV] B[T]. Displayed only as a formula; synchrotron emission is not simulated.

Particle masses are in `src/data/particles.ts`. Verified (PDG 2026): electron, muon, π±, K±, proton, neutron,
deuteron, and the atomic mass unit. Not verified: alpha and bare carbon-12 nucleus (flagged in the table).

## 2. Frank-Tamm emission (`src/core/cherenkov.ts`, `src/core/simulate.ts`)

Photons per unit path length and per unit wavelength for a unit-charge particle (PDG 2026 review,
"Passage of particles through matter"; Frank and Tamm 1937):

    d²N / (dx dλ) = (2π α / λ²) sin²θ_c,     sin²θ_c = 1 − 1/(β²n²)

- sin²θ_c is evaluated as (x − 1)(x + 1)/x² with x = βn, x − 1 = (n − 1) − nδ, so it stays precise near β = 1.
  It is zero below threshold (x ≤ 1).
- Each wavelength bin [λ − w/2, λ + w/2] is integrated exactly in 1/λ² with n held at the bin centre.
  This converges to the analytic integral as the bins narrow (test: 0.1% at 10 nm and 1 nm bins, constant index).
- The emitted yield is the sum over bins of 2πα dx sin²θ_c (1/λ_lo − 1/λ_hi) Z².
- Angle statistics are weighted by the emitted yield. The mean angle and its chromatic spread are reported.
- Threshold energy is reported at the 500 nm reference index, and as a band over the spectral range.

**Assumptions.** Single slab; emission from the track length inside the radiator, L = min(track, thickness).
Z² scaling. Refractive index from the material's dispersion (Sellmeier), with a linear temperature term
n(T) = n_ref + (dn/dT)(T − 293.15 K). The temperature coefficient is one global value (−1.4e-4 K⁻¹) for every
material; this is wrong for fused silica, whose coefficient is positive. Per-material coefficients are not yet sourced.

## 3. Energy loss (`src/core/stopping.ts`)

Collision mass stopping power, MeV g⁻¹ cm², with K = 4π N_A r_e² m_e c² = 0.307075 MeV mol⁻¹ cm² (PDG 2026):

- Electrons and positrons (Møller form, PDG Eq. 34.23, density effect δ = 0):
      S = K (Z/A)(1/2β²) [ ln( m β²γ² (m(γ−1)/2) / I² ) + (1−β²) − ((2γ−1)/γ²) ln2 + (1/8)((γ−1)/γ)² ]
- Heavy particles (Bethe, PDG Eq. 34.5, δ = 0): S = K z²(Z/A)(1/β²)[ ½ ln(2 m β²γ² W_max / I²) − β² ], with
  W_max from PDG Eq. 34.4. Valid for 0.1 < βγ < 1000 to a few percent (PDG).

Water: Z/A = 0.55509 mol g⁻¹ (PDG 2026), I = 75.0 eV (NIST ESTAR convention; PDG gives 79.7 eV), density 1.000 g cm⁻³.

The particle is stepped through the slab, losing energy at 0.5% of its kinetic energy per step. Each step emits at its
own sin²θ_c and is attenuated from its emission point to the exit face.

**Validation against NIST (fetched 2026-11-17)**

| Quantity | Model | NIST | Deviation |
|---|---|---|---|
| Electron collision stopping power, 0.5 MeV | 2.034 | 2.034 (ESTAR) | 0.01% |
| Electron collision stopping power, 1 MeV | 1.873 | 1.849 | +1.3% |
| Electron collision stopping power, 2 MeV | 1.897 | 1.824 | +4.0% (known limitation) |
| Electron CSDA range, 0.5 MeV | 0.1770 g/cm² | 0.1766 | +0.2% |
| Electron CSDA range, 1 MeV | 0.4370 g/cm² | 0.4367 | +0.07% |
| Proton CSDA range, 100 MeV | 7.679 g/cm² | 7.718 (PSTAR) | −0.5% |
| Proton CSDA range, 200 MeV | 25.92 g/cm² | 25.96 (PSTAR) | −0.2% |

**Not modelled.** The density effect (no sourced water parameters; electron stopping is overestimated by 4% at 2 MeV
and 13% at 10 MeV). Radiative losses for electrons (ESTAR total ranges include them; the model's ranges are collision-only).
Shell and Barkas corrections. Energy straggling and multiple scattering. Materials other than water have no stopping
data; for them the particle keeps its initial speed and the output says `energyLossModelled: false`.

## 4. Dispersion (`src/core/dispersion.ts`)

n²(λ) = 1 + Σᵢ Bᵢ λ² / (λ² − Cᵢ), λ in µm, Cᵢ in µm², up to four terms (Malitson 1965 convention).

Sourced materials (dispersion only): fused silica (Malitson 1965, three terms), N-BK7 (SCHOTT), CaF₂ (Malitson 1963),
sapphire, ordinary ray (Malitson 1962), MgF₂, ordinary ray (Dodge 1984), LiF (Li 1976), liquid water (Daimon and
Masumura 2007, four terms), and PMMA (Sultanova et al. 2009, one term). Every other material is hidden by default in the
UI; its coefficients are not sourced.

**Validity.** Each fit is valid only over the range quoted with its source (for example 0.21–6.7 µm for fused silica).
Outside the range the formula is not checked.

## 5. Absorption and transport (`src/core/transport.ts`)

For water, absorption is taken from Hale and Querry (1973) at 25 °C, k converted to α = 4πk/λ. The table covers 400–650 nm.
Outside that range the endpoint value is used, which is not sourced. Pope and Fry (1997) could not be obtained.

Transmission from emission point x to the exit face d: exp(−α(d − x)), averaged over the emission weights.

For materials without an absorption table, a diffusion-based approximation is used (`getMediumCoefficients`). Its
coefficients are not sourced and it models turbid media, not clear radiators. Those transmissions should not be trusted.

## 6. Detector (`src/core/simulate.ts`)

- Detected photons = emitted × transmission × quantum efficiency × (1 − dead-time fraction).
- Quantum efficiency and dark-count rate are user inputs. No detector model is sourced yet.
- Signal-to-noise ratio S / √(S + B), where S is detected photons per run and B is dark counts per run.

## 7. Monte Carlo (`src/core/monteCarlo.ts`, `src/core/rng.ts`)

A photon-level sampler on the same bins and energy-loss steps. Photon counts per step are Poisson; each photon is
attenuated and detected with the probabilities above. Seeded (xoshiro128**), so the same seed reproduces the result.
It agrees with the analytic engine within four standard errors (tested). Not yet modelled: scattering, delta rays,
Fresnel and total internal reflection at the exit face, angular distributions.

## 8. Beta spectra (`src/core/betaSpectrum.ts`)

Endpoints and mean energies from ENSDF (NuDat 3, read 2026-11-17): Sr-90 545.9 keV (mean 195.7 keV), Y-90 2278.5 keV
(mean 932.4 keV), Cs-137 513.97 keV.

Spectrum shape: allowed transition without the Fermi function, N(E) ∝ p E (E₀ − E)².

**Known errors.** Sr-90 is a first-forbidden unique transition, so its mean is about 29% high in this shape. Y-90
(Z = 39) needs the Fermi function, and its mean is about 16% high. The spectrum-averaged yields inherit these errors.

## 9. Not modelled

- Secondary Cherenkov light, bremsstrahlung, fluorescence, Compton and transition radiation, and synchrotron emission.
  Earlier code had heuristic terms for these; they were removed because they had no physical basis in the code.
- Multiple scattering and delta rays in the transport.
- Detector geometry, pixel response, readout electronics and time structure.
- Photosensor quantum efficiency curves (not yet sourced).
- Ring imaging and particle identification (not yet implemented).
