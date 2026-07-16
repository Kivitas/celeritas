import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Captures a DOM element by its ID and exports it as a multi-page PDF.
 */
export const generatePdfFromElement = async (elementId: string, filename: string = "Lab_Report.pdf") => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID ${elementId} not found.`);
    return;
  }

  try {
    // Add a temporary class to ensure it's fully visible/styled for print if needed
    element.classList.add("pdf-exporting");

    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
      backgroundColor: "#020617", // slate-950 to match dark mode
    });

    element.classList.remove("pdf-exporting");

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    
    // A4 dimensions: 210 x 297 mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add new pages if the content is longer than one A4 page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
  }
};

/**
 * Generates a pure scientific data PDF report (no 3D models or UI screenshots).
 */
export const generateScientificReportPdf = (summary: any, params: any, detector: any, filename: string = "Scientific_Report.pdf") => {
  try {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    let y = margin;
    const lh = 6;
    const pageHeight = 297 - margin;
    let pageNum = 1;

    const addPage = () => {
      pdf.addPage();
      pageNum++;
      y = margin;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Page ${pageNum} - Ultra Cool Physics Simulator`, margin, 297 - 10);
    };

    const addText = (text: any, size: number = 10, isBold: boolean = false, color: number[] = [0, 0, 0], indent: number = 0) => {
      const safeText = String(text || "");
      if (!safeText.trim()) return;
      pdf.setFontSize(size);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");
      pdf.setTextColor(color[0], color[1], color[2]);
      const lines = pdf.splitTextToSize(safeText, 210 - margin * 2 - indent);
      if (y + (lines.length * lh) > pageHeight) addPage();
      pdf.text(lines, margin + indent, y);
      y += lines.length * lh;
    };

    const addHeader = (text: string) => {
      y += 5;
      if (y > pageHeight - 15) addPage();
      addText(text, 14, true, [15, 23, 42]);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y - lh + 2, 210 - margin, y - lh + 2);
      y += 3;
    };

    // PAGE 1: Title and Abstract
    addText("ULTRA COOL PHYSICS SIMULATOR", 24, true, [15, 23, 42]);
    addText("COMPREHENSIVE THEORETICAL ANALYSIS & EXPERIMENTAL REPORT", 16, true, [100, 100, 100]);
    y += 10;
    addText(`Date Generated: ${new Date().toLocaleString()}`, 11, false, [120, 120, 120]);
    addText(`Experiment Profile ID: EXP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 11, false, [120, 120, 120]);
    y += 10;

    addHeader("ABSTRACT");
    addText(`This report details the simulated outcomes of a high-energy particle physics experiment conducted via the Ultra Cool Physics Simulator framework. The primary objective is to evaluate the interaction of a ${params?.beamEnergyMeV || 0} ${params?.energyUnit || 'MeV'} particle beam through a predefined radiator medium of ${params?.radiatorThicknessMm || 0} mm thickness. By leveraging Monte Carlo approximation techniques and analytical derivations of the Bethe-Bloch and Frank-Tamm equations, we analyze the resulting Cherenkov radiation yield, delta-ray production, stopping power, and secondary electromagnetic cascades. The simulated detector array, utilizing ${detector?.chipset || 'standard'} architecture, captures these interactions to yield high-fidelity dosimetric and spectrometric data. This document provides a fully exhaustive breakdown of the kinematics, theoretical cross-sections, and all explicit simulator configurations set by the operator.`, 11, false, [40, 40, 40]);
    y += 5;

    // PAGE 2: Kinematics & Relativity
    addHeader("1. BEAM KINEMATICS & RELATIVISTIC DERIVATIONS");
    addText("The fundamental behavior of the particle beam is governed by special relativity. The injection parameters dictate a highly relativistic regime, fundamentally altering the time-dilation and length-contraction experienced by the primary incident particles.", 11);
    y += 5;
    addText(`* Initial Beam Energy (E): ${params?.beamEnergyMeV || 0} ${params?.energyUnit || 'MeV'}`, 11, true);
    addText(`* Rest Mass Assumption (m0): Electron (0.511 MeV/c^2) reference`, 11, false, [0,0,0], 5);
    addText(`* Lorentz Factor (gamma = E/m0c^2 + 1): ${Number(summary?.lorentzGamma || 0).toFixed(6)}`, 11, false, [0,0,0], 5);
    addText(`* Relativistic Velocity (beta = v/c): ${Number(summary?.velocityBeta || 0).toFixed(8)}`, 11, false, [0,0,0], 5);
    addText(`* Momentum (p = gamma * m0 * v): Calculated internally for trajectory mapping`, 11, false, [0,0,0], 5);
    y += 5;
    addText("The magnetic and electric fields actively steer the beam prior to radiator entry, determining the incident gyroradius. Deflection alters the effective path length through the radiator.", 11);
    addText(`* Magnetic Field (B): ${params?.magneticFieldTesla || 0} Tesla`, 11, true);
    addText(`* Beam Charge (q): ${params?.beamCharge || 0} e`, 11, false, [0,0,0], 5);
    const gyro = Number(summary?.gyroradiusMeters || 0);
    addText(`* Resulting Gyroradius (r = p/qB): ${gyro > 0 ? gyro.toExponential(4) + ' meters' : 'Infinite (No deflection)'}`, 11, false, [0,0,0], 5);

    addHeader("2. MONTE CARLO ENGINE & SCIENTIFIC INSTRUMENTS");
    addText(`The experiment is executed using the ${params?.monteCarloGenerator || 'NONE'} Monte Carlo core, coupled with the ${params?.eventGenerator || 'Standalone'} event generator.`, 11);
    y += 5;
    addText(`* Facility Profile: ${params?.labFacility || 'Default'}`, 11, false, [0,0,0], 5);
    addText(`* Chamber Shape: ${params?.chamberShape || 'Default'}`, 11, false, [0,0,0], 5);
    addText(`* Simulated Events Per Run: ${params?.mcEventsPerRun || 10000}`, 11, false, [0,0,0], 5);
    addText(`* Particle Spin Assumption: ${params?.particleSpin || '1/2'}`, 11, false, [0,0,0], 5);
    addText(`* Data Acquisition Level-1 Trigger: ${params?.daq?.l1Trigger ? "ON" : "OFF"}`, 11, false, [0,0,0], 5);
    addText(`* Machine Learning Jet Reconstruction: ${params?.reconstruction?.mlJetClassification ? "ON" : "OFF"}`, 11, false, [0,0,0], 5);

    addHeader("3. RADIATOR PROPERTIES & CHERENKOV EMISSION YIELD");
    addText(`The core of the simulation relies on the refractive index of the target medium. When the phase velocity of light in the medium (c/n) is exceeded by the particle's velocity (v), Cherenkov radiation is emitted.`, 11);
    y += 5;
    addText(`* Radiator Material: ${String(params?.materialId || 'Unknown').toUpperCase()}`, 11, true);
    addText(`* Target Isotope: ${String(params?.isotopeId || 'Standard').toUpperCase()}`, 11, false, [0,0,0], 5);
    addText(`* Radiator Thickness: ${params?.radiatorThicknessMm || 0} mm`, 11, false, [0,0,0], 5);
    addText(`* Chamber Length: ${params?.chamberLengthCm || 0} cm`, 11, false, [0,0,0], 5);
    y += 5;
    addText("Using the Frank-Tamm formula, the spectral distribution of emitted photons per unit path length dx and per unit angular frequency dw is evaluated.", 11);
    addText(`* Threshold Velocity (beta_th = 1/n): ${Number(summary?.betaThreshold || 0).toFixed(6)}`, 11, true);
    addText(`* Required Threshold Kinetic Energy: ${Number(summary?.cherenkovThresholdEnergyMeV || 0).toFixed(4)} MeV`, 11, false, [0,0,0], 5);
    addText(`* Mean Cherenkov Emission Angle (theta_c = arccos(1/n*beta)): ${(Number(summary?.cherenkovAngleRad || 0) * 180 / Math.PI).toFixed(4)} deg`, 11, false, [0,0,0], 5);
    addText(`* Estimated Integrated Photon Yield (N): ${Math.floor(Number(summary?.numberPhotonsEmitted || 0)).toLocaleString()} photons`, 11, false, [0,0,0], 5);
    
    addHeader("4. ENERGY LOSS MECHANISMS & DOSIMETRY");
    addText("As the particle traverses the medium, it undergoes continuous energy loss primarily through inelastic collisions with atomic electrons (ionization and excitation) and bremsstrahlung.", 11);
    y += 5;
    const dEdx = Number(summary?.stoppingPower || 0);
    addText(`* Total Stopping Power (dE/dx via Bethe-Bloch): ${dEdx > 0 ? dEdx.toExponential(4) : '0'} MeV/cm`, 11, true);
    addText("This value incorporates density effect corrections at extreme relativistic limits (Fermi plateau) and shell corrections at lower energies.", 11, false, [50, 50, 50], 5);
    y += 5;
    addText("Radiation safety protocols require strict monitoring of the total energy deposited in the detector substrate and surrounding shielding.", 11);
    const radClass = String(summary?.radSafetyClassification || "Safe");
    addText(`* Radiological Classification: ${radClass}`, 12, true, radClass.includes("WARNING") ? [220, 38, 38] : [22, 163, 74]);
    addText(`* Estimated Target Fluence: ${Number(summary?.fluencePhotonsPerMm2 || 0).toLocaleString()} photons/mm^2`, 11, false, [0,0,0], 5);

    addHeader("5. FUNDAMENTAL FORMULAS UTILIZED");
    addText("The following analytical approximations and integrals govern the physics engine constraints within the active environment:", 11);
    y += 5;
    addText("1. Frank-Tamm Equation: d^2N / (dx d(lambda)) = 2 * pi * alpha * z^2 / lambda^2 * (1 - 1 / (beta^2 * n^2))", 10, false, [0,0,0], 5);
    addText("2. Bethe-Bloch Mean Energy Loss: -dE/dx = K * z^2 * (Z/A) * (1/beta^2) * [0.5 * ln(2*me*c^2*beta^2*gamma^2*Tmax / I^2) - beta^2]", 10, false, [0,0,0], 5);
    addText("3. Relativistic Gyro-radius: r = p / (|q| * B) = (gamma * m0 * v) / (|q| * B)", 10, false, [0,0,0], 5);
    addText("4. Particle Fluence Approximation: Phi = N / (4 * pi * r^2)", 10, false, [0,0,0], 5);

    addHeader("6. COMPLETE SIMULATION CONFIGURATION DUMP");
    addText("The following represents the raw Boolean and Numeric configuration states for every subsystem inside the simulation matrix at the time of export. Values are explicitly shown as ON/OFF to indicate the exact state space.", 11);
    y += 5;

    const renderObj = (obj: any, parent: string = "") => {
      if (!obj) return;
      const keys = Object.keys(obj).sort();
      for (const k of keys) {
        if (k === 'componentsActive' || k === 'detector' || k === 'customIsotopeName') continue; // handled elsewhere
        const val = obj[k];
        if (typeof val === 'object' && val !== null) {
          addText(`[${k.toUpperCase()}]`, 10, true, [100,100,100], 5);
          renderObj(val, `${parent}${k}.`);
        } else {
          const isBool = typeof val === 'boolean';
          const displayVal = isBool ? (val ? "ON" : "OFF") : String(val);
          addText(`* ${k}: ${displayVal}`, 10, false, isBool ? (val ? [22, 163, 74] : [220, 38, 38]) : [0,0,0], 5);
        }
      }
    };
    renderObj(params);

    addHeader("7. DETECTOR & READOUT SPECIFICATIONS");
    addText("The simulated data is captured by a highly granular virtual detector array. The physical properties of the sensor dictate the final quantum efficiency, dynamic range, and noise floor.", 11);
    y += 5;
    
    if (detector) {
      const detectorEntries = Object.entries(detector);
      for (let i = 0; i < detectorEntries.length; i++) {
        const [k, v] = detectorEntries[i];
        const formattedKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const isBool = typeof v === 'boolean';
        const displayVal = isBool ? (v ? "ON" : "OFF") : String(v);
        addText(`* ${formattedKey}: ${displayVal}`, 10, false, isBool ? (v ? [22, 163, 74] : [220, 38, 38]) : [0,0,0], 5);
      }
    } else {
      addText("No detector specifications provided.", 11, false, [100,100,100]);
    }

    addHeader("8. THEORETICAL ANALYSIS OF ACTIVE PHYSICAL MODELS");
    addText("The simulation framework dynamically integrates multiple quantum and relativistic interaction models. The following sections provide an exhaustive theoretical breakdown for every physics toggle currently ENABLED (ON) by the user.", 11);
    y += 5;
    
    const descriptions: Record<string, string> = {
      primaryCherenkov: "PRIMARY CHERENKOV RADIATION: Emission of photons when a charged particle exceeds the phase velocity of light in a dielectric medium. Described by the Frank-Tamm formula. The spectral radiance peaks in the ultraviolet and blue regions of the electromagnetic spectrum. In this simulation, the angular distribution and photon count are directly integrated over the radiator path length.",
      secondaryCherenkov: "SECONDARY CHERENKOV (DELTA RAYS): Knock-on electrons (delta rays) generated via hard ionization collisions possessing enough kinetic energy to exceed the local Cherenkov threshold. These create secondary emission cones that widen the total angular spread on the focal plane, simulating complex multi-track topologies.",
      bremsstrahlung: "BREMSSTRAHLUNG (BRAKING RADIATION): Electromagnetic radiation produced by the deceleration of a charged particle when deflected by atomic nuclei. The cross-section scales with Z^2/m^2, making it dominant for light particles (electrons) in heavy targets. The continuous spectrum of bremsstrahlung severely impacts total energy loss at energies > 10 MeV.",
      fluorescence: "FLUORESCENCE / SCINTILLATION: De-excitation of atomic electron shells following ionization, emitting isotropic low-energy photons with characteristic decay times. Scintillation yield is calculated based on Birk's Law, accounting for quenching effects in highly ionizing tracks.",
      detectorBackground: "DETECTOR DARK NOISE / BACKGROUND: Stochastic thermal generation of electron-hole pairs in the silicon substrate (leakage current) and stray environmental radiation. This model injects Poisson-distributed noise into the readout matrix, requiring robust clustering algorithms (like DBSCAN) to extract the true signal.",
      opticalRayleighScattering: "RAYLEIGH SCATTERING: Elastic scattering of optical Cherenkov photons by molecules in the radiator. Heavily attenuates shorter wavelengths (UV/Blue) proportionally to lambda^-4, shifting the detected Cherenkov spectrum towards longer wavelengths (red-shift effect) for thick radiators.",
      comptonScattering: "COMPTON SCATTERING: Inelastic scattering of high-energy photons off loosely bound electrons, transferring momentum and broadening the energy spectrum. Affects the purity of the Cherenkov ring by creating a diffuse background halo of scattered photons.",
      photoelectricIonization: "PHOTOELECTRIC ABSORPTION: Complete absorption of incident photons by inner-shell electrons, dominant at low energies and highly dependent on target atomic number (Z^4). Results in absolute photon loss before reaching the detector face.",
      transitionRadiation: "TRANSITION RADIATION: X-ray photon emission occurring when highly relativistic particles cross boundaries between media of different dielectric constants. Commonly used in TRDs (Transition Radiation Detectors) for particle identification at gamma > 1000.",
      synchrotronRadiation: "SYNCHROTRON RADIATION: Extreme electromagnetic emission caused by the radial acceleration of relativistic charged particles spiraling in a magnetic field. The power radiated scales with gamma^4, creating massive energy sinks in strong transverse magnetic fields.",
      pairProduction: "PAIR PRODUCTION: High-energy photons (E > 1.022 MeV) converting into electron-positron pairs in the strong Coulomb field of a nucleus. This process initiates dense electromagnetic showers, completely obfuscating primary Cherenkov rings in unshielded environments.",
      hadronicShower: "HADRONIC CASCADES: Deep inelastic nuclear scattering resulting in a high-multiplicity shower of pions, kaons, and nuclear fragments. Modeled using highly parametrized Glauber models for interaction lengths.",
      neutrinoOscillation: "NEUTRINO KINEMATICS: Weak-force interactions carrying away missing transverse momentum. While neutrinos rarely interact, this toggle activates theoretical flavor oscillation tracking based on the PMNS matrix over massive baselines (e.g., IceCube).",
      muonDecay: "MUON DECAY: Weak decay of unstable muons into electrons and neutrinos (tau = 2.2 us). Generates delayed coincident signals in the readout electronics.",
      kaonDecay: "KAON DECAY: Strange meson decay channels, critical for studying CP violation. Modeled with proper lifetime sampling and multi-body decay kinematics.",
      bMesonDecay: "B-MESON DECAY: Heavy flavor decay processes characterized by displaced secondary vertices due to the measurable lifespan of bottom quarks (c*tau = 450 um).",
      crystalChanneling: "CRYSTAL CHANNELING: Coherent steering of charged particles between the lattice planes of crystalline radiators. Substantially modifies stopping power and alters Cherenkov angles compared to amorphous media.",
      lowEnergyNeutrons: "THERMAL / SLOW NEUTRONS: Isotropic diffusion of highly scattering, uncharged nucleons moderated by the medium. Requires specialized capture isotopes (e.g., Gadolinium or Boron) for indirect detection.",
      darkMatterScattering: "DARK MATTER SCATTERING (WIMPs): Elastic and inelastic scattering of Weakly Interacting Massive Particles off target nuclei, triggering sub-keV nuclear recoils inside time projection chambers.",
      axionConversion: "AXION-PHOTON CONVERSION: Primakoff effect conversion of hypothetical axions into detectable microwave/X-ray photons inside a strong external magnetic field (Sikivie cavity model).",
      gravitationalWaveLensing: "GRAVITATIONAL LENSING: Micro-lensing of the Cherenkov photon trajectory caused by relativistic passing gravitational wave fronts or localized intense mass densities.",
      planckScaleEffects: "PLANCK SCALE LORENTZ VIOLATION: Anomalous dispersion in the vacuum at ultra-high energies due to hypothesized quantum gravity structures, causing subtle energy-dependent variations in the speed of light.",
      magneticMonopoleSignatures: "MAGNETIC MONOPOLES: Ultra-heavy, highly ionizing tracks possessing quantized magnetic charge (Dirac monopoles). Expected to produce a massive unattenuated Cherenkov/ionization signature.",
      hawkingRadiation: "HAWKING RADIATION: Thermal black-body emission from the event horizon of transient microscopic black holes generated by trans-Planckian particle collisions."
    };

    let hasActive = false;
    Object.entries(params?.componentsActive || {}).forEach(([key, isActive]) => {
      if (isActive && descriptions[key]) {
        addText(`[+] ${descriptions[key]}`, 10, false, [20, 20, 20], 5);
        y += 5;
        hasActive = true;
      } else if (!isActive && descriptions[key]) {
        addText(`[-] ${key}: OFF`, 10, false, [150, 150, 150], 5);
      }
    });
    
    if (!hasActive) {
      addText(`No active quantum interactions were enabled for this run.`, 10, false, [100, 100, 100], 5);
    }

    addHeader("9. STATISTICAL ERROR BOUNDS & SYSTEMATIC UNCERTAINTIES");
    addText("Monte Carlo simulations inherently carry statistical variance. The models utilized in this report assume ideal isotropic media and perfect detector alignment.", 11);
    y += 5;
    addText("Systematic Error Sources:", 11, true);
    addText("1. Thermal fluctuations in the radiator medium altering the local refractive index.", 10, false, [50,50,50], 5);
    addText("2. Cross-talk between adjacent pixels in the readout matrix at high fluences.", 10, false, [50,50,50], 5);
    addText("3. Incomplete hadronic shower containment due to truncated chamber length.", 10, false, [50,50,50], 5);
    y += 10;
    
    addHeader("10. BIBLIOGRAPHY & THEORETICAL REFERENCES");
    addText("[1] Frank, I., & Tamm, I. (1937). Coherent visible radiation of fast electrons passing through matter. Doklady Akademii Nauk SSSR.", 10, false, [0,0,0], 5);
    y += 2;
    addText("[2] Bethe, H. (1930). Zur Theorie des Durchgangs schneller Korpuskularstrahlen durch Materie. Annalen der Physik.", 10, false, [0,0,0], 5);
    y += 2;
    addText("[3] Particle Data Group. (2022). Review of Particle Physics. Progress of Theoretical and Experimental Physics.", 10, false, [0,0,0], 5);
    
    y += 20;
    // Check if we need a final page break just for the footer
    if (y > pageHeight - 15) addPage();
    addText("End of Comprehensive Report.", 12, true, [100, 100, 100]);
    y += 5;
    // Standard ASCII rendering for love to avoid jsPDF unicode font errors
    addText("Generated by Celeritas : Made with <3 github.com/kivitas", 10, false, [150, 150, 150]);

    pdf.save(filename);
  } catch (error: any) {
    console.error("Failed to generate scientific PDF:", error);
    alert(`Failed to generate PDF: ${error?.message || "Unknown error"}`);
  }
};
