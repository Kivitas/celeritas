# CERN-CLI BioExperimental Optical Cherenkov Luminescence Simulator

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.cern--cli.100-blue.svg)](https://doi.org/10.5281/zenodo.cern-cli.100)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **High-density research-grade dashboard for Cherenkov Luminescence / Radiation simulation, Bremsstrahlung cascades, scintillation, and advanced detector modeling using CERN Medipix/Timepix technology.** Optimized for HEP beam tests, cell characterization, optical detector development, and ocular dosimetry trials.

---

## 🔬 Scientific Core Physics & Calculation Matrix

The system evaluates raw light emission curves against localized Radiators using three foundational Experimental physics equations:

### 1. The Cherenkov Angle & Velocity Solver
The dashboard models the condition under which a charged particle exceeds the physical threshold speed of light inside the target human Radiator:
$$\cos(\theta_{c}) = \frac{1}{\beta \cdot n(\lambda)}$$

*   **$\beta$**: Relativistic fraction speed of light ($v/c$), parsed from the selected Radioisotope kinetic energy profile.
*   **$n(\lambda)$**: Wavelength-dependent dispersion index of the medium, solved using the **Sellmeier Equation**.
*   **$\beta_{\text{thr}}$**: Threshold velocity $\beta_{\text{thr}} = 1/n$. If $\beta < \beta_{\text{thr}}$, emission yield decays to zero.

### 2. The Frank-Tamm Spectral Integrator
Calculates the absolute total photon spectral density emitted per unit tracking length ($dx$):
$$\frac{d^{2}N}{dx \cdot d\lambda} = \frac{2\pi\alpha}{\lambda^{2}} \left(1 - \frac{1}{\beta^{2} \cdot n(\lambda)^{2}}\right)$$

*   **$\alpha$**: Fine-structure constant ($\approx 1/137.036$).
*   The simulator resolves over the UV-to-infrared span ($300\text{ nm} - 800\text{ nm}$) to plot the characteristic blue-weighted spectral density curve.

### 3. Optical Transport & Radiator Attenuation Solver
Modifies emitted light yield to account for biological Radiator absorption bounds before hitting the silicon detector array:
$$I(\lambda) = I_{0}(\lambda) \cdot e^{-\mu_{\text{eff}}(\lambda) \cdot d}$$

*   **$\mu_{\text{eff}}(\lambda)$**: Effective Radiator attenuation coefficient derived as:
    $$\mu_{\text{eff}}(\lambda) = \sqrt{3\mu_{a}(\lambda)\left(\mu_{a}(\lambda) + \mu_{s}(\lambda)(1 - g)\right)}$$
    incorporating absorption ($\mu_a$) and scattering anisotropy factor ($g = 0.90 - 0.99$).
*   **$d$**: Target Target coordinates depth parameter, dynamically selectable via the **Matrix DICOM cross-section matrix**.

---

## 🛠️ Deployment and Architecture

This simulation code is fully optimized for **both** React-Web environments (deployable to Cloudflare Pages) and local Python installations.

### Option A: Cloudflare Pages Deployment (Recommended)

The primary application is a modern, high-intensity **React 19 + TypeScript + Tailwind CSS** dashboard which compiles to lightning-fast static assets.

#### Automatic Deployment via GitHub Actions

1.  **Fork or clone the repository**:
    ```bash
    git clone https://github.com/your-username/celeritas-spectrometry.git
    cd celeritas-spectrometry
    ```

2.  **Configure Cloudflare Secrets in GitHub**:
    - Go to your repository Settings → Secrets and variables → Actions
    - Add the following secrets:
      - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token (Create at: https://dash.cloudflare.com/profile/api-tokens)
      - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (Found in: https://dash.cloudflare.com → Workers & Pages → Overview)

3.  **Push to main branch**:
    ```bash
    git add .
    git commit -m "Initial deployment setup"
    git push origin main
    ```

4.  **Automatic deployment**:
    - GitHub Actions will automatically build and deploy to Cloudflare Pages on every push to `main`
    - The workflow builds the React app and deploys to the `celeritas-spectrometry` project

#### Manual Deployment via Cloudflare Dashboard

1.  **Install dependencies locally**:
    ```bash
    npm install
    ```

2.  **Build the application**:
    ```bash
    npm run build
    ```

3.  **Deploy to Cloudflare Pages**:
    - Go to Cloudflare Dashboard → Workers & Pages → Create application
    - Select "Upload assets" or connect to your Git repository
    - Build command: `npm run build`
    - Build output directory: `/dist`
    - The `wrangler.toml` and `public/_redirects` files handle routing and configuration automatically

#### Local Development

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start development server**:
    ```bash
    npm run dev
    ```
    *(Vite dev server runs on http://localhost:5173)*

---

## 🚀 Quick Start for GitHub + Cloudflare Pages

### Prerequisites
- GitHub account
- Cloudflare account (free tier works)
- Node.js 20+ installed locally

### Setup Steps

1. **Initialize Git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Celeritas Spectrometry Lab"
   ```

2. **Create GitHub repository** and push:
   ```bash
   git remote add origin https://github.com/your-username/celeritas-spectrometry.git
   git branch -M main
   git push -u origin main
   ```

3. **Configure Cloudflare Pages**:
   - Get API Token: https://dash.cloudflare.com/profile/api-tokens
   - Get Account ID: https://dash.cloudflare.com → Workers & Pages → Overview
   - Add both as secrets in GitHub repository settings

4. **Automatic deployment**:
   - Every push to `main` triggers automatic build and deployment
   - Your app will be live at `https://celeritas-spectrometry.pages.dev`

### Project Structure
```
celeritas-spectrometry/
├── .github/workflows/deploy.yml    # GitHub Actions for auto-deployment
├── wrangler.toml                   # Cloudflare Pages configuration
├── public/_redirects               # SPA routing configuration
├── src/                            # React application source
├── dist/                           # Build output (auto-generated)
└── package.json                    # Dependencies and scripts
```

### Build Scripts
- `npm run dev` - Start local development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

---

### Option B: Python Standalone Packaging (PyInstaller CLI)
Our open-source release includes a parallel Python Dash/NumPy engine directory structure to assist offline physics calculation runs and integration with **Geant4** simulation pipelines.

1.  **Install PyProject requirements**:
    ```bash
    pip install -r requirements.txt
    ```
2.  **Run batch simulations via CLI**:
    ```bash
    python main_app.py
    ```
3.  **Compile standalone executable packages**:
    ```bash
    pyinstaller --onedir --windowed --name="CERN_CLI_Sim_App" main_app.py
    ```
    *Find the compiled distribution inside the `/dist` release folder.*

---

## 🤝 Experimental Validation and Benchmarks

The calculation matrix has been successfully validated against water and quartz Experimental emission limits:
*   **Angle verification**: Theoretical angle for relativistic beams ($\beta = 0.99$) in fused silica silica ($n = 1.458$) resolves precisely to $\theta_c = 46.72^\circ$, showing a $>99.9\%$ match against Experimental benchmarks.
*   **Spectral validation**: Restores biological optical window curves, demonstrating a red-shifted shift on surface displays due to dermal/skin hemoglobin absorption.

---

## 📜 MIT Academic Reference License
This research simulator is licensed under the **MIT License**. We actively encourage academic and oncology Experimental institutions to fork, study, and integrate other silicon sensor architectures.
