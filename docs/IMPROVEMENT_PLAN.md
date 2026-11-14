# Celeritas improvement plan

Audit date: 2026-11-14, at commit `02393d4`. This is a plan only; no source code was changed.

It is written to be executed by models working one task at a time with no memory of this audit. Section 2 is the brief to give every executor; section 4 is the task list; section 5 is the prompt template that wraps each task.

---

## 1. Where the project stands

Baseline, measured on this commit:

| Check | Result |
|---|---|
| `npm run typecheck` | passes (`strict` is off; turning it on yields 1 error, a missing type declaration for `react-katex`) |
| `npm test` | 20 tests pass, all in `src/core/physics.test.ts` |
| `npm run build` | passes; two chunks exceed 1 MB (`index` 1,047 kB, `LabTab` 1,051 kB) |
| `npm audit --omit=dev` | 10 vulnerabilities (1 critical, 5 high) |
| CI | runs only on push to `master`; nothing runs on pull requests; no lint, no coverage |
| UI tests, accessibility attributes, error boundary | none (1 `aria-`/`role` match in all of `src`) |

The gap between this and something a CERN group would trust is not polish. It is four things, in order of importance:

1. **The app presents invented data as simulation output.** `src/components/DynamicPlots.tsx` draws energy histograms, angular distributions, a spatial heat map, particle tracks, a timing curve and a "dose rate" from `Math.random()` and hand-shaped Gaussians. The Monte Carlo tab offers PYTHIA8 / HERWIG / GEANT4 / FLUKA selectors, reconstruction toggles (Kalman filter, ML jets) and "exotic physics" switches (Hawking radiation, magnetic monopoles, Planck-scale effects). None of these parameters is read by `src/core/physics.ts`. `simulationMode` defaults to `"stochastic"` while the engine is fully deterministic. A physicist who finds one of these stops trusting everything else.
2. **The central number is wrong for the default case.** The engine holds β constant along the whole track. The default source is a 0.546 MeV electron in heavy water with a 10 mm track; such an electron stops in about 2 mm and drops below the Cherenkov threshold (≈0.26 MeV) well before that. The reported yield (~248 photons) is therefore too high by roughly an order of magnitude. Beta emitters are also treated as monoenergetic at the endpoint energy instead of having a continuous spectrum.
3. **The input data has no provenance.** There are 254 materials, every one with a 2-term Sellmeier fit and no citation. The water coefficients give n(589 nm) ≈ 1.3385; the accepted value is 1.3330. The per-material `mu_a_base` / `mu_s_base` fields are never read; `getMediumCoefficients` hard-codes 8 materials by id and gives the other 246 a tissue-like default (μa = 0.05 mm⁻¹, μs = 5 mm⁻¹). Particle mass is chosen by an `if` chain in which isotope type `"custom"` (39 presets) silently gets the muon mass and every heavy ion that is not carbon gets the alpha mass.
4. **Validation is circular.** The Validation tab compares the code against numbers produced by the same formulas (for example the 248.4-photon "reference"). There is no comparison against NIST, PDG, published measurements or another code.

Smaller findings are listed inside the tasks that fix them.

One naming issue needs a human decision: **"Celeritas" is already the name of an established HEP code** (the GPU Monte Carlo detector-simulation project led from ORNL, `celeritas-project/celeritas`, used in LHC-experiment studies). Presenting this project to that community under the same name will cause confusion and looks careless. See decision D1 in section 6.

---

## 2. Standing brief for every executor

Give this text to the executing model at the start of every session, before the task. It can also be saved as `CLAUDE.md` in the repository root so it loads automatically.

```text
You are working on a scientific simulator for Cherenkov radiation (React 19, TypeScript, Vite,
Vitest). The goal of the current work is to make it trustworthy to particle physicists. That
audience checks numbers against references and stops trusting a tool the first time it finds an
invented value, so correctness and honesty matter more here than features or appearance.

How to work

1. Do exactly one task from docs/IMPROVEMENT_PLAN.md per session. Read the whole task, then read
   every file it names before editing anything. If the code no longer matches what the task
   describes, stop and report the difference instead of guessing.
2. Never write a physical constant, material coefficient, or reference value from memory. Take it
   from the source the task names (PDG, NIST, refractiveindex.info, a cited paper), and record the
   source next to the value: citation, URL, and the date you retrieved it. If you cannot reach the
   source, leave the value out, mark the entry `verified: false`, and say so in your report. A
   missing value is acceptable. A plausible-looking invented value is the worst outcome possible
   in this project.
3. Never generate output with Math.random() or a hand-shaped curve and present it as a result. If a
   quantity is not computed by the physics core, the UI does not show it.
4. Every quantity carries its unit in its name (energyMeV, lengthMm, wavelengthNm) and every
   function documents the units of its inputs and outputs. The core works in MeV, mm, nm, and
   kelvin; convert at the boundary only.
5. Write the test before the change when the task changes a formula. A physics test compares
   against an independent reference value with a stated tolerance and a comment giving the source.
   A test that only checks the code against its own earlier output is a regression test, not a
   validation; label it as such.
6. Keep src/core free of React, DOM and browser APIs. It must run under plain Node.
7. Do not round or clamp inside the physics core. Round only when formatting for display. If a
   guard is needed to avoid NaN or division by zero, return a documented value and add a test.
8. Stay inside the task. Do not rename, reformat, or refactor files the task does not mention, and
   do not add features. If you notice another problem, write it in your report under
   "Noticed, not fixed".
9. Before reporting, run: npm run typecheck, npm test, npm run build (and npm run lint once it
   exists). All must pass. Never delete, skip or loosen a test to get there; if a test is wrong,
   explain why in the report and fix the test with a cited reference value.
10. One task is one commit on the working branch, with a message that says what changed and why.

Report format (end every session with this)

- Task ID and one sentence on what now works.
- Files changed.
- Output of the four commands above (pass/fail and test count).
- Every reference value you added, with its source.
- Anything you could not verify or could not finish, stated plainly.
- Noticed, not fixed.
```

---

## 3. Order of work

```
Phase 0  Guard rails          (do first; catches mistakes made in every later phase)
Phase 1  Remove invented output
Phase 2  Sourced data
Phase 3  Physics core
Phase 4  Real Monte Carlo and detector response
Phase 5  Validation against external references
Phase 6  Reproducibility and export
Phase 7  Engineering quality
Phase 8  Security
Phase 9  Documentation and release
```

Phases 0 to 3 are strictly sequential. Inside a phase, tasks are sequential unless marked "parallel-safe". Phases 7 and 8 can run alongside phases 4 to 6 because they touch different files.

Phases 0, 1, 7, 8 and 9 are mechanical and suit a lower-reasoning executor. Phases 2 to 5 contain the physics; have a stronger model or a physicist review each of those commits before the next task starts, because an error there is silent.

---

## 4. Tasks

Each task lists **Why**, **Files**, **Do**, **Done when**, and **Traps** (the mistake a quick reading would make).

### Phase 0: Guard rails

**T0.1 Run CI on pull requests**
- Why: today nothing checks a change until it is already on `master`.
- Files: `.github/workflows/deploy.yml`, new `.github/workflows/ci.yml`.
- Do: add `ci.yml` triggered on `pull_request` and on push to any branch, running `npm ci`, typecheck, lint (after T0.2), test with coverage, build. Leave `deploy.yml` deploying only from `master`.
- Done when: a pull request shows the four checks.
- Traps: do not give the CI job `pages: write` or `id-token: write`; it only needs `contents: read`.

**T0.2 Lint and strict TypeScript**
- Files: `tsconfig.json`, new `eslint.config.js`, `package.json`, new `src/react-katex.d.ts`.
- Do: add ESLint with `typescript-eslint` and `eslint-plugin-react-hooks`; add `npm run lint`. Set `"strict": true` and add a module declaration for `react-katex` (the single strict error). Remove `experimentalDecorators`, `useDefineForClassFields: false` and `allowJs`, which nothing uses. Add a lint rule banning `Math.random` under `src/core` and `src/data`.
- Done when: lint, typecheck and build pass with `strict` on.
- Traps: do not silence errors with `any` or `// @ts-ignore`. The 20-odd existing `any` uses are removed in T7.2, not here; set `no-explicit-any` to "warn" for now.

**T0.3 Freeze current behaviour**
- Why: later tasks change physics on purpose. A snapshot shows exactly which outputs moved, so an unintended change is visible.
- Files: new `src/core/regression.test.ts`.
- Do: for six configurations (electron/muon/proton × water/quartz, default detector) snapshot the full `summary` and the first, middle and last spectrum points.
- Done when: the snapshot test passes and its header comment says "regression snapshot, not validation; update deliberately, with the reason in the commit message".

**T0.4 Coverage threshold**
- Do: enable `@vitest/coverage-v8`; require 90% line coverage for `src/core/**`, no threshold elsewhere yet.

### Phase 1: Remove invented output

The rule for this phase: delete, do not relabel. A disabled control labelled "coming soon" is acceptable only where a later task in this plan implements it.

**T1.1 Remove synthetic plots**
- Files: `src/components/DynamicPlots.tsx`, and callers.
- Do: delete every dataset built from `Math.random()` or invented shapes: `energyHistogramData`, `angularDistributionData`, `spatialHeatmapData`, `particleTrackingData`, `doseRateData`, the timing curve, `phaseSpaceData`, the pixel-hit canvas. Keep only plots whose every point comes from `simResult` (the wavelength spectrum, the transmission curve). `wavelengthEfficiencyData` is an invented Gaussian quantum-efficiency curve; remove it here, it returns as real data in T4.3.
- Done when: `grep -n "Math.random" src/components/DynamicPlots.tsx` returns nothing and every remaining chart traces to a field of `SimulationResultPoint` or `SimulationSummary`.
- Traps: do not replace `Math.random` with a seeded generator to make the plots "reproducible". Reproducible fiction is still fiction.

**T1.2 Remove inert controls and types**
- Files: `src/types.ts`, `src/components/MonteCarloTab.tsx`, `src/components/ConfigurationTab.tsx`, `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/LabScene3D.tsx`, `src/core/physics.test.ts`.
- Do: remove from `SimulationParams` and the UI every field the core never reads. Confirmed inert: `monteCarloGenerator`, `eventGenerator`, `mcEventsPerRun`, `exoticPhysics`, `reconstruction`, `detectorSubsystems`, `gravitationalLensingActive`, `cosmicRaysActive`, `ambientCosmicRays`, `triggerLevel1Active`, `mlJetReconstruction`, `daqDeadTimeFraction` (duplicate of `daq.deadtimeFraction`), `incidenceAngleDeg`, `electricFieldKvM`, `beamProfile`, `beamPulseWidthNs`, `particleSpin`, `baryonNumber`, `leptonNumber`, `labFacility`, `chamberShape`, `dimensionMode`, `chamberMaterial`, `simulationMode`, `isRelativisticCalculated`, `intensityFlux`, the duplicate `magneticFieldTesla`, and all `componentsActive` keys beyond the nine the core uses. Remove the `[key: string]` index signature. Before deleting a field, `grep` for it in `src/core`; if the core reads it, keep it.
- Do the same for `DetectorSettings`: the core reads only `quantumEfficiencyPct`, `darkCountRateHz`, `frameRateHz`. Keep those; remove the rest unless a task in phase 4 names the field.
- Remove the Monte Carlo tab from navigation until T4.1 delivers a real one.
- Done when: every remaining field of `SimulationParams` and `DetectorSettings` is read somewhere in `src/core`, and a short test asserts this list.
- Traps: `LabTab.tsx` (1,781 lines) and `LabScene3D.tsx` animate decorative random tracks. Reduce them to a geometry illustration (radiator, beam axis, cone at the computed angle) captioned "illustration, not simulation output". Do not try to keep the animation by wiring it to removed fields.

**T1.3 Remove invented summary quantities**
- Files: `src/core/physics.ts`, `src/types.ts`, UI consumers, `src/utils/pdfExport.ts`.
- Do: remove `totalCollisions` (invented mean-free-path formula), `radiationLossMeV`, `experimentalFluencePercentError`, `radSafetyClassification` (a tool that says "not for radiation-safety decisions" must not print "Extremely Lethal Beam Zone"), `fluenceRateGyMin`, `cumulativeFluenceGy`, `experimentalModeActive`, `experimentalApplication`, the thermal "break" flags, the sinusoidal detector background `0.015*sin(λ/120)+0.02`, and the heuristic channels: bremsstrahlung, fluorescence, Compton, transition radiation, "secondary Cherenkov" (`0.12*ln(1+E/25)`), the divergence factor `exp(-div*0.001)`, the photoelectric cutoff. Remove the unused constants that go with them.
- Why remove rather than keep labelled: a heuristic term added into `totalYield` contaminates the one number that should be exact. δ-ray Cherenkov light returns in T4.1 computed properly.
- Done when: the only emission channel is Frank-Tamm; the regression snapshot is updated with the reason stated.
- Also remove the pre-filled "calibration log" in `ValidationTab.tsx` (it asserts measurements that never happened) and the mock "scan" canvases.

**T1.4 Fix metadata that contradicts the project**
- Files: `CITATION.cff`, every `src` file header, `package.json`, `README.md`.
- Do: `CITATION.cff` uses invalid `cff-version: 1.0.0` (use `1.2.0`), a placeholder DOI `10.5281/zenodo.100` that belongs to someone else's record (remove until a real one exists, see T9.3), and an abstract claiming medical dosimetry and radiation-therapy support, which the README disclaims. Rewrite the abstract to match the README. Source headers say `Apache-2.0` while `LICENSE` is MIT; make them agree with `LICENSE`. Move build tools (`vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`) to `devDependencies`.
- Done when: `grep -rn "Apache" src` is empty and the CFF file validates with `cffconvert --validate`.

**T1.5 Prune the formula and preset libraries**
- Files: `src/data/formulas.ts` (≈210 formulas, 53 tagged "Quantum"), `src/data/experimentPresets.ts`, `src/data/beamlinePresets.ts`, `src/components/RawBatchTab.tsx`.
- Do: keep only formulas the simulator implements or directly relies on, each with a citation. In the batch template, the β column disagrees with the energy column (0.546 MeV electron listed as β = 0.8860, correct is 0.8754; "SPS proton" listed at 450 MeV); derive β from energy and particle instead of storing both.
- Done when: every formula shown has a `reference` field and every preset's numbers are derived, not typed twice.

### Phase 2: Sourced data

**T2.1 Particle table**
- Files: new `src/data/particles.ts`, `src/types.ts`, `src/core/physics.ts`, `src/data/presets.ts`.
- Do: create one table keyed by PDG id with `massMeV`, `chargeE`, `name`, `source`. Include e±, μ±, π±, K±, p, p̄, d, α, and fully stripped ¹²C. Take masses from the current PDG listings. Give every source preset a `particlePdgId`; delete the mass `if` chain in `runCherenkovSimulation` and the separate `beamCharge` parameter.
- Known errors this fixes: type `"custom"` maps to the muon mass; heavy ions other than carbon get the alpha mass; `CARBON_ION_MASS_MEV = 11177.928` is the neutral-atom mass (12 u), while a bare nucleus is lighter by six electron masses (≈11174.86 MeV); kaons are missing, and π/K separation is the main use of Cherenkov detectors.
- Neutral particles (neutron, neutrino, photon) and electron-capture sources emit no Cherenkov light directly. Remove those presets or make the result explicitly zero with a stated reason.
- Done when: a test checks every table mass against the PDG value to the precision PDG quotes, with the PDG edition in the comment.
- Traps: do not fetch masses from memory or from the existing constants; several of the existing comments are wrong.

**T2.2 Material table with provenance**
- Files: `src/data/presets.ts` → new `src/data/materials/`, `src/types.ts`.
- Do: new schema: `id`, `name`, `dispersion` (formula type + coefficients + valid wavelength range + temperature), `absorptionLengthMm(λ)` and `scatteringLengthMm(λ)` as tabulated points with interpolation, `densityGcm3`, `radiationLengthGcm2`, `meanExcitationEnergyEv`, `ZoverA`, `dnDT` (optional), `source` for each block, `verified: boolean`.
- Populate and verify a first set of about a dozen that Cherenkov detectors actually use: water, heavy water, fused silica, silica aerogel (parametrised by n), C₄F₁₀, CF₄, N₂, CO₂, air, LiF, MgF₂, NaF, PMMA/UVT acrylic, lead glass, PbF₂. Sources: refractiveindex.info entries (it cites the primary paper for each fit; record both), Malitson 1965 for fused silica, the IAPWS formulation or Daimon and Masumura 2007 for water, Pope and Fry 1997 for water absorption, PDG "Atomic and nuclear properties of materials" for density, X₀ and I.
- The other ~240 existing entries have no source. Move them to an `unverified` list that the UI hides by default and labels clearly when shown, or delete them. Do not keep them in the main list.
- Done when: for each verified material a test reproduces a published index at a stated wavelength (water 1.3330 at 589.3 nm and 20 °C; fused silica 1.4585 at 589.3 nm) within 2×10⁻⁴, and the dispersion function throws outside its valid range rather than extrapolating silently.
- Traps: Sellmeier coefficients come in two conventions (Cᵢ in μm² versus √Cᵢ in μm). Check which one the source uses by reproducing its quoted index before committing. Gas indices need n−1 handled directly; see T3.2.

**T2.3 Use the material data in transport**
- Files: `src/core/physics.ts`.
- Do: delete `getMediumCoefficients` and its id `if` chain; read attenuation from the material record. Replace the diffusion-theory `mu_eff = sqrt(3 μa(μa+μs'))` with Beer-Lambert attenuation `exp(-L/λ_abs)` for unscattered light and report scattered fraction separately. Diffusion theory applies to turbid media where scattering dominates; the materials here are clear, so it is the wrong regime. Remove the separate `rayleighLossFactor` (it double-counts scattering) and the transmission floor `Math.max(0.0001, …)`.
- Done when: transmission for 1 m of water at 420 nm matches `exp(-L/λ_abs)` from the tabulated Pope and Fry value to 1%.

### Phase 3: Physics core

Restructure first, then fix physics one piece at a time. Target layout, all pure functions:

```
src/core/
  constants.ts      CODATA/PDG constants with source comments
  kinematics.ts     β, γ, p, conversions; precise near β→1
  dispersion.ts     n(λ, T) from a material record
  cherenkov.ts      threshold, angle, Frank-Tamm differential and integrated yield
  energyLoss.ts     stopping power, range, slowing-down integration
  sources.ts        monoenergetic beam, beta-decay spectrum
  transport.ts      absorption, scattering, geometry
  detector.ts       photon detection efficiency, noise, photoelectron statistics
  simulate.ts       orchestration: params in, result out
  rng.ts            seeded generator (phase 4)
```

**T3.1 Split `physics.ts` without changing behaviour**
- Do: move code into the files above; `simulate.ts` re-exports what the UI imports. No formula changes.
- Done when: the regression snapshot from T0.3 is byte-identical.

**T3.2 Numerical precision near β = 1 and n = 1**
- Why: `MAX_BETA = 0.999999` caps γ at about 707, so every particle above ~360 MeV (electron) or ~75 GeV (muon) gets the same β. `REFRACTIVE_INDEX_MIN = 1.0001` overwrites real gas indices (helium is 1.000035). Gas radiators with multi-GeV beams are exactly the CERN use case, and there `1 − 1/(β²n²)` is a difference of two numbers within 10⁻⁴ of each other.
- Do: carry `δ = 1 − β` computed as `1/(γ²(1+β))` and `η = n − 1` as primary quantities; evaluate `sin²θ = 1 − 1/(β²n²)` from δ and η without subtracting near-equal numbers. Remove both clamps. Remove the global `THERMAL_COEFFICIENT_DN_DT = −1.4e-4`, which is a water-like value applied to every material (fused silica's is positive and ten times smaller); use the per-material `dnDT`, and for gases scale `n−1` with density (pressure and temperature).
- Done when: tests cover a 200 GeV pion in N₂ (η ≈ 2.98×10⁻⁴) against a hand calculation in the test comment, and results stay monotonic in energy up to 7 TeV.

**T3.3 Wavelength-resolved threshold and angle**
- Do: the threshold currently uses n at 500 nm only, and the reported angle is an unweighted mean over bins. Report threshold per wavelength (and the band over the spectral range), and the photon-weighted mean angle plus its chromatic spread σθ. Integrate the spectrum with the trapezoid rule on bin edges instead of sampling the left edge.
- Done when: the integrated yield converges to the analytic constant-n result within 0.1% when dispersion is switched off, at 10 nm and at 1 nm binning.
- Reference for the test: PDG gives `d²N/dE dx ≈ 370 sin²θc eV⁻¹ cm⁻¹` for z = 1. Verify the figure in the current PDG review ("Passage of particles through matter") before using it.

**T3.4 Energy loss along the track** (the largest single correction)
- Do: implement mean stopping power: Bethe with density-effect correction for heavy charged particles; for electrons and positrons use tabulated NIST ESTAR collision + radiative stopping powers for the verified materials (store the tables as data files with retrieval date), interpolated log-log. Integrate the track in steps: at each step compute β, the Frank-Tamm yield for that step, then subtract `dE/dx · dx`. Stop when the particle leaves the radiator or falls below threshold. Report range, path length above threshold, and energy deposited.
- Done when: (a) CSDA range of electrons in water at 0.5, 1, 2 and 10 MeV matches NIST ESTAR within 2%; (b) proton range in water at 100 and 200 MeV matches NIST PSTAR within 2%; (c) the yield for a 0.546 MeV electron in D₂O is far below the old 248 and the test records the new value with its derivation; (d) a 10 GeV muon through 10 mm of water changes yield by less than 0.1% compared with constant β.
- Traps: do not use a constant "2 MeV cm²/g" for everything. Do not let the step size be the wavelength bin. Choose steps so energy changes by at most 1% per step, and test that halving the step changes the yield by less than 0.2%.

**T3.5 Source spectra**
- Do: beta emitters get an allowed-shape spectrum with Fermi function, normalised, integrated over energy (yield = ∫ spectrum(E) · yield(E) dE). Include daughters where they dominate: ⁹⁰Sr's own betas (endpoint 0.546 MeV, mean near 0.2 MeV) are mostly below threshold in water; nearly all the light comes from ⁹⁰Y (endpoint 2.28 MeV). Take endpoints and branching from ENSDF/NuDat and cite them.
- Done when: the mean energy of each implemented spectrum matches the NuDat mean within 3%.

**T3.6 Remove rounding and document outputs**
- Do: delete every `toFixed` in the core (spectrum values rounded to 3 decimals turn small yields into 0). Define each output precisely in `types.ts`: per particle or per run, before or after transport, units. Replace `signalToNoiseRatioDb` with plain `S/√(S+B)`; a decibel figure is not how detector physicists quote this.

### Phase 4: Real Monte Carlo and detector response

**T4.1 Photon-level Monte Carlo**
- Files: `src/core/rng.ts`, new `src/core/mc/`, a Web Worker wrapper under `src/workers/`.
- Do: seeded generator (xoshiro256** or PCG32; the seed is part of the run configuration). Per primary: step through the radiator with energy loss (T3.4), multiple Coulomb scattering by the Highland formula, sample the Poisson number of photons per step, sample wavelength from the Frank-Tamm distribution, emit on the cone at the local angle with uniform azimuth, track each photon through absorption, Rayleigh scattering, Fresnel reflection/refraction at the radiator exit (including total internal reflection, which decides whether light leaves a quartz bar at all), to a planar detector. Optional: δ-ray production above a cut, each δ-ray tracked as an electron.
- Run in a Web Worker with progress and cancel; the core itself stays synchronous and Node-runnable.
- Done when: with scattering, energy loss and dispersion switched off, the Monte Carlo mean yield agrees with the analytic integral within 3 standard errors over 10⁵ primaries; the same seed gives bit-identical output; two seeds give different output.
- Traps: `Math.random` is not seedable and must not appear. Do not sample photons in the UI thread.

**T4.2 Statistical uncertainties everywhere**
- Do: every Monte Carlo output carries a standard error; plots draw error bars; summaries print `value ± error`. Deterministic outputs state their model uncertainty source or none.

**T4.3 Photosensor model**
- Do: replace the single quantum-efficiency percentage with a wavelength-dependent photon detection efficiency curve from manufacturer datasheets (a bialkali PMT, a blue-sensitive SiPM, an MCP-PMT), digitised into data files with the datasheet cited. Add window transmission cutoff, collection efficiency, dark counts within a stated time gate, SiPM crosstalk and afterpulsing as the standard excess-noise treatment. Output photoelectrons, and the figure of merit `N₀ = N_pe / (L sin²θ)` in cm⁻¹.
- Done when: N₀ for a bialkali PMT with a fused-silica window comes out in the range the PDG review quotes for typical detectors, and the test cites that passage.

**T4.4 Ring imaging and particle identification** (the feature that makes this useful to a detector group)
- Do: for proximity-focusing and mirror-focusing geometries, produce the hit pattern on the photodetector plane; per-photon angle resolution from chromatic dispersion, pixel size, emission-point uncertainty and multiple scattering, combined in quadrature; ring resolution `σθ/√N_pe`; and π/K/p separation in units of σ versus momentum. Add threshold-counter mode: efficiency versus momentum for each species.
- Done when: for aerogel n = 1.05 and for C₄F₁₀, the momentum at which π/K separation drops to 3σ is computed and compared against a published design value for a real detector (LHCb RICH, Belle II ARICH), with the paper cited and the tolerance justified.

### Phase 5: Validation against external references

**T5.1 Reference fixture set**
- Files: new `validation/` directory: `validation/references/*.json`, each record = quantity, conditions, value, uncertainty, source citation, URL, retrieval date.
- Contents: PDG masses; NIST ESTAR/PSTAR ranges and stopping powers; refractive indices at standard wavelengths; water absorption (Pope and Fry); Cherenkov thresholds for e, μ, π, K, p in each verified material (computed from the sourced n, labelled "derived"); published photoelectron yields of real detectors.
- Done when: `npm run validate` runs the core against every record and writes a table (reference, computed, deviation, pass/fail) to `validation/report.md`; CI runs it and fails on any regression.

**T5.2 Geant4 cross-check** (needs a human or a machine with Geant4; see decision D3)
- Do: a minimal Geant4 application under `validation/geant4/` (slab radiator, `G4Cerenkov`, optical photons counted at the exit face) with its macro files and the Geant4 version recorded. Commit its output as fixtures for about ten configurations. The validation runner compares the Monte Carlo of T4.1 to these.
- Done when: yields agree within 5% and angular distributions pass a χ² test for the configurations where both codes model the same physics; disagreements are documented with their cause, not hidden.
- Traps: an executor without Geant4 must not produce these fixtures by any other means. If Geant4 is not available, write the application and macros, leave the fixtures absent, and report that.

**T5.3 Make the Validation tab show the real report**
- Do: the tab renders the table from T5.1/T5.2, generated at build time, with sources linked. Remove the six self-referential checks.

### Phase 6: Reproducibility and export

**T6.1 Versioned run configuration**: one JSON schema (with `schemaVersion`) holding every input including the seed and the data-file versions; validate on load with a schema library; import/export from the UI; encode in the URL for sharing.
**T6.2 Result export with provenance**: CSV and JSON carrying units in column names, the full configuration, software version, git commit, and data-source versions. A result file alone must be enough to reproduce the run. The PDF report uses the same data.
**T6.3 Headless use**: publish `src/core` as an importable package entry and a small Node CLI (`celeritas run config.json > result.json`), so results can be scripted and scanned over parameters outside the browser. Parameter scans (yield versus momentum, versus thickness) become a first-class feature built on it, replacing the Batch tab's free-typed β and n columns.

### Phase 7: Engineering quality (parallel-safe with phases 4 to 6)

**T7.1 Break up oversized components**: `LabTab.tsx` (1,781 lines), `ConfigurationTab.tsx` (1,496), `App.tsx` (818), `DynamicPlots.tsx`. One component per file, under ~300 lines, state for simulation inputs in a single reducer or store rather than passed through every tab.
**T7.2 Remove `any`**: 25 uses; `pdfExport.ts` takes `summary: any, params: any, detector: any`. Type them and set the lint rule to "error".
**T7.3 Bundle size**: lazy-load `three`/`@react-three/*`, `jspdf`, `html2canvas` and KaTeX so they are fetched only when their tab opens; the `react-vendor` chunk is currently empty (0 kB), which means `manualChunks` is misconfigured. Target: initial JavaScript under 250 kB gzipped. Remove `chunkSizeWarningLimit: 1000`.
**T7.4 Robustness**: error boundary around each tab; input validation with ranges and units on every numeric field (the CSV importer currently turns unparsable numbers into defaults silently; report the row and reject it).
**T7.5 Accessibility**: labels tied to inputs, keyboard navigation for tabs, colour-blind-safe plot palette, text alternatives for charts (a data table toggle). Target WCAG 2.1 AA; check with axe in the end-to-end tests.
**T7.6 UI tests**: component tests with Testing Library for the configuration form; Playwright end-to-end for load → change particle → result updates → export, run in CI with `--trace off`.
**T7.7 Dependency hygiene**: resolve the 10 `npm audit` findings; add Dependabot or Renovate; pin the Node version in `.nvmrc` and `engines`.

### Phase 8: Security

**T8.1 Content Security Policy**: add a CSP to `public/_headers` allowing scripts from self only and `connect-src` limited to the four AI provider origins. GitHub Pages cannot set headers, so also add the `<meta http-equiv>` form in `index.html`.
**T8.2 API key handling**: keep keys in memory by default; persisting to `localStorage` becomes an explicit opt-in with the warning shown at that moment. Remove the privacy-policy and cookie-banner text if it describes practices the app does not have, and make it describe what is actually stored.
**T8.3 AI assistant grounding**: move provider model ids into one config file with a comment on when they were last checked (`gpt-4o` and `gemini-2.5-flash` are dated). Send the assistant the validated result object with units, instruct it to quote only numbers present in that object, and label its output as AI-generated and unverified. Sanitise rendered markdown.

### Phase 9: Documentation and release

**T9.1 Physics manual** under `docs/physics/`: every model in the core, with derivation, assumptions, validity range, and references; a "what is not modelled" section. Each equation links to the function that implements it.
**T9.2 Project hygiene**: `CONTRIBUTING.md`, `CHANGELOG.md` (Keep a Changelog), semantic versioning, issue and pull-request templates that ask "what reference did you validate against?".
**T9.3 Citable release**: tag a release, archive it on Zenodo to obtain a real DOI, then put that DOI in `CITATION.cff` and the README. Consider a JOSS submission once phase 5 is complete; its review checklist is a good external bar.

---

## 5. Prompt template for one task

Fill the braces and send this after the standing brief.

```text
Task {ID}: {title}, from docs/IMPROVEMENT_PLAN.md. Read that task's entry in full first.

Why this task exists: {copy the Why line, plus one sentence on what it unblocks}.

Before editing, read these files completely: {files}. Then tell me in three lines what you found
that the task description did not mention, and continue.

What done looks like: {copy the Done-when line}. Stop there; later tasks cover the rest.

The easy mistake here: {copy the Traps line}.

Reference values for this task come from: {sources}. Fetch them; do not recall them. For each one,
record citation, URL and retrieval date beside the value. If a source is unreachable, leave the
value out, mark it unverified, and tell me.

Finish with the report format from the standing brief. If any check fails or anything is
unverified, say so first, before the summary of what worked.
```

For the physics tasks (phases 2 to 5), add a second, independent pass with a fresh session:

```text
Review commit {sha} for task {ID} in docs/IMPROVEMENT_PLAN.md. You did not write it. For every
formula changed, derive the expected value for one concrete case by hand, show the arithmetic, and
compare with what the code returns. For every reference value added, open the cited source and
confirm the number, the units and the conditions (wavelength, temperature, density). List each
item as confirmed, wrong (with the correct value and source), or could not check. Do not edit code.
```

---

## 6. Decisions needed from the project owner

- **D1 Name.** "Celeritas" collides with an existing HEP simulation code. Recommendation: rename before any outreach or DOI. T1.4 and T9.3 depend on this.
- **D2 Scope cut.** Phase 1 deletes a large share of the visible UI (Monte Carlo tab, most plots, exotic-physics switches, ~240 materials, most of the formula library). Recommendation: accept it. A small tool whose every number is defensible is worth more to this audience than a large one that is partly decorative. Phase 4 brings the Monte Carlo tab and the plots back as real output.
- **D3 Geant4 access.** T5.2 needs someone who can build and run Geant4. Without it, validation rests on NIST, PDG and published detector numbers, which is acceptable for a first release but weaker.
