# Celeritas: Cherenkov Spectrometry Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Celeritas is a React 19 + TypeScript + Vite dashboard for exploring Cherenkov radiation: relativistic kinematics, Frank-Tamm photon yields, Sellmeier dispersion, and detector settings for research and teaching.

## Physics model

- **Frank-Tamm yield.** Photons emitted per unit track length and per unit wavelength:
  $$\frac{d^{2}N}{dx\,d\lambda} = \frac{2\pi\alpha}{\lambda^{2}}\left(1 - \frac{1}{\beta^{2} n(\lambda)^{2}}\right)$$
  where $\alpha \approx 1/137$ is the fine-structure constant. Emission is zero when $\beta n \le 1$.
- **Cherenkov angle.** $\cos\theta_c = \dfrac{1}{\beta\, n}$, with $\beta = v/c$.
- **Refractive index.** Sellmeier dispersion $n^2(\lambda) = 1 + \sum_i \dfrac{B_i \lambda^2}{\lambda^2 - C_i}$ for materials that have published coefficients.
- **Attenuation.** A single slab of material with a path-averaged transmission applied to the emitted light before it reaches the detector.

## Limitations

- The bremsstrahlung, fluorescence, Compton and transition-radiation channels are heuristic.
- Detector settings only apply quantum efficiency, dead time and a dark-count term to the signal-to-noise ratio (SNR).
- The model does not perform full Monte Carlo transport.
- Not for clinical or dosimetry use.

## Development

```bash
npm install
npm run dev         # local dev server (http://localhost:5173)
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # production build into dist/
npm run preview     # serve the production build locally
```

Node.js 20 or newer is recommended.

## Deployment

Deployment: pushing to master runs .github/workflows/deploy.yml, which typechecks, tests, builds, and deploys dist/ to GitHub Pages. For Cloudflare Pages, connect the repo and set build command 'npm run build' and output directory 'dist'.

Cloudflare Pages reads `wrangler.toml` (project name and output directory) and `public/_headers` (security headers) and `public/_redirects` (SPA fallback to `index.html`).

## AI assistant

The app includes an optional AI assistant (OpenAI, Anthropic, Google Gemini, Mistral). You enter your own API key in the app. Keys are stored in the browser's localStorage and are readable by any script on the page. Requests go directly from the browser to the provider. For production use, route requests through a backend proxy that holds the keys.

## Project structure

```
.
├── .github/workflows/deploy.yml   # CI: typecheck, test, build, deploy to GitHub Pages
├── public/                        # Static files copied as-is (_headers, _redirects, manifest, robots)
├── src/
│   ├── core/                      # Physics engine (physics.ts) and AI provider client (ai.ts)
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
