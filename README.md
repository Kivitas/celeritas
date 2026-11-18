# Redshift: Cherenkov Spectrometry Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Redshift is a React 19 + TypeScript + Vite dashboard for exploring Cherenkov radiation: relativistic kinematics, Frank-Tamm photon yields, Sellmeier dispersion, and detector settings for research and teaching.

## Physics model

- **Frank-Tamm yield.** Photons emitted per unit track length and per unit wavelength:
  $$\frac{d^{2}N}{dx\,d\lambda} = \frac{2\pi\alpha}{\lambda^{2}}\left(1 - \frac{1}{\beta^{2} n(\lambda)^{2}}\right)$$
  where $\alpha \approx 1/137$ is the fine-structure constant. Emission is zero when $\beta n \le 1$.
- **Cherenkov angle.** $\cos\theta_c = \dfrac{1}{\beta\, n}$, with $\beta = v/c$.
- **Refractive index.** Sellmeier dispersion $n^2(\lambda) = 1 + \sum_i \dfrac{B_i \lambda^2}{\lambda^2 - C_i}$ for materials that have published coefficients.
- **Attenuation.** A single slab of material with a path-averaged transmission applied to the emitted light before it reaches the detector.

## Limitations

Full list with sources: [docs/physics/MODEL.md](docs/physics/MODEL.md).

- Only Frank-Tamm Cherenkov emission is modelled. Secondary Cherenkov, bremsstrahlung, fluorescence, Compton, transition radiation and synchrotron emission are not included.
- Energy loss is modelled for water only (no density effect): electron stopping power is 4% high at 2 MeV and 13% high at 10 MeV.
- Most materials have no sourced refractive index or absorption; they are hidden by default.
- The Monte Carlo has no scattering, delta rays or exit-face optics yet.
- Not validated against an independent code (no Geant4 cross-check).
- Not for clinical, dosimetric or radiation-safety use.

## Documentation

- [Physics model](docs/physics/MODEL.md): equations, sources, validity, limitations
- [Improvement plan](docs/IMPROVEMENT_PLAN.md): status of each phase
- [Contributing](CONTRIBUTING.md) and [Changelog](CHANGELOG.md)

## Development

```bash
npm install
npm run dev         # local dev server (http://localhost:5173)
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # production build into dist/
npm run preview     # serve the production build locally
npm run validate    # compare the model with external references (writes validation/report.md)
npm run cli:build   # build the headless runner; then: node dist-cli/cli.mjs config.json > result.json
npm run e2e         # browser smoke test against the built app (needs Playwright)
```

Node.js 20 or newer is recommended.

## Deployment

Deployment: pushing to master runs .github/workflows/deploy.yml, which typechecks, tests, builds, and deploys dist/ to GitHub Pages. For Cloudflare Pages, connect the repo and set build command 'npm run build' and output directory 'dist'.

Cloudflare Pages reads `wrangler.toml` (project name and output directory) and `public/_headers` (security headers) and `public/_redirects` (SPA fallback to `index.html`).

## Project structure

```
.
├── .github/workflows/deploy.yml   # CI: typecheck, test, build, deploy to GitHub Pages
├── public/                        # Static files copied as-is (_headers, _redirects, manifest, robots)
├── src/
│   ├── core/                      # Physics engine (physics.ts); pure functions, no browser APIs
│   ├── services/                  # Browser AI provider client (ai.ts)
│   ├── components/                # React UI: tabs, sidebar, 3D lab scene, plots, exports
│   ├── data/                      # Presets, formulas and reference data
│   ├── utils/                     # PDF export helpers
│   ├── App.tsx                    # Application shell
│   └── main.tsx                   # Entry point
├── index.html
├── vite.config.ts
├── wrangler.toml                  # Cloudflare Pages settings
└── package.json
```

## License

MIT. See [LICENSE](LICENSE).
