# Changelog

Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow semantic versioning once a
release is tagged. Changes that alter results are marked **[results]**.

## [Unreleased]

### Added
- Monte Carlo options: switches for energy loss, optical absorption and detector efficiency (the analytic comparison follows the
  same switches), quick run sizes, a new-seed button and a detected-photons-per-primary distribution.
- Monte Carlo is now its own sidebar module. The 3D Chamber Lab is a rotatable geometric-optics model (src/core/lab.ts):
  seeded rays at the Cherenkov angle, total internal reflection at the faces, detector-face hits and a critical-angle warning.

### Changed
- **[results]** Energy loss along the track for water (electron Møller form, heavy-particle Bethe). The default 0.546 MeV
  electron in 10 mm of water now gives about 24 photons per particle, against 271 with the earlier constant-speed model.
- **[results]** Refractive index for water from Daimon and Masumura (2007) instead of an unsourced fit. Fused silica uses
  the three-term Malitson (1965) fit.
- **[results]** Absorption for water from Hale and Querry (1973), 400–650 nm. Earlier code had unsourced coefficients.
- **[results]** Per-bin integration is exact in 1/λ²; the mean angle is weighted by emitted yield, and its chromatic spread is reported.
- SNR is reported as S/√(S+B), not in dB. Core outputs are no longer rounded.
- Particle masses are PDG-sourced for the verified entries; alpha and carbon-12 are still flagged.

### Added
- Versioned run configuration (schema 1) with validation, import and export; result provenance; headless CLI.
- Photon-level Monte Carlo with seeded generator (partial; see docs/physics/MODEL.md).
- Validation records (17) and a report generator (`npm run validate`).
- Beta spectrum averaging with ENSDF endpoints.
- Content-security policy, per-tab error boundary, browser smoke test.

### Removed
- The AI assistant ("advisor") and every provider API integration, including the API key form and its local storage. The radiator thickness scan remains as a plain grid search.
- Monte Carlo tab and its controls (they changed nothing).
- Heuristic emission channels (secondary Cherenkov, bremsstrahlung, fluorescence, Compton, transition radiation).
- Synthetic plots, the 3D lab scene, the fabricated PDF narrative, and the dose-rate panel.
- three.js and react-three dependencies.

### Known issues
- The density effect is missing: electron stopping power is 4% high at 2 MeV and 13% high at 10 MeV.
- Sr-90 and Y-90 spectra use the allowed shape, which is wrong for Sr-90 and lacks the Fermi function.
- Pope and Fry water absorption could not be obtained; Hale and Querry is used instead.
- Geant4 cross-check not performed.
