import React from "react";

export interface FormulaData {
  id: string;
  title: string;
  description: string;
  equations: string[];
  variables: { symbol: string; meaning: string }[];
  category: string;
}

export const PHYSICS_FORMULAS: FormulaData[] = [
  {
    id: "frank-tamm",
    title: "Frank-Tamm Equation",
    category: "Cherenkov",
    description: "Describes the spectrum and intensity of Cherenkov radiation emitted when a charged particle travels through a dielectric medium faster than the phase velocity of light in that medium.",
    equations: ["\\frac{d^2 N}{dx d\\lambda} = \\frac{2\\pi \\alpha z^2}{\\lambda^2} \\left( 1 - \\frac{1}{\\beta^2 n^2(\\lambda)} \\right)"],
    variables: [
      { symbol: "N", meaning: "Number of photons emitted" },
      { symbol: "\\alpha", meaning: "Fine-structure constant (≈ 1/137)" },
      { symbol: "z", meaning: "Particle charge (in multiples of e)" },
      { symbol: "\\beta", meaning: "Velocity of particle v/c" },
      { symbol: "n(\\lambda)", meaning: "Refractive index of the medium" }
    ]
  },
  {
    id: "bethe-bloch",
    title: "Bethe-Bloch Formula",
    category: "Energy Loss",
    description: "Calculates the mean rate of energy loss (stopping power) of heavy charged particles traversing matter due to ionization and excitation.",
    equations: ["-\\left\\langle \\frac{dE}{dx} \\right\\rangle = \\frac{4\\pi}{m_e c^2} \\cdot \\frac{n z^2}{\\beta^2} \\cdot \\left(\\frac{e^2}{4\\pi\\varepsilon_0}\\right)^2 \\cdot \\left[ \\ln\\left(\\frac{2m_e c^2 \\beta^2}{I \\cdot (1-\\beta^2)}\\right) - \\beta^2 \\right]"],
    variables: [
      { symbol: "-\\langle dE/dx \\rangle", meaning: "Stopping power" },
      { symbol: "n", meaning: "Electron density of target" },
      { symbol: "I", meaning: "Mean excitation potential of target" }
    ]
  },
  {
    id: "lorentz-force",
    title: "Lorentz Force (Magnetic Bending)",
    category: "Kinematics",
    description: "Describes the force exerted on a charged particle moving through an electromagnetic field, used in our simulator to bend trajectories inside the TPC.",
    equations: [
      "\\mathbf{F} = q(\\mathbf{E} + \\mathbf{v} \\times \\mathbf{B})",
      "r = \\frac{p}{qB} = \\frac{\\gamma m_0 v}{qB}"
    ],
    variables: [
      { symbol: "\\mathbf{F}", meaning: "Lorentz Force vector" },
      { symbol: "r", meaning: "Gyroradius (bending radius)" },
      { symbol: "\\gamma", meaning: "Lorentz factor" },
      { symbol: "p", meaning: "Relativistic momentum" }
    ]
  },
  {
    id: "sellmeier",
    title: "Sellmeier Equation",
    category: "Cherenkov",
    description: "Empirical relationship between refractive index and wavelength for a particular transparent medium, enabling our wavelength-dependent Cherenkov cone modeling.",
    equations: ["n^2(\\lambda) = 1 + \\sum_i \\frac{B_i \\lambda^2}{\\lambda^2 - C_i}"],
    variables: [
      { symbol: "B_i, C_i", meaning: "Empirically determined Sellmeier coefficients" },
      { symbol: "\\lambda", meaning: "Wavelength (in micrometers)" }
    ]
  },
  {
    id: "bremsstrahlung",
    title: "Bremsstrahlung Radiation",
    category: "Energy Loss",
    description: "Electromagnetic radiation produced by the deceleration of a charged particle when deflected by another charged particle, typically an electron by an atomic nucleus.",
    equations: ["\\frac{d\\sigma}{dE_\\gamma} \\propto \\frac{Z^2 e^6}{m^2 c^5} \\frac{1}{E_\\gamma} \\ln\\left(\\frac{E_i}{E_f}\\right)"],
    variables: [
      { symbol: "\\sigma", meaning: "Cross-section" },
      { symbol: "Z", meaning: "Atomic number of target" },
      { symbol: "E_\\gamma", meaning: "Photon energy" }
    ]
  },
  {
    id: "compton",
    title: "Compton Scattering (Klein-Nishina)",
    category: "Scattering",
    description: "Inelastic scattering of a photon by a charged particle, usually an electron. It results in a decrease in energy (increase in wavelength) of the photon.",
    equations: [
      "\\lambda' - \\lambda = \\frac{h}{m_e c} (1 - \\cos \\theta)",
      "\\frac{d\\sigma}{d\\Omega} = \\frac{1}{2} r_e^2 \\left(\\frac{\\lambda}{\\lambda'}\\right)^2 \\left[ \\frac{\\lambda}{\\lambda'} + \\frac{\\lambda'}{\\lambda} - \\sin^2 \\theta \\right]"
    ],
    variables: [
      { symbol: "\\theta", meaning: "Scattering angle" },
      { symbol: "\\lambda', \\lambda", meaning: "Final and initial photon wavelengths" },
      { symbol: "r_e", meaning: "Classical electron radius" }
    ]
  },
  {
    id: "photoelectric",
    title: "Photoelectric Effect",
    category: "Quantum",
    description: "Emission of electrons when electromagnetic radiation, such as light, hits a material. Modeled for low-energy photon absorption in the detector material.",
    equations: [
      "E_{kinetic} = h\\nu - \\Phi",
      "\\sigma_{pe} \\propto \\frac{Z^n}{E_\\gamma^3} \\quad (\\text{for } E_\\gamma < 500 \\text{ keV})"
    ],
    variables: [
      { symbol: "\\Phi", meaning: "Work function of the material" },
      { symbol: "h\\nu", meaning: "Incident photon energy" },
      { symbol: "n", meaning: "Exponent (typically 4-5)" }
    ]
  },
  {
    id: "cherenkov-angle",
    title: "Cherenkov Emission Angle",
    category: "Cherenkov",
    description: "The half-angle of the characteristic cone of Cherenkov radiation emitted by a superluminal particle relative to its trajectory vector.",
    equations: ["\\cos \\theta_c = \\frac{1}{\\beta n(\\lambda)}"],
    variables: [
      { symbol: "\\theta_c", meaning: "Cherenkov cone half-angle" },
      { symbol: "\\beta", meaning: "Relativistic speed v/c" },
      { symbol: "n(\\lambda)", meaning: "Refractive index at given wavelength" }
    ]
  },
  {
    id: "moliere",
    title: "Molière Multiple Scattering",
    category: "Scattering",
    description: "Statistical distribution of small-angle deflections a charged particle undergoes as it passes through the Coulomb field of atomic nuclei.",
    equations: ["\\theta_0 \\approx \\frac{13.6 \\text{ MeV}}{\\beta c p} z \\sqrt{\\frac{x}{X_0}} \\left[ 1 + 0.038 \\ln\\left(\\frac{x}{X_0}\\right) \\right]"],
    variables: [
      { symbol: "\\theta_0", meaning: "RMS scattering angle" },
      { symbol: "p, \\beta c", meaning: "Momentum and velocity" },
      { symbol: "x / X_0", meaning: "Material thickness in radiation lengths" }
    ]
  },
  {
    id: "critical-energy",
    title: "Critical Energy Threshold",
    category: "Energy Loss",
    description: "The energy at which ionization losses equal bremsstrahlung radiative losses for electrons in a given material.",
    equations: ["E_c \\approx \\frac{800 \\text{ MeV}}{Z + 1.2}"],
    variables: [
      { symbol: "E_c", meaning: "Critical energy" },
      { symbol: "Z", meaning: "Atomic number of medium" }
    ]
  },
  // Adding ~40 more formulas to satisfy the user's request for "100s of more formulas"
  {
    id: "rayleigh-scattering",
    title: "Rayleigh Scattering",
    category: "Scattering",
    description: "Elastic scattering of light or other electromagnetic radiation by particles much smaller than the wavelength of the radiation.",
    equations: ["\\sigma_R = \\frac{8\\pi}{3} \\left( \\frac{e^2}{4\\pi\\varepsilon_0 m c^2} \\right)^2 \\left( \\frac{2\\pi c}{\\lambda \\omega_0} \\right)^4"],
    variables: [
      { symbol: "\\sigma_R", meaning: "Rayleigh scattering cross-section" },
      { symbol: "\\lambda", meaning: "Wavelength" }
    ]
  },
  {
    id: "relativistic-momentum",
    title: "Relativistic Momentum",
    category: "Kinematics",
    description: "The momentum of a particle moving at relativistic speeds.",
    equations: ["p = \\gamma m_0 v = \\frac{m_0 v}{\\sqrt{1 - v^2/c^2}}"],
    variables: [
      { symbol: "m_0", meaning: "Rest mass" },
      { symbol: "v", meaning: "Velocity" },
      { symbol: "\\gamma", meaning: "Lorentz factor" }
    ]
  },
  {
    id: "relativistic-energy",
    title: "Relativistic Total Energy",
    category: "Kinematics",
    description: "The total energy of a particle moving at relativistic speeds.",
    equations: ["E = \\gamma m_0 c^2 = \\sqrt{(pc)^2 + (m_0 c^2)^2}"],
    variables: [
      { symbol: "E", meaning: "Total energy" },
      { symbol: "p", meaning: "Momentum" },
      { symbol: "m_0 c^2", meaning: "Rest mass energy" }
    ]
  },
  {
    id: "time-dilation",
    title: "Time Dilation",
    category: "Kinematics",
    description: "The difference of elapsed time between two events as measured by observers moving relative to each other.",
    equations: ["\\Delta t = \\gamma \\Delta t_0 = \\frac{\\Delta t_0}{\\sqrt{1 - v^2/c^2}}"],
    variables: [
      { symbol: "\\Delta t", meaning: "Dilated time" },
      { symbol: "\\Delta t_0", meaning: "Proper time" }
    ]
  },
  {
    id: "length-contraction",
    title: "Length Contraction",
    category: "Kinematics",
    description: "The phenomenon that a moving object's length is measured to be shorter than its proper length.",
    equations: ["L = \\frac{L_0}{\\gamma} = L_0 \\sqrt{1 - v^2/c^2}"],
    variables: [
      { symbol: "L", meaning: "Contracted length" },
      { symbol: "L_0", meaning: "Proper length" }
    ]
  },
  {
    id: "bragg-peak",
    title: "Bragg Peak (Energy Deposition)",
    category: "Energy Loss",
    description: "A pronounced peak on the Bragg curve which plots the energy loss of ionizing radiation during its travel through matter.",
    equations: ["D(z) = \\frac{\\Phi_0}{\\rho} \\left| \\frac{dE}{dz} \\right|"],
    variables: [
      { symbol: "D(z)", meaning: "Dose as a function of depth z" },
      { symbol: "\\Phi_0", meaning: "Initial particle fluence" },
      { symbol: "\\rho", meaning: "Density of the medium" }
    ]
  },
  {
    id: "photon-attenuation",
    title: "Beer-Lambert Law (Photon Attenuation)",
    category: "Energy Loss",
    description: "Describes the attenuation of a photon beam as it passes through a material.",
    equations: ["I(x) = I_0 e^{-\\mu x}"],
    variables: [
      { symbol: "I(x)", meaning: "Intensity at depth x" },
      { symbol: "I_0", meaning: "Initial intensity" },
      { symbol: "\\mu", meaning: "Linear attenuation coefficient" }
    ]
  },
  {
    id: "pair-production",
    title: "Pair Production Threshold",
    category: "Quantum",
    description: "The minimum energy a photon must have to create an electron-positron pair.",
    equations: ["E_\\gamma \\ge 2m_e c^2 + \\frac{2(m_e c^2)^2}{M c^2}"],
    variables: [
      { symbol: "E_\\gamma", meaning: "Photon energy" },
      { symbol: "m_e", meaning: "Electron mass" },
      { symbol: "M", meaning: "Mass of recoiling nucleus" }
    ]
  },
  {
    id: "nuclear-interaction-length",
    title: "Nuclear Interaction Length",
    category: "Detectors",
    description: "The mean path length required to reduce the numbers of relativistic neutrons by the factor 1/e.",
    equations: ["\\lambda_I \\approx 35 \\text{ g/cm}^2 \\cdot A^{1/3}"],
    variables: [
      { symbol: "\\lambda_I", meaning: "Nuclear interaction length" },
      { symbol: "A", meaning: "Atomic mass number" }
    ]
  },
  {
    id: "radiation-length",
    title: "Radiation Length",
    category: "Detectors",
    description: "Characteristic distance over which an electron's energy is reduced by 1/e via bremsstrahlung.",
    equations: ["X_0 \\approx \\frac{716.4 \\text{ g/cm}^2 \\cdot A}{Z(Z+1) \\ln(287 / \\sqrt{Z})}"],
    variables: [
      { symbol: "X_0", meaning: "Radiation length" },
      { symbol: "Z", meaning: "Atomic number" },
      { symbol: "A", meaning: "Atomic mass" }
    ]
  },
  {
    id: "schrodinger-eq",
    title: "Time-Dependent Schrödinger Equation",
    category: "Quantum",
    description: "Describes how the quantum state of a physical system changes in time.",
    equations: ["i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\hat{H} \\Psi(\\mathbf{r}, t)"],
    variables: [
      { symbol: "\\Psi", meaning: "Wave function" },
      { symbol: "\\hat{H}", meaning: "Hamiltonian operator" }
    ]
  },
  {
    id: "heisenberg-uncertainty",
    title: "Heisenberg Uncertainty Principle",
    category: "Quantum",
    description: "Fundamental limit to the precision with which certain pairs of physical properties of a particle can be known.",
    equations: ["\\Delta x \\Delta p \\ge \\frac{\\hbar}{2}", "\\Delta E \\Delta t \\ge \\frac{\\hbar}{2}"],
    variables: [
      { symbol: "\\Delta x, \\Delta p", meaning: "Uncertainty in position and momentum" },
      { symbol: "\\Delta E, \\Delta t", meaning: "Uncertainty in energy and time" }
    ]
  },
  {
    id: "de-broglie",
    title: "De Broglie Wavelength",
    category: "Quantum",
    description: "Wavelength manifested in all the objects in quantum mechanics.",
    equations: ["\\lambda = \\frac{h}{p}"],
    variables: [
      { symbol: "\\lambda", meaning: "De Broglie wavelength" },
      { symbol: "p", meaning: "Momentum of the particle" }
    ]
  },
  {
    id: "planck-einstein",
    title: "Planck-Einstein Relation",
    category: "Quantum",
    description: "Relates the energy of a photon to its frequency.",
    equations: ["E = h\\nu = \\frac{hc}{\\lambda}"],
    variables: [
      { symbol: "E", meaning: "Photon energy" },
      { symbol: "\\nu", meaning: "Frequency" },
      { symbol: "h", meaning: "Planck's constant" }
    ]
  },
  {
    id: "cyclotron-frequency",
    title: "Cyclotron Frequency",
    category: "Kinematics",
    description: "The frequency of a charged particle moving perpendicular to the direction of a uniform magnetic field.",
    equations: ["f = \\frac{qB}{2\\pi m}"],
    variables: [
      { symbol: "f", meaning: "Cyclotron frequency" },
      { symbol: "q", meaning: "Charge" },
      { symbol: "B", meaning: "Magnetic field" },
      { symbol: "m", meaning: "Mass of particle" }
    ]
  },
  {
    id: "synchrotron-radiation-power",
    title: "Synchrotron Radiation Power",
    category: "Energy Loss",
    description: "Total power radiated by a charged particle moving at relativistic speeds in a magnetic field.",
    equations: ["P = \\frac{2 e^2 c}{3 \\rho^2} \\beta^4 \\gamma^4"],
    variables: [
      { symbol: "P", meaning: "Radiated power" },
      { symbol: "\\rho", meaning: "Radius of curvature" },
      { symbol: "\\gamma", meaning: "Lorentz factor" }
    ]
  },
  {
    id: "energy-resolution",
    title: "Calorimeter Energy Resolution",
    category: "Detectors",
    description: "Describes the relative uncertainty in energy measurement of a calorimeter.",
    equations: ["\\frac{\\sigma_E}{E} = \\frac{A}{\\sqrt{E}} \\oplus \\frac{B}{E} \\oplus C"],
    variables: [
      { symbol: "A", meaning: "Stochastic term" },
      { symbol: "B", meaning: "Noise term" },
      { symbol: "C", meaning: "Constant term" }
    ]
  },
  {
    id: "momentum-resolution",
    title: "Tracker Momentum Resolution",
    category: "Detectors",
    description: "Describes the relative uncertainty in momentum measurement in a tracking detector.",
    equations: ["\\frac{\\sigma_{p_T}}{p_T} = \\sqrt{(a \\cdot p_T)^2 + b^2}"],
    variables: [
      { symbol: "a", meaning: "Measurement precision term" },
      { symbol: "b", meaning: "Multiple scattering term" }
    ]
  },
  {
    id: "transition-radiation",
    title: "Transition Radiation Intensity",
    category: "Cherenkov", // Grouping with Cherenkov for simplicity
    description: "Energy radiated when a relativistic particle crosses the boundary between two media with different dielectric constants.",
    equations: ["W = \\frac{1}{3} \\alpha z^2 \\gamma \\omega_p"],
    variables: [
      { symbol: "W", meaning: "Total radiated energy" },
      { symbol: "\\gamma", meaning: "Lorentz factor" },
      { symbol: "\\omega_p", meaning: "Plasma frequency of the denser medium" }
    ]
  },
  {
    id: "plasma-frequency",
    title: "Plasma Frequency",
    category: "Quantum",
    description: "The natural frequency of oscillation of electrons in a plasma or solid.",
    equations: ["\\omega_p = \\sqrt{\\frac{n_e e^2}{\\varepsilon_0 m_e}}"],
    variables: [
      { symbol: "n_e", meaning: "Electron number density" },
      { symbol: "m_e", meaning: "Electron mass" }
    ]
  },
  {
    id: "rutherford-scattering",
    title: "Rutherford Scattering",
    category: "Scattering",
    description: "Elastic scattering of charged particles by the Coulomb field of an atomic nucleus.",
    equations: ["\\frac{d\\sigma}{d\\Omega} = \\left( \\frac{z Z e^2}{4\\pi\\varepsilon_0} \\right)^2 \\frac{1}{(4 E_k)^2 \\sin^4(\\theta/2)}"],
    variables: [
      { symbol: "\\sigma", meaning: "Differential cross-section" },
      { symbol: "z, Z", meaning: "Charges of the incident particle and target nucleus" },
      { symbol: "E_k", meaning: "Kinetic energy of the incident particle" },
      { symbol: "\\theta", meaning: "Scattering angle" }
    ]
  },
  {
    id: "klein-gordon",
    title: "Klein-Gordon Equation",
    category: "Quantum",
    description: "Relativistic wave equation for spin-0 particles.",
    equations: ["\\left( \\Box^2 + \\mu^2 \\right) \\psi = 0", "\\frac{1}{c^2} \\frac{\\partial^2 \\psi}{\\partial t^2} - \\nabla^2 \\psi + \\frac{m^2 c^2}{\\hbar^2} \\psi = 0"],
    variables: [
      { symbol: "\\Box^2", meaning: "d'Alembert operator" },
      { symbol: "\\psi", meaning: "Scalar wave function" },
      { symbol: "m", meaning: "Mass of the particle" }
    ]
  },
  {
    id: "dirac-equation",
    title: "Dirac Equation",
    category: "Quantum",
    description: "Relativistic wave equation for spin-1/2 particles (fermions), predicting antimatter.",
    equations: ["(i\\hbar\\gamma^\\mu \\partial_\\mu - mc) \\psi = 0"],
    variables: [
      { symbol: "\\gamma^\\mu", meaning: "Dirac matrices" },
      { symbol: "\\psi", meaning: "Dirac spinor (wave function)" }
    ]
  },
  {
    id: "cherenkov-threshold",
    title: "Cherenkov Threshold Velocity",
    category: "Cherenkov",
    description: "The minimum velocity required for a particle to emit Cherenkov radiation in a medium.",
    equations: ["v_{th} = \\frac{c}{n(\\lambda)}", "\\beta_{th} = \\frac{1}{n(\\lambda)}"],
    variables: [
      { symbol: "v_{th}", meaning: "Threshold velocity" },
      { symbol: "n(\\lambda)", meaning: "Refractive index" }
    ]
  },
  {
    id: "cherenkov-energy-threshold",
    title: "Cherenkov Kinetic Energy Threshold",
    category: "Cherenkov",
    description: "The minimum kinetic energy a particle must have to emit Cherenkov radiation.",
    equations: ["E_k^{th} = m_0 c^2 \\left( \\frac{n}{\\sqrt{n^2 - 1}} - 1 \\right)"],
    variables: [
      { symbol: "E_k^{th}", meaning: "Threshold kinetic energy" },
      { symbol: "m_0", meaning: "Rest mass of the particle" },
      { symbol: "n", meaning: "Refractive index" }
    ]
  },
  {
    id: "snells-law",
    title: "Snell's Law (Refraction)",
    category: "Cherenkov",
    description: "Formula used to describe the relationship between the angles of incidence and refraction for light passing through boundaries.",
    equations: ["n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2"],
    variables: [
      { symbol: "n_1, n_2", meaning: "Refractive indices of medium 1 and 2" },
      { symbol: "\\theta_1, \\theta_2", meaning: "Angles of incidence and refraction" }
    ]
  },
  {
    id: "fresnel-equations",
    title: "Fresnel Equations (Reflection)",
    category: "Cherenkov",
    description: "Describe the fraction of light reflected at the interface between two optical media.",
    equations: ["R = \\left| \\frac{n_1 \\cos\\theta_1 - n_2 \\cos\\theta_2}{n_1 \\cos\\theta_1 + n_2 \\cos\\theta_2} \\right|^2"],
    variables: [
      { symbol: "R", meaning: "Reflectance for normal/parallel polarization" }
    ]
  },
  {
    id: "coulomb-law",
    title: "Coulomb's Law",
    category: "Kinematics",
    description: "The electrostatic force between two point charges.",
    equations: ["F = k_e \\frac{|q_1 q_2|}{r^2}"],
    variables: [
      { symbol: "F", meaning: "Electrostatic force" },
      { symbol: "k_e", meaning: "Coulomb's constant" },
      { symbol: "q_1, q_2", meaning: "Charges" },
      { symbol: "r", meaning: "Distance between charges" }
    ]
  },
  {
    id: "maxwells-equations",
    title: "Maxwell's Equations",
    category: "Kinematics",
    description: "Set of coupled partial differential equations that form the foundation of classical electromagnetism.",
    equations: [
      "\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}",
      "\\nabla \\cdot \\mathbf{B} = 0",
      "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}",
      "\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}"
    ],
    variables: [
      { symbol: "\\mathbf{E}, \\mathbf{B}", meaning: "Electric and Magnetic fields" },
      { symbol: "\\rho, \\mathbf{J}", meaning: "Charge density and current density" }
    ]
  },
  {
    id: "larmor-formula",
    title: "Larmor Formula",
    category: "Energy Loss",
    description: "Used to calculate the total power radiated by a non-relativistic point charge as it accelerates.",
    equations: ["P = \\frac{q^2 a^2}{6\\pi \\varepsilon_0 c^3}"],
    variables: [
      { symbol: "P", meaning: "Radiated power" },
      { symbol: "q", meaning: "Charge of particle" },
      { symbol: "a", meaning: "Acceleration" }
    ]
  },
  {
    id: "lienard-wiechert",
    title: "Liénard-Wiechert Potentials",
    category: "Kinematics",
    description: "Describe the classical electromagnetic effect of a moving electric point charge.",
    equations: ["V(\\mathbf{r}, t) = \\frac{1}{4\\pi\\varepsilon_0} \\left[ \\frac{q}{(1 - \\mathbf{n} \\cdot \\boldsymbol{\\beta}) |\\mathbf{r} - \\mathbf{r}_s|} \\right]_{t_r}"],
    variables: [
      { symbol: "V", meaning: "Electric scalar potential" },
      { symbol: "t_r", meaning: "Retarded time" },
      { symbol: "\\boldsymbol{\\beta}", meaning: "Velocity normalized to c" }
    ]
  },
  {
    id: "boltzmann-distribution",
    title: "Maxwell-Boltzmann Distribution",
    category: "Kinematics",
    description: "Describes the distribution of speeds of particles in an idealized gas.",
    equations: ["f(v) = \\left( \\frac{m}{2\\pi kT} \\right)^{3/2} 4\\pi v^2 e^{-\\frac{mv^2}{2kT}}"],
    variables: [
      { symbol: "f(v)", meaning: "Probability density of speed v" },
      { symbol: "T", meaning: "Thermodynamic temperature" },
      { symbol: "k", meaning: "Boltzmann constant" }
    ]
  },
  {
    id: "fermi-dirac",
    title: "Fermi-Dirac Statistics",
    category: "Quantum",
    description: "Describes the distribution of particles over energy states in systems consisting of many identical fermions.",
    equations: ["\\bar{n}_i = \\frac{1}{e^{(E_i - \\mu)/kT} + 1}"],
    variables: [
      { symbol: "\\bar{n}_i", meaning: "Average number of particles in state i" },
      { symbol: "E_i", meaning: "Energy of state i" },
      { symbol: "\\mu", meaning: "Chemical potential (Fermi energy at T=0)" }
    ]
  },
  {
    id: "bose-einstein",
    title: "Bose-Einstein Statistics",
    category: "Quantum",
    description: "Describes the statistical distribution of identical bosons over the energy states in thermal equilibrium.",
    equations: ["\\bar{n}_i = \\frac{1}{e^{(E_i - \\mu)/kT} - 1}"],
    variables: [
      { symbol: "\\bar{n}_i", meaning: "Average number of particles in state i" },
      { symbol: "E_i", meaning: "Energy of state i" }
    ]
  },
  {
    id: "plancks-law",
    title: "Planck's Law",
    category: "Quantum",
    description: "Describes the spectral density of electromagnetic radiation emitted by a black body in thermal equilibrium.",
    equations: ["B_\\nu(T) = \\frac{2h\\nu^3}{c^2} \\frac{1}{e^{\\frac{h\\nu}{kT}} - 1}"],
    variables: [
      { symbol: "B_\\nu", meaning: "Spectral radiance" },
      { symbol: "\\nu", meaning: "Frequency" },
      { symbol: "T", meaning: "Absolute temperature" }
    ]
  },
  {
    id: "stefan-boltzmann",
    title: "Stefan-Boltzmann Law",
    category: "Quantum",
    description: "Describes the power radiated from a black body in terms of its temperature.",
    equations: ["j^{\\star} = \\sigma T^4"],
    variables: [
      { symbol: "j^{\\star}", meaning: "Black-body radiant emittance" },
      { symbol: "\\sigma", meaning: "Stefan-Boltzmann constant" },
      { symbol: "T", meaning: "Thermodynamic temperature" }
    ]
  },
  {
    id: "weins-law",
    title: "Wien's Displacement Law",
    category: "Quantum",
    description: "States that the black-body radiation curve for different temperatures will peak at different wavelengths that are inversely proportional to the temperature.",
    equations: ["\\lambda_{\\text{max}} = \\frac{b}{T}"],
    variables: [
      { symbol: "\\lambda_{\\text{max}}", meaning: "Peak wavelength" },
      { symbol: "b", meaning: "Wien's displacement constant" }
    ]
  },
  {
    id: "mass-energy",
    title: "Mass-Energy Equivalence",
    category: "Kinematics",
    description: "The principle that anything having mass has an equivalent amount of energy and vice versa.",
    equations: ["E = mc^2"],
    variables: [
      { symbol: "E", meaning: "Energy" },
      { symbol: "m", meaning: "Relativistic mass" },
      { symbol: "c", meaning: "Speed of light in vacuum" }
    ]
  },
  {
    id: "four-momentum",
    title: "Four-Momentum Invariant",
    category: "Kinematics",
    description: "The invariant mass of a system of particles in special relativity.",
    equations: ["P^\\mu P_\\mu = \\frac{E^2}{c^2} - |\\mathbf{p}|^2 = (m_0 c)^2"],
    variables: [
      { symbol: "P^\\mu", meaning: "Four-momentum vector" },
      { symbol: "E", meaning: "Total energy" },
      { symbol: "\\mathbf{p}", meaning: "Three-momentum" },
      { symbol: "m_0", meaning: "Rest mass" }
    ]
  },
  {
    id: "compton-wavelength",
    title: "Compton Wavelength",
    category: "Quantum",
    description: "A quantum mechanical property of a particle equal to the wavelength of a photon whose energy is the same as the rest-mass energy of that particle.",
    equations: ["\\lambda_c = \\frac{h}{m c}"],
    variables: [
      { symbol: "\\lambda_c", meaning: "Compton wavelength" },
      { symbol: "m", meaning: "Particle rest mass" }
    ]
  },
  {
    id: "rydberg-formula",
    title: "Rydberg Formula",
    category: "Quantum",
    description: "Predicts the wavelengths of photons emitted by changes in the energy level of an electron in a hydrogen atom.",
    equations: ["\\frac{1}{\\lambda} = R_H \\left( \\frac{1}{n_1^2} - \\frac{1}{n_2^2} \\right)"],
    variables: [
      { symbol: "R_H", meaning: "Rydberg constant" },
      { symbol: "n_1, n_2", meaning: "Principal quantum numbers" }
    ]
  },
  {
    id: "bragg-diffraction",
    title: "Bragg's Law",
    category: "Scattering",
    description: "Gives the angles for coherent and incoherent scattering from a crystal lattice.",
    equations: ["n \\lambda = 2d \\sin \\theta"],
    variables: [
      { symbol: "n", meaning: "Order of reflection" },
      { symbol: "d", meaning: "Lattice spacing" },
      { symbol: "\\theta", meaning: "Scattering angle" }
    ]
  },
  {
    id: "schwarzschild-radius",
    title: "Schwarzschild Radius",
    category: "Kinematics",
    description: "The radius of the event horizon of a Schwarzschild black hole.",
    equations: ["r_s = \\frac{2GM}{c^2}"],
    variables: [
      { symbol: "r_s", meaning: "Schwarzschild radius" },
      { symbol: "G", meaning: "Gravitational constant" },
      { symbol: "M", meaning: "Mass of the object" }
    ]
  },
  {
    id: "hawking-radiation",
    title: "Hawking Radiation Temperature",
    category: "Quantum",
    description: "The thermal radiation predicted to be spontaneously emitted by black holes.",
    equations: ["T_H = \\frac{\\hbar c^3}{8 \\pi G M k_B}"],
    variables: [
      { symbol: "T_H", meaning: "Hawking temperature" },
      { symbol: "M", meaning: "Mass of the black hole" }
    ]
  },
  {
    id: "pauli-exclusion",
    title: "Pauli Exclusion Principle (Fermions)",
    category: "Quantum",
    description: "Two identical fermions cannot occupy the same quantum state simultaneously.",
    equations: ["\\Psi(x_1, x_2) = -\\Psi(x_2, x_1)"],
    variables: [
      { symbol: "\\Psi", meaning: "Total wave function of a multi-fermion system" }
    ]
  },
  {
    id: "casimir-effect",
    title: "Casimir Effect Force",
    category: "Quantum",
    description: "Attractive force between two uncharged conducting plates due to quantum vacuum fluctuations.",
    equations: ["\\frac{F}{A} = -\\frac{\\pi^2 \\hbar c}{240 d^4}"],
    variables: [
      { symbol: "F/A", meaning: "Force per unit area" },
      { symbol: "d", meaning: "Distance between plates" }
    ]
  },
  {
    id: "unruh-effect",
    title: "Unruh Effect",
    category: "Quantum",
    description: "Prediction that an accelerating observer will observe black-body radiation where an inertial observer would observe none.",
    equations: ["T = \\frac{\\hbar a}{2\\pi c k_B}"],
    variables: [
      { symbol: "T", meaning: "Effective temperature" },
      { symbol: "a", meaning: "Local acceleration" }
    ]
  },
  {
    id: "fine-structure",
    title: "Fine Structure Constant",
    category: "Quantum",
    description: "Fundamental physical constant characterizing the strength of the electromagnetic interaction.",
    equations: ["\\alpha = \\frac{e^2}{4\\pi \\varepsilon_0 \\hbar c} \\approx \\frac{1}{137}"],
    variables: [
      { symbol: "\\alpha", meaning: "Fine structure constant" }
    ]
  },
  {
    id: "planck-length",
    title: "Planck Length",
    category: "Quantum",
    description: "The scale at which classical ideas about gravity and space-time cease to be valid.",
    equations: ["l_p = \\sqrt{\\frac{\\hbar G}{c^3}}"],
    variables: [
      { symbol: "l_p", meaning: "Planck length" }
    ]
  },
  {
    id: "hubbles-law",
    title: "Hubble's Law",
    category: "Kinematics",
    description: "The observation in physical cosmology that galaxies are moving away from the Earth at speeds proportional to their distance.",
    equations: ["v = H_0 D"],
    variables: [
      { symbol: "v", meaning: "Recessional velocity" },
      { symbol: "H_0", meaning: "Hubble constant" },
      { symbol: "D", meaning: "Proper distance" }
    ]
  },
  {
    id: "friedmann-equation",
    title: "Friedmann Equation",
    category: "Kinematics",
    description: "Governs the expansion of space in homogeneous and isotropic models of the universe.",
    equations: ["\\left(\\frac{\\dot{a}}{a}\\right)^2 = \\frac{8\\pi G}{3}\\rho - \\frac{kc^2}{a^2} + \\frac{\\Lambda c^2}{3}"],
    variables: [
      { symbol: "a", meaning: "Scale factor" },
      { symbol: "\\rho", meaning: "Energy density" },
      { symbol: "\\Lambda", meaning: "Cosmological constant" }
    ]
  },
  {
    id: "navier-stokes",
    title: "Navier-Stokes Equation",
    category: "Kinematics",
    description: "Describes the motion of viscous fluid substances.",
    equations: ["\\rho \\left( \\frac{\\partial \\mathbf{u}}{\\partial t} + \\mathbf{u} \\cdot \\nabla \\mathbf{u} \\right) = -\\nabla p + \\mu \\nabla^2 \\mathbf{u} + \\mathbf{f}"],
    variables: [
      { symbol: "\\mathbf{u}", meaning: "Flow velocity" },
      { symbol: "\\mu", meaning: "Dynamic viscosity" },
      { symbol: "p", meaning: "Pressure" }
    ]
  },
  {
    id: "schrodinger-time-independent",
    title: "Time-Independent Schrödinger Equation",
    category: "Quantum",
    description: "Predicts that wave functions can form standing waves, called stationary states.",
    equations: ["\\left[ -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r}) \\right] \\psi(\\mathbf{r}) = E \\psi(\\mathbf{r})"],
    variables: [
      { symbol: "V(\\mathbf{r})", meaning: "Potential energy" },
      { symbol: "E", meaning: "Energy eigenvalue" }
    ]
  },
  {
    id: "lorentz-transform",
    title: "Lorentz Transformation (Time)",
    category: "Kinematics",
    description: "How the time coordinate of one frame changes into another frame moving at constant velocity.",
    equations: ["t' = \\gamma \\left( t - \\frac{vx}{c^2} \\right)"],
    variables: [
      { symbol: "t'", meaning: "Time in moving frame" },
      { symbol: "\\gamma", meaning: "Lorentz factor" }
    ]
  },
  {
    id: "lorentz-transform-x",
    title: "Lorentz Transformation (Space)",
    category: "Kinematics",
    description: "How the spatial coordinate of one frame changes into another frame moving at constant velocity.",
    equations: ["x' = \\gamma (x - vt)"],
    variables: [
      { symbol: "x'", meaning: "Position in moving frame" }
    ]
  },
  {
    id: "velocity-addition",
    title: "Relativistic Velocity Addition",
    category: "Kinematics",
    description: "Calculates the relative velocity of two objects moving at relativistic speeds.",
    equations: ["u = \\frac{v + u'}{1 + \\frac{v u'}{c^2}}"],
    variables: [
      { symbol: "u", meaning: "Velocity observed in unprimed frame" },
      { symbol: "u'", meaning: "Velocity in primed frame" },
      { symbol: "v", meaning: "Relative velocity of frames" }
    ]
  },
  {
    id: "doppler-effect-light",
    title: "Relativistic Doppler Effect",
    category: "Kinematics",
    description: "Change in frequency of light caused by the relative motion of the source and the observer.",
    equations: ["f_o = f_s \\sqrt{\\frac{1 - v/c}{1 + v/c}}"],
    variables: [
      { symbol: "f_o, f_s", meaning: "Observed and source frequencies" },
      { symbol: "v", meaning: "Velocity of source moving away" }
    ]
  },
  {
    id: "chern-simons",
    title: "Chern-Simons Form (3D)",
    category: "Quantum",
    description: "Topological term in quantum field theory and condensed matter.",
    equations: ["S = \\frac{k}{4\\pi} \\int \\text{Tr}\\left(A \\wedge dA + \\frac{2}{3} A \\wedge A \\wedge A\\right)"],
    variables: [
      { symbol: "A", meaning: "Gauge connection" },
      { symbol: "k", meaning: "Level (integer)" }
    ]
  },
  {
    id: "gross-pitaevskii",
    title: "Gross-Pitaevskii Equation",
    category: "Quantum",
    description: "Describes the ground state of a quantum system of identical bosons using the pseudopotential interaction model.",
    equations: ["i\\hbar\\frac{\\partial \\psi}{\\partial t} = \\left( -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r}) + g|\\psi|^2 \\right) \\psi"],
    variables: [
      { symbol: "\\psi", meaning: "Condensate wave function" },
      { symbol: "g", meaning: "Interaction coupling constant" }
    ]
  },
  {
    id: "london-penetration",
    title: "London Penetration Depth",
    category: "Electromagnetism",
    description: "The distance to which a magnetic field penetrates into a superconductor and becomes exponentially small.",
    equations: ["\\lambda_L = \\sqrt{\\frac{m}{\\mu_0 n_s e^2}}"],
    variables: [
      { symbol: "\\lambda_L", meaning: "Penetration depth" },
      { symbol: "n_s", meaning: "Superconducting carrier density" }
    ]
  },
  {
    id: "josephson-effect",
    title: "Josephson Effect (AC)",
    category: "Quantum",
    description: "Phenomenon of supercurrent across a device consisting of two superconductors separated by a weak link.",
    equations: ["\\frac{d\\phi}{dt} = \\frac{2e}{\\hbar} V"],
    variables: [
      { symbol: "\\phi", meaning: "Phase difference" },
      { symbol: "V", meaning: "Voltage across junction" }
    ]
  },
  {
    id: "hall-effect",
    title: "Hall Voltage",
    category: "Electromagnetism",
    description: "Production of a voltage difference across an electrical conductor, transverse to an electric current and an applied magnetic field.",
    equations: ["V_H = \\frac{I B}{n t e}"],
    variables: [
      { symbol: "V_H", meaning: "Hall voltage" },
      { symbol: "I", meaning: "Current" },
      { symbol: "B", meaning: "Magnetic field" },
      { symbol: "t", meaning: "Thickness of plate" },
      { symbol: "n", meaning: "Charge carrier density" }
    ]
  },
  {
    id: "biot-savart",
    title: "Biot-Savart Law",
    category: "Electromagnetism",
    description: "Equation describing the magnetic field generated by a constant electric current.",
    equations: ["d\\mathbf{B} = \\frac{\\mu_0}{4\\pi} \\frac{I d\\mathbf{l} \\times \\mathbf{\\hat{r}}}{r^2}"],
    variables: [
      { symbol: "d\\mathbf{B}", meaning: "Differential magnetic field" },
      { symbol: "I d\\mathbf{l}", meaning: "Current element" }
    ]
  },
  {
    id: "ampere-maxwell",
    title: "Ampère-Maxwell Law",
    category: "Electromagnetism",
    description: "Relates the integrated magnetic field around a closed loop to the electric current passing through the loop.",
    equations: ["\\oint \\mathbf{B} \\cdot d\\mathbf{l} = \\mu_0 I_{\\text{enc}} + \\mu_0 \\varepsilon_0 \\frac{d\\Phi_E}{dt}"],
    variables: [
      { symbol: "I_{\\text{enc}}", meaning: "Enclosed current" },
      { symbol: "\\Phi_E", meaning: "Electric flux" }
    ]
  },
  {
    id: "faradays-law",
    title: "Faraday's Law of Induction",
    category: "Electromagnetism",
    description: "Predicts how a magnetic field will interact with an electric circuit to produce an electromotive force (EMF).",
    equations: ["\\mathcal{E} = -\\frac{d\\Phi_B}{dt}"],
    variables: [
      { symbol: "\\mathcal{E}", meaning: "Electromotive force" },
      { symbol: "\\Phi_B", meaning: "Magnetic flux" }
    ]
  },
  {
    id: "poynting-vector",
    title: "Poynting Vector",
    category: "Electromagnetism",
    description: "Directional energy flux (the energy transfer per unit area per unit time) of an electromagnetic field.",
    equations: ["\\mathbf{S} = \\frac{1}{\\mu_0} \\mathbf{E} \\times \\mathbf{B}"],
    variables: [
      { symbol: "\\mathbf{S}", meaning: "Poynting vector" },
      { symbol: "\\mathbf{E}, \\mathbf{B}", meaning: "Electric and Magnetic fields" }
    ]
  },
  {
    id: "lennard-jones",
    title: "Lennard-Jones Potential",
    category: "Thermodynamics",
    description: "Intermolecular potential describing the interaction between two uncharged molecules or atoms.",
    equations: ["V(r) = 4\\varepsilon \\left[ \\left(\\frac{\\sigma}{r}\\right)^{12} - \\left(\\frac{\\sigma}{r}\\right)^6 \\right]"],
    variables: [
      { symbol: "\\varepsilon", meaning: "Depth of the potential well" },
      { symbol: "\\sigma", meaning: "Distance at which inter-particle potential is zero" }
    ]
  },
  {
    id: "ideal-gas",
    title: "Ideal Gas Law",
    category: "Thermodynamics",
    description: "Equation of state of a hypothetical ideal gas.",
    equations: ["PV = nRT = NkT"],
    variables: [
      { symbol: "P, V", meaning: "Pressure and Volume" },
      { symbol: "T", meaning: "Absolute temperature" },
      { symbol: "R", meaning: "Ideal gas constant" }
    ]
  },
  {
    id: "partition-function",
    title: "Canonical Partition Function",
    category: "Thermodynamics",
    description: "Encodes the statistical properties of a system in thermodynamic equilibrium.",
    equations: ["Z = \\sum_i e^{-E_i / (k_B T)}"],
    variables: [
      { symbol: "Z", meaning: "Partition function" },
      { symbol: "E_i", meaning: "Energy of microstate i" }
    ]
  },
  {
    id: "entropy-boltzmann",
    title: "Boltzmann's Entropy Formula",
    category: "Thermodynamics",
    description: "Relates the entropy of a macrostate to the number of corresponding microstates.",
    equations: ["S = k_B \\ln W"],
    variables: [
      { symbol: "S", meaning: "Entropy" },
      { symbol: "W", meaning: "Number of microstates" }
    ]
  },
  {
    id: "gibbs-free-energy",
    title: "Gibbs Free Energy",
    category: "Thermodynamics",
    description: "Thermodynamic potential that can be used to calculate the maximum of reversible work that may be performed by a thermodynamic system.",
    equations: ["G = H - TS"],
    variables: [
      { symbol: "G", meaning: "Gibbs free energy" },
      { symbol: "H", meaning: "Enthalpy" },
      { symbol: "S", meaning: "Entropy" }
    ]
  },
  {
    id: "clausius-clapeyron",
    title: "Clausius-Clapeyron Relation",
    category: "Thermodynamics",
    description: "Characterizes a discontinuous phase transition between two phases of matter of a single constituent.",
    equations: ["\\frac{dP}{dT} = \\frac{L}{T \\Delta V}"],
    variables: [
      { symbol: "L", meaning: "Specific latent heat" },
      { symbol: "\\Delta V", meaning: "Specific volume change" }
    ]
  },
  {
    id: "heat-equation",
    title: "Heat Equation",
    category: "Thermodynamics",
    description: "Parabolic partial differential equation that describes the distribution of heat (or variation in temperature) in a given region over time.",
    equations: ["\\frac{\\partial u}{\\partial t} = \\alpha \\nabla^2 u"],
    variables: [
      { symbol: "u", meaning: "Temperature" },
      { symbol: "\\alpha", meaning: "Thermal diffusivity" }
    ]
  },
  {
    id: "carnot-efficiency",
    title: "Carnot Efficiency",
    category: "Thermodynamics",
    description: "Maximum theoretical efficiency for a heat engine operating between two temperatures.",
    equations: ["\\eta = 1 - \\frac{T_C}{T_H}"],
    variables: [
      { symbol: "\\eta", meaning: "Efficiency" },
      { symbol: "T_C, T_H", meaning: "Cold and Hot reservoir temperatures" }
    ]
  },
  {
    id: "vanderwaals",
    title: "Van der Waals Equation",
    category: "Thermodynamics",
    description: "Equation of state for a fluid composed of particles that have a non-zero volume and a pairwise attractive inter-particle force.",
    equations: ["\\left( P + a\\left(\\frac{n}{V}\\right)^2 \\right) (V - nb) = nRT"],
    variables: [
      { symbol: "a, b", meaning: "Substance-specific constants" }
    ]
  },
  {
    id: "equipartition-theorem",
    title: "Equipartition Theorem",
    category: "Thermodynamics",
    description: "Relates the temperature of a system to its average energies.",
    equations: ["\\langle E \\rangle = \\frac{1}{2} f k_B T"],
    variables: [
      { symbol: "f", meaning: "Degrees of freedom" },
      { symbol: "\\langle E \\rangle", meaning: "Average kinetic energy" }
    ]
  },
  {
    id: "planck-mass",
    title: "Planck Mass",
    category: "Quantum",
    description: "The mass of a black hole whose Schwarzschild radius is equal to its Compton wavelength.",
    equations: ["m_P = \\sqrt{\\frac{\\hbar c}{G}}"],
    variables: [
      { symbol: "m_P", meaning: "Planck mass" }
    ]
  },
  {
    id: "planck-time",
    title: "Planck Time",
    category: "Quantum",
    description: "The time required for light to travel a distance of 1 Planck length in a vacuum.",
    equations: ["t_P = \\sqrt{\\frac{\\hbar G}{c^5}}"],
    variables: [
      { symbol: "t_P", meaning: "Planck time" }
    ]
  },
  {
    id: "hawking-bekenstein",
    title: "Bekenstein-Hawking Entropy",
    category: "Quantum",
    description: "The amount of entropy that must be assigned to a black hole in order for it to comply with the laws of thermodynamics.",
    equations: ["S_{BH} = \\frac{k_B c^3 A}{4 G \\hbar}"],
    variables: [
      { symbol: "S_{BH}", meaning: "Black hole entropy" },
      { symbol: "A", meaning: "Area of the event horizon" }
    ]
  },
  {
    id: "larmor-precession",
    title: "Larmor Precession Frequency",
    category: "Quantum",
    description: "The precession of the magnetic moment of an object about an external magnetic field.",
    equations: ["\\omega_L = \\gamma B"],
    variables: [
      { symbol: "\\omega_L", meaning: "Angular frequency of precession" },
      { symbol: "\\gamma", meaning: "Gyromagnetic ratio" },
      { symbol: "B", meaning: "Magnetic field strength" }
    ]
  },
  {
    id: "g-factor",
    title: "Electron g-factor",
    category: "Quantum",
    description: "Dimensionless quantity that characterizes the magnetic moment and gyromagnetic ratio of a particle.",
    equations: ["\\boldsymbol{\\mu} = -g \\frac{\\mu_B}{\\hbar} \\mathbf{S}"],
    variables: [
      { symbol: "\\boldsymbol{\\mu}", meaning: "Magnetic moment" },
      { symbol: "g", meaning: "g-factor (approx 2 for electron)" },
      { symbol: "\\mathbf{S}", meaning: "Spin angular momentum" }
    ]
  },
  {
    id: "landau-levels",
    title: "Landau Levels Energy",
    category: "Quantum",
    description: "The quantization of the cyclotron orbits of charged particles in magnetic fields.",
    equations: ["E_n = \\hbar \\omega_c \\left( n + \\frac{1}{2} \\right)"],
    variables: [
      { symbol: "\\omega_c", meaning: "Cyclotron frequency" },
      { symbol: "n", meaning: "Landau level index (integer)" }
    ]
  },
  {
    id: "aharonov-bohm",
    title: "Aharonov-Bohm Phase",
    category: "Quantum",
    description: "Quantum mechanical phase shift introduced by a magnetic vector potential, even where the magnetic field is zero.",
    equations: ["\\Delta \\phi = \\frac{q}{\\hbar} \\oint \\mathbf{A} \\cdot d\\mathbf{x} = \\frac{q \\Phi_B}{\\hbar}"],
    variables: [
      { symbol: "\\mathbf{A}", meaning: "Magnetic vector potential" },
      { symbol: "\\Phi_B", meaning: "Magnetic flux" }
    ]
  },
  {
    id: "berry-phase",
    title: "Berry Phase",
    category: "Quantum",
    description: "A geometric phase acquired over the course of a cycle, when a system is subjected to cyclic adiabatic processes.",
    equations: ["\\gamma_n = i \\oint_C \\langle n(\\mathbf{R}) | \\nabla_{\\mathbf{R}} | n(\\mathbf{R}) \\rangle \\cdot d\\mathbf{R}"],
    variables: [
      { symbol: "\\gamma_n", meaning: "Berry phase" },
      { symbol: "\\mathbf{R}", meaning: "Parameter space coordinates" }
    ]
  },
  {
    id: "mach-cone",
    title: "Mach Cone Angle",
    category: "Scattering", // Grouped conceptually
    description: "The angle of a shock wave produced by an object moving faster than the speed of sound.",
    equations: ["\\sin \\alpha = \\frac{v}{v_s} = \\frac{1}{M}"],
    variables: [
      { symbol: "\\alpha", meaning: "Mach angle" },
      { symbol: "M", meaning: "Mach number" },
      { symbol: "v_s, v", meaning: "Speed of sound and object" }
    ]
  },
  {
    id: "euler-lagrange",
    title: "Euler-Lagrange Equation",
    category: "Kinematics",
    description: "The fundamental equation of the calculus of variations, heavily used in classical mechanics.",
    equations: ["\\frac{d}{dt} \\left( \\frac{\\partial L}{\\partial \\dot{q}} \\right) - \\frac{\\partial L}{\\partial q} = 0"],
    variables: [
      { symbol: "L", meaning: "Lagrangian (T - V)" },
      { symbol: "q", meaning: "Generalized coordinate" }
    ]
  },
  {
    id: "hamiltons-equations",
    title: "Hamilton's Equations",
    category: "Kinematics",
    description: "A reformulation of classical mechanics using positions and momenta as variables.",
    equations: [
      "\\dot{q} = \\frac{\\partial H}{\\partial p}",
      "\\dot{p} = -\\frac{\\partial H}{\\partial q}"
    ],
    variables: [
      { symbol: "H", meaning: "Hamiltonian" },
      { symbol: "q, p", meaning: "Coordinate and conjugate momentum" }
    ]
  },
  {
    id: "poisson-bracket",
    title: "Poisson Bracket",
    category: "Kinematics",
    description: "An important operation in Hamiltonian mechanics playing a central role in time evolution.",
    equations: ["\\{f, g\\} = \\sum_{i} \\left( \\frac{\\partial f}{\\partial q_i} \\frac{\\partial g}{\\partial p_i} - \\frac{\\partial f}{\\partial p_i} \\frac{\\partial g}{\\partial q_i} \\right)"],
    variables: [
      { symbol: "\\{f, g\\}", meaning: "Poisson bracket of observables f and g" }
    ]
  },
  {
    id: "virial-theorem",
    title: "Virial Theorem",
    category: "Kinematics",
    description: "Relates the average time total kinetic energy of a stable system bound by potential forces to its total potential energy.",
    equations: ["\\langle T \\rangle = -\\frac{1}{2} \\sum_{k=1}^N \\langle \\mathbf{F}_k \\cdot \\mathbf{r}_k \\rangle"],
    variables: [
      { symbol: "\\langle T \\rangle", meaning: "Time-averaged total kinetic energy" },
      { symbol: "\\mathbf{F}_k", meaning: "Force on the k-th particle" }
    ]
  },
  {
    id: "stokes-theorem",
    title: "Stokes' Theorem",
    category: "Electromagnetism",
    description: "Relates the surface integral of the curl of a vector field over a surface to the line integral of the vector field over its boundary.",
    equations: ["\\iint_{\\Sigma} (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{\\Sigma} = \\oint_{\\partial \\Sigma} \\mathbf{F} \\cdot d\\mathbf{r}"],
    variables: [
      { symbol: "\\mathbf{F}", meaning: "Vector field" },
      { symbol: "\\Sigma", meaning: "Surface" }
    ]
  },
  {
    id: "gauss-divergence",
    title: "Divergence Theorem",
    category: "Electromagnetism",
    description: "Relates the flux of a vector field through a closed surface to the divergence of the field in the volume enclosed.",
    equations: ["\\iiint_V (\\nabla \\cdot \\mathbf{F}) \\, dV = \\oiint_S \\mathbf{F} \\cdot d\\mathbf{S}"],
    variables: [
      { symbol: "\\mathbf{F}", meaning: "Vector field" },
      { symbol: "V", meaning: "Volume" }
    ]
  },
  {
    id: "bethe-bloch",
    title: "Bethe-Bloch Formula",
    category: "Energy Loss",
    description: "Mean rate of energy loss (stopping power) of a heavy charged particle traversing matter.",
    equations: ["-\\left\\langle \\frac{dE}{dx} \\right\\rangle = K z^2 \\frac{Z}{A} \\frac{1}{\\beta^2} \\left[ \\frac{1}{2} \\ln \\frac{2 m_e c^2 \\beta^2 \\gamma^2 T_{\\text{max}}}{I^2} - \\beta^2 - \\frac{\\delta(\\beta\\gamma)}{2} \\right]"],
    variables: [
      { symbol: "z", meaning: "Charge of incident particle" },
      { symbol: "Z, A", meaning: "Atomic number and mass of absorber" },
      { symbol: "I", meaning: "Mean excitation energy" }
    ]
  },
  {
    id: "frank-tamm",
    title: "Frank-Tamm Formula",
    category: "Cherenkov",
    description: "Describes the energy emitted as Cherenkov radiation per unit length.",
    equations: ["\\frac{d^2E}{dx d\\omega} = \\frac{q^2}{4\\pi}\\mu(\\omega)\\omega \\left(1 - \\frac{c^2}{v^2 n^2(\\omega)} \\right)"],
    variables: [
      { symbol: "q", meaning: "Particle charge" },
      { symbol: "n(\\omega)", meaning: "Refractive index" }
    ]
  },
  {
    id: "cherenkov-photon-yield",
    title: "Cherenkov Photon Yield",
    category: "Cherenkov",
    description: "Number of Cherenkov photons emitted per unit path length and wavelength interval.",
    equations: ["\\frac{d^2 N}{dx d\\lambda} = \\frac{2\\pi\\alpha z^2}{\\lambda^2} \\left( 1 - \\frac{1}{\\beta^2 n^2(\\lambda)} \\right)"],
    variables: [
      { symbol: "\\alpha", meaning: "Fine structure constant" },
      { symbol: "\\lambda", meaning: "Wavelength" }
    ]
  },
  {
    id: "radiation-length",
    title: "Radiation Length",
    category: "Calorimetry",
    description: "Mean distance over which a high-energy electron loses all but 1/e of its energy by bremsstrahlung.",
    equations: ["X_0 \\approx \\frac{716.4 \\, \\text{g/cm}^2 A}{Z(Z+1) \\ln(287/\\sqrt{Z})}"],
    variables: [
      { symbol: "X_0", meaning: "Radiation length" },
      { symbol: "Z, A", meaning: "Atomic number and mass of material" }
    ]
  },
  {
    id: "moliere-radius",
    title: "Molière Radius",
    category: "Calorimetry",
    description: "Characteristic constant describing the transverse scale of electromagnetic showers.",
    equations: ["R_M = X_0 \\frac{E_s}{E_c} \\approx 21 \\, \\text{MeV} \\frac{X_0}{E_c}"],
    variables: [
      { symbol: "R_M", meaning: "Molière radius" },
      { symbol: "E_c", meaning: "Critical energy" }
    ]
  },
  {
    id: "critical-energy",
    title: "Critical Energy",
    category: "Energy Loss",
    description: "Energy at which ionization loss equals bremsstrahlung loss for electrons.",
    equations: ["E_c \\approx \\frac{800 \\, \\text{MeV}}{Z + 1.2}"],
    variables: [
      { symbol: "E_c", meaning: "Critical energy" },
      { symbol: "Z", meaning: "Atomic number" }
    ]
  },
  {
    id: "bremsstrahlung-loss",
    title: "Bremsstrahlung Energy Loss",
    category: "Energy Loss",
    description: "Energy loss by an electron due to radiation in the Coulomb field of a nucleus.",
    equations: ["-\\frac{dE}{dx} = \\frac{E}{X_0}"],
    variables: [
      { symbol: "E", meaning: "Electron energy" },
      { symbol: "X_0", meaning: "Radiation length" }
    ]
  },
  {
    id: "multiple-scattering",
    title: "Multiple Coulomb Scattering",
    category: "Scattering",
    description: "RMS scattering angle of a particle passing through a medium of thickness x.",
    equations: ["\\theta_0 = \\frac{13.6 \\, \\text{MeV}}{\\beta c p} z \\sqrt{\\frac{x}{X_0}} \\left[1 + 0.038 \\ln \\left( \\frac{x}{X_0} \\right)\\right]"],
    variables: [
      { symbol: "\\theta_0", meaning: "RMS scattering angle" },
      { symbol: "p", meaning: "Momentum" }
    ]
  },
  {
    id: "time-of-flight",
    title: "Time-of-Flight (TOF)",
    category: "Detectors",
    description: "Time taken for a particle to travel a distance L, used for particle identification.",
    equations: ["t = \\frac{L}{v} = \\frac{L}{c} \\sqrt{1 + \\left(\\frac{m_0 c}{p}\\right)^2}"],
    variables: [
      { symbol: "L", meaning: "Flight path length" },
      { symbol: "p", meaning: "Momentum" },
      { symbol: "m_0", meaning: "Rest mass" }
    ]
  },
  {
    id: "tof-resolution",
    title: "TOF Mass Resolution",
    category: "Detectors",
    description: "Mass separation power of a Time-of-Flight detector.",
    equations: ["\\frac{\\Delta m}{m} = \\gamma^2 \\left( \\frac{\\Delta p}{p} + \\frac{\\Delta t}{t} + \\frac{\\Delta L}{L} \\right)"],
    variables: [
      { symbol: "\\Delta t", meaning: "Timing resolution" }
    ]
  },
  {
    id: "magnetic-rigidity",
    title: "Magnetic Rigidity",
    category: "Tracking",
    description: "Resistance of a charged particle's trajectory to bending in a magnetic field.",
    equations: ["R = B \\rho = \\frac{p}{q}"],
    variables: [
      { symbol: "\\rho", meaning: "Radius of curvature" },
      { symbol: "p", meaning: "Momentum" },
      { symbol: "B", meaning: "Magnetic field" }
    ]
  },
  {
    id: "transverse-momentum",
    title: "Transverse Momentum",
    category: "Tracking",
    description: "Momentum component perpendicular to the beam axis (z-axis).",
    equations: ["p_T = p \\sin\\theta = 0.3 B \\rho"],
    variables: [
      { symbol: "p_T", meaning: "Transverse momentum (GeV/c)" },
      { symbol: "B", meaning: "Magnetic field (T)" },
      { symbol: "\\rho", meaning: "Radius of curvature (m)" }
    ]
  },
  {
    id: "sagitta-formula",
    title: "Sagitta Method",
    category: "Tracking",
    description: "Calculation of transverse momentum from the sagitta of a particle's arc in a tracker.",
    equations: ["s = \\frac{L^2}{8 \\rho} \\approx \\frac{0.3 B L^2}{8 p_T}"],
    variables: [
      { symbol: "s", meaning: "Sagitta (deviation from straight line)" },
      { symbol: "L", meaning: "Track length in the transverse plane" }
    ]
  },
  {
    id: "momentum-resolution",
    title: "Tracker Momentum Resolution",
    category: "Tracking",
    description: "Relative error in momentum measurement from tracking.",
    equations: ["\\frac{\\Delta p_T}{p_T} = \\frac{\\sigma_x p_T}{0.3 B L^2} \\sqrt{\\frac{720}{N+4}}"],
    variables: [
      { symbol: "\\sigma_x", meaning: "Spatial resolution of the tracker points" },
      { symbol: "N", meaning: "Number of measurement points" }
    ]
  },
  {
    id: "impact-parameter",
    title: "Impact Parameter Resolution",
    category: "Tracking",
    description: "Precision in determining the distance of closest approach of a track to the primary vertex.",
    equations: ["\\sigma_{d_0} = \\sqrt{ \\left( \\frac{\\sigma_{hit}}{r_1} \\right)^2 (r_1^2 + r_2^2) + \\left( \\frac{13.6\\text{MeV}}{p_T c} \\sqrt{\\frac{x}{X_0}} r_1 \\right)^2 }"],
    variables: [
      { symbol: "d_0", meaning: "Transverse impact parameter" },
      { symbol: "r_1, r_2", meaning: "Radii of innermost layers" }
    ]
  },
  {
    id: "calorimeter-resolution",
    title: "Calorimeter Energy Resolution",
    category: "Calorimetry",
    description: "Standard parameterization of energy resolution in electromagnetic or hadronic calorimeters.",
    equations: ["\\frac{\\sigma_E}{E} = \\frac{a}{\\sqrt{E}} \\oplus \\frac{b}{E} \\oplus c"],
    variables: [
      { symbol: "a", meaning: "Stochastic term" },
      { symbol: "b", meaning: "Noise term" },
      { symbol: "c", meaning: "Constant term" }
    ]
  },
  {
    id: "nuclear-interaction-length",
    title: "Nuclear Interaction Length",
    category: "Calorimetry",
    description: "Mean free path of a particle before undergoing an inelastic nuclear interaction.",
    equations: ["\\lambda_I \\approx 35 \\, \\text{g/cm}^2 A^{1/3}"],
    variables: [
      { symbol: "\\lambda_I", meaning: "Nuclear interaction length" },
      { symbol: "A", meaning: "Atomic mass number" }
    ]
  },
  {
    id: "hadronic-shower-depth",
    title: "Hadronic Shower Depth",
    category: "Calorimetry",
    description: "Approximate depth of the maximum energy deposition in a hadronic shower.",
    equations: ["t_{\\text{max}} \\approx 0.2 \\ln(E) + 0.7 \\, (\\text{in } \\lambda_I)"],
    variables: [
      { symbol: "E", meaning: "Incident particle energy in GeV" }
    ]
  },
  {
    id: "em-shower-depth",
    title: "Electromagnetic Shower Depth",
    category: "Calorimetry",
    description: "Depth of the maximum of an electromagnetic shower.",
    equations: ["t_{\\text{max}} \\approx \\ln\\left(\\frac{E}{E_c}\\right) - 0.5 \\, (\\text{in } X_0)"],
    variables: [
      { symbol: "E_c", meaning: "Critical energy" }
    ]
  },
  {
    id: "transition-radiation",
    title: "Transition Radiation Energy",
    category: "Detectors",
    description: "Total radiated energy when a highly relativistic particle crosses the boundary between two media.",
    equations: ["W = \\frac{1}{3} \\alpha \\hbar \\omega_p \\gamma"],
    variables: [
      { symbol: "\\omega_p", meaning: "Plasma frequency" },
      { symbol: "\\gamma", meaning: "Lorentz factor" }
    ]
  },
  {
    id: "scintillation-yield",
    title: "Scintillation Light Yield",
    category: "Detectors",
    description: "Number of scintillation photons produced per unit energy deposited.",
    equations: ["N_{ph} = Y \\times E_{dep}"],
    variables: [
      { symbol: "Y", meaning: "Scintillation yield (photons/MeV)" },
      { symbol: "E_{dep}", meaning: "Deposited energy" }
    ]
  },
  {
    id: "birk-law",
    title: "Birk's Law",
    category: "Energy Loss",
    description: "Describes the quenching of scintillation light yield for highly ionizing particles.",
    equations: ["\\frac{dL}{dx} = \\frac{S \\frac{dE}{dx}}{1 + k_B \\frac{dE}{dx}}"],
    variables: [
      { symbol: "S", meaning: "Scintillation efficiency" },
      { symbol: "k_B", meaning: "Birk's constant" }
    ]
  },
  {
    id: "fano-factor",
    title: "Fano Factor",
    category: "Detectors",
    description: "Quantifies the departure of the variance in the number of charge carriers produced from Poisson statistics.",
    equations: ["\\sigma_N^2 = F \\times N = F \\frac{E}{W}"],
    variables: [
      { symbol: "F", meaning: "Fano factor" },
      { symbol: "W", meaning: "Average energy per electron-ion pair" }
    ]
  },
  {
    id: "drift-velocity",
    title: "Electron Drift Velocity",
    category: "Detectors",
    description: "Drift speed of electrons in a gas detector under an electric field.",
    equations: ["v_d = \\mu E"],
    variables: [
      { symbol: "\\mu", meaning: "Electron mobility" },
      { symbol: "E", meaning: "Electric field strength" }
    ]
  },
  {
    id: "lorentz-angle",
    title: "Lorentz Angle in TPC",
    category: "Detectors",
    description: "Angle of drift velocity deviation relative to the electric field when a magnetic field is present.",
    equations: ["\\tan\\theta_L = \\omega \\tau = \\frac{e B}{m} \\tau"],
    variables: [
      { symbol: "\\theta_L", meaning: "Lorentz angle" },
      { symbol: "\\tau", meaning: "Mean time between collisions" }
    ]
  },
  {
    id: "avalanche-multiplication",
    title: "Townsend Avalanche (Gas Gain)",
    category: "Detectors",
    description: "Multiplication factor (gain) of a gas proportional counter.",
    equations: ["M = e^{\\int \\alpha(r) dr}"],
    variables: [
      { symbol: "\\alpha", meaning: "First Townsend coefficient" }
    ]
  },
  {
    id: "breit-wigner",
    title: "Breit-Wigner Resonance",
    category: "Quantum",
    description: "Describes the cross-section of a resonant scattering or the invariant mass distribution of an unstable particle.",
    equations: ["\\sigma(E) = \\frac{k}{(E - E_0)^2 + (\\Gamma/2)^2}"],
    variables: [
      { symbol: "E_0", meaning: "Resonance mass/energy" },
      { symbol: "\\Gamma", meaning: "Decay width (inverse lifetime)" }
    ]
  },
  {
    id: "invariant-mass-2",
    title: "Invariant Mass (2 Particles)",
    category: "Kinematics",
    description: "Invariant mass of a parent particle reconstructed from two daughter particles.",
    equations: ["M^2 = m_1^2 + m_2^2 + 2(E_1 E_2 - \\mathbf{p}_1 \\cdot \\mathbf{p}_2)"],
    variables: [
      { symbol: "E, \\mathbf{p}", meaning: "Energy and momentum of daughters" }
    ]
  },
  {
    id: "pseudo-rapidity",
    title: "Pseudorapidity",
    category: "Kinematics",
    description: "Spatial coordinate used in collider physics describing the angle of a particle relative to the beam axis.",
    equations: ["\\eta = -\\ln \\left[ \\tan \\left( \\frac{\\theta}{2} \\right) \\right]"],
    variables: [
      { symbol: "\\theta", meaning: "Polar angle relative to the beam axis" }
    ]
  },
  {
    id: "rapidity",
    title: "Rapidity",
    category: "Kinematics",
    description: "Relativistic measure of velocity along the beam axis, additive under Lorentz boosts.",
    equations: ["y = \\frac{1}{2} \\ln \\left( \\frac{E + p_z c}{E - p_z c} \\right)"],
    variables: [
      { symbol: "p_z", meaning: "Longitudinal momentum" }
    ]
  },
  {
    id: "missing-et",
    title: "Missing Transverse Energy (MET)",
    category: "Kinematics",
    description: "Vector sum of transverse energy used to infer the presence of invisible particles like neutrinos.",
    equations: ["E_T^{\\text{miss}} = -\\left| \\sum_{i} \\mathbf{p}_{T,i} \\right|"],
    variables: [
      { symbol: "\\mathbf{p}_{T,i}", meaning: "Transverse momentum vector of observed particle i" }
    ]
  },
  {
    id: "cross-section",
    title: "Luminosity and Cross-Section",
    category: "Kinematics",
    description: "Relates the event rate of a specific process to the collider luminosity and process cross-section.",
    equations: ["R = \\mathcal{L} \\cdot \\sigma"],
    variables: [
      { symbol: "R", meaning: "Event rate (events/second)" },
      { symbol: "\\mathcal{L}", meaning: "Instantaneous luminosity" },
      { symbol: "\\sigma", meaning: "Interaction cross-section" }
    ]
  },
  {
    id: "integrated-luminosity",
    title: "Integrated Luminosity",
    category: "Kinematics",
    description: "Total number of events expected for a process over a period of time.",
    equations: ["N = \\sigma \\int \\mathcal{L} \\, dt"],
    variables: [
      { symbol: "N", meaning: "Number of expected events" }
    ]
  },
  {
    id: "pileup",
    title: "Pile-up (Interactions per Crossing)",
    category: "Kinematics",
    description: "Average number of inelastic collisions per bunch crossing in a particle collider.",
    equations: ["\\mu = \\frac{\\mathcal{L} \\cdot \\sigma_{\\text{inel}}}{f_{\\text{rev}} n_{\\text{bunches}}}"],
    variables: [
      { symbol: "\\mu", meaning: "Pile-up parameter" },
      { symbol: "f_{\\text{rev}}", meaning: "Revolution frequency" }
    ]
  },
  {
    id: "d-edx-mip",
    title: "MIP Energy Loss",
    category: "Energy Loss",
    description: "Minimum Ionizing Particle energy loss (approximate constant for beta-gamma ~ 3).",
    equations: ["\\left\\langle \\frac{dE}{dx} \\right\\rangle_{\\text{MIP}} \\approx 1.5 - 2.0 \\, \\text{MeV cm}^2/\\text{g}"],
    variables: []
  },
  {
    id: "photoelectric-cross-section",
    title: "Photoelectric Cross Section",
    category: "Scattering",
    description: "Probability of photoelectric absorption for X-rays and gamma rays (highly dependent on Z).",
    equations: ["\\sigma_{PE} \\propto \\frac{Z^n}{E^3} \\quad \\text{where } n \\approx 4-5"],
    variables: [
      { symbol: "Z", meaning: "Atomic number of the absorber" },
      { symbol: "E", meaning: "Photon energy" }
    ]
  },
  {
    id: "pair-production",
    title: "Pair Production Threshold",
    category: "Scattering",
    description: "Minimum photon energy required to create an electron-positron pair in the field of a nucleus.",
    equations: ["E_{\\gamma, \\text{th}} = 2 m_e c^2 \\left( 1 + \\frac{m_e}{M_{nucleus}} \\right) \\approx 1.022 \\text{ MeV}"],
    variables: [
      { symbol: "M_{nucleus}", meaning: "Mass of recoil nucleus" }
    ]
  },
  {
    id: "coulomb-log",
    title: "Coulomb Logarithm",
    category: "Energy Loss",
    description: "Dimensionless parameter characterizing the dominance of small-angle collisions in plasmas.",
    equations: ["\\ln \\Lambda = \\ln \\left( \\frac{b_{\\text{max}}}{b_{\\text{min}}} \\right)"],
    variables: [
      { symbol: "b_{\\text{max}}, b_{\\text{min}}", meaning: "Maximum and minimum impact parameters" }
    ]
  },
  {
    id: "boltzmann-transport",
    title: "Boltzmann Transport Equation",
    category: "Thermodynamics",
    description: "Describes the statistical distribution of particles in a fluid.",
    equations: ["\\frac{\\partial f}{\\partial t} + \\mathbf{v} \\cdot \\nabla_{\\mathbf{r}} f + \\frac{\\mathbf{F}}{m} \\cdot \\nabla_{\\mathbf{v}} f = \\left( \\frac{\\partial f}{\\partial t} \\right)_{\\text{coll}}"],
    variables: [
      { symbol: "f", meaning: "Particle distribution function" }
    ]
  },
  {
    id: "kalman-filter",
    title: "Kalman Filter Update (Tracking)",
    category: "Tracking",
    description: "Recursive algorithm used in HEP to estimate the state of a particle track from noisy detector hits.",
    equations: ["x_k = x_{k|k-1} + K_k (z_k - H_k x_{k|k-1})"],
    variables: [
      { symbol: "x_k", meaning: "Updated state estimate" },
      { symbol: "K_k", meaning: "Kalman gain" },
      { symbol: "z_k", meaning: "Measurement vector" }
    ]
  },
  {
    id: "pmt-gain",
    title: "Photomultiplier Tube (PMT) Gain",
    category: "Detectors",
    description: "Total electron multiplication factor across the dynode stages of a PMT.",
    equations: ["G = \\delta^n"],
    variables: [
      { symbol: "\\delta", meaning: "Secondary emission ratio per dynode" },
      { symbol: "n", meaning: "Number of dynode stages" }
    ]
  },
  {
    id: "sipm-pde",
    title: "SiPM Photon Detection Efficiency",
    category: "Detectors",
    description: "Probability that an incident photon produces a measurable avalanche in a Silicon Photomultiplier.",
    equations: ["PDE = QE \\times P_{avalanche} \\times FF"],
    variables: [
      { symbol: "QE", meaning: "Quantum efficiency" },
      { symbol: "P_{avalanche}", meaning: "Avalanche probability" },
      { symbol: "FF", meaning: "Geometric fill factor" }
    ]
  },
  {
    id: "sipm-gain",
    title: "SiPM Gain",
    category: "Detectors",
    description: "Number of carriers generated during a single microcell avalanche.",
    equations: ["G = \\frac{C_d (V_{bias} - V_{breakdown})}{q_e}"],
    variables: [
      { symbol: "C_d", meaning: "Microcell capacitance" },
      { symbol: "V_{bias}", meaning: "Applied bias voltage" },
      { symbol: "V_{breakdown}", meaning: "Breakdown voltage" }
    ]
  },
  {
    id: "silicon-depletion",
    title: "Silicon Detector Depletion Voltage",
    category: "Detectors",
    description: "Voltage required to fully deplete a silicon semiconductor detector of charge carriers.",
    equations: ["V_d = \\frac{e N_d d^2}{2 \\varepsilon\\varepsilon_0}"],
    variables: [
      { symbol: "N_d", meaning: "Doping concentration" },
      { symbol: "d", meaning: "Thickness of the detector" }
    ]
  },
  {
    id: "dark-count-rate",
    title: "Dark Count Rate (DCR)",
    category: "Detectors",
    description: "Rate of thermally generated avalanches in a photosensor.",
    equations: ["DCR(T) \\propto T^2 e^{-\\frac{E_g}{2 k_B T}}"],
    variables: [
      { symbol: "T", meaning: "Temperature" },
      { symbol: "E_g", meaning: "Bandgap energy" }
    ]
  },
  {
    id: "shot-noise",
    title: "Shot Noise",
    category: "Detectors",
    description: "Electronic noise generated by the discrete nature of electric charge.",
    equations: ["I_n = \\sqrt{2 e I_{DC} \\Delta f}"],
    variables: [
      { symbol: "I_n", meaning: "RMS noise current" },
      { symbol: "I_{DC}", meaning: "Direct current" },
      { symbol: "\\Delta f", meaning: "Bandwidth" }
    ]
  },
  {
    id: "thermal-noise",
    title: "Johnson-Nyquist (Thermal) Noise",
    category: "Detectors",
    description: "Electronic noise generated by the thermal agitation of charge carriers inside an electrical conductor.",
    equations: ["V_n = \\sqrt{4 k_B T R \\Delta f}"],
    variables: [
      { symbol: "V_n", meaning: "RMS noise voltage" },
      { symbol: "R", meaning: "Resistance" }
    ]
  },
  {
    id: "adc-resolution",
    title: "ADC Quantization Error",
    category: "Detectors",
    description: "RMS error introduced by digitizing a continuous analog signal into N bits.",
    equations: ["\\sigma_Q = \\frac{\\text{LSB}}{\\sqrt{12}} = \\frac{V_{FS}}{2^N \\sqrt{12}}"],
    variables: [
      { symbol: "LSB", meaning: "Least Significant Bit size" },
      { symbol: "V_{FS}", meaning: "Full-scale voltage range" },
      { symbol: "N", meaning: "Number of bits" }
    ]
  },
  {
    id: "center-of-gravity-tracker",
    title: "Center of Gravity (Tracker)",
    category: "Tracking",
    description: "Used to determine the sub-strip hit position in a silicon strip detector using charge sharing.",
    equations: ["x_{hit} = \\frac{\\sum_{i} x_i Q_i}{\\sum_{i} Q_i}"],
    variables: [
      { symbol: "x_i", meaning: "Position of strip i" },
      { symbol: "Q_i", meaning: "Charge collected on strip i" }
    ]
  },
  {
    id: "rich-ring-radius",
    title: "RICH Ring Radius",
    category: "Cherenkov",
    description: "Radius of the Cherenkov ring projected onto the photodetector plane in a Ring-Imaging Cherenkov detector.",
    equations: ["r = L \\tan \\theta_C = L \\tan\\left( \\arccos\\left( \\frac{1}{\\beta n} \\right) \\right)"],
    variables: [
      { symbol: "L", meaning: "Distance from radiator to detector plane" },
      { symbol: "\\theta_C", meaning: "Cherenkov emission angle" }
    ]
  },
  {
    id: "pid-separation",
    title: "PID Separation Power",
    category: "Cherenkov",
    description: "Statistical separation in standard deviations between two particle hypotheses (e.g. pion vs kaon).",
    equations: ["N_{\\sigma} = \\frac{|\\theta_1 - \\theta_2|}{\\sigma_{\\theta}}"],
    variables: [
      { symbol: "\\theta_1, \\theta_2", meaning: "Expected Cherenkov angles for the two hypotheses" },
      { symbol: "\\sigma_{\\theta}", meaning: "Angular resolution per track" }
    ]
  },
  {
    id: "rich-angular-resolution",
    title: "RICH Angular Resolution",
    category: "Cherenkov",
    description: "Total angular resolution per track in a RICH detector.",
    equations: ["\\sigma_{\\theta} = \\frac{\\sigma_{photon}}{\\sqrt{N_{pe}}} \\oplus \\sigma_{track} \\oplus \\sigma_{chromatic}"],
    variables: [
      { symbol: "N_{pe}", meaning: "Number of detected photoelectrons" },
      { symbol: "\\sigma_{chromatic}", meaning: "Chromatic dispersion error" }
    ]
  },
  {
    id: "number-photoelectrons-rich",
    title: "Detected Photoelectrons (RICH)",
    category: "Cherenkov",
    description: "Approximation for the number of photoelectrons detected in a RICH counter.",
    equations: ["N_{pe} = N_0 L \\sin^2 \\theta_C"],
    variables: [
      { symbol: "N_0", meaning: "Detector figure of merit (cm^-1)" },
      { symbol: "L", meaning: "Radiator thickness" }
    ]
  },
  {
    id: "c-parity",
    title: "C-Parity Conservation",
    category: "Quantum",
    description: "Charge conjugation parity of a fermion-antifermion bound state.",
    equations: ["C = (-1)^{L + S}"],
    variables: [
      { symbol: "L", meaning: "Orbital angular momentum" },
      { symbol: "S", meaning: "Total spin" }
    ]
  },
  {
    id: "g-parity",
    title: "G-Parity",
    category: "Quantum",
    description: "Multiplicative quantum number that generalizes C-parity to multiplets.",
    equations: ["G = C (-1)^I"],
    variables: [
      { symbol: "I", meaning: "Isospin" }
    ]
  },
  {
    id: "weak-decay-width",
    title: "Weak Decay Width",
    category: "Quantum",
    description: "Fermi's Golden Rule applied to weak interactions.",
    equations: ["\\Gamma = \\frac{G_F^2 m^5}{192 \\pi^3}"],
    variables: [
      { symbol: "G_F", meaning: "Fermi coupling constant" },
      { symbol: "m", meaning: "Mass of the decaying particle" }
    ]
  },
  {
    id: "helcity",
    title: "Helicity",
    category: "Quantum",
    description: "Projection of the spin onto the direction of momentum.",
    equations: ["h = \\frac{\\mathbf{S} \\cdot \\mathbf{p}}{|\\mathbf{p}|}"],
    variables: [
      { symbol: "\\mathbf{S}", meaning: "Spin vector" },
      { symbol: "\\mathbf{p}", meaning: "Momentum vector" }
    ]
  },
  {
    id: "ckm-matrix",
    title: "CKM Matrix Unitarity",
    category: "Quantum",
    description: "Unitarity condition of the Cabibbo-Kobayashi-Maskawa matrix representing flavor-changing weak decays.",
    equations: ["\\sum_{k} V_{ik} V_{jk}^* = \\delta_{ij}", "V_{ud} V_{ub}^* + V_{cd} V_{cb}^* + V_{td} V_{tb}^* = 0"],
    variables: [
      { symbol: "V_{ij}", meaning: "CKM matrix elements" }
    ]
  },
  {
    id: "monte-carlo-integration",
    title: "Monte Carlo Integration Error",
    category: "Kinematics",
    description: "Statistical error of a Monte Carlo numerical integration simulating events.",
    equations: ["\\delta I \\approx \\frac{\\sigma}{\\sqrt{N}}"],
    variables: [
      { symbol: "\\sigma", meaning: "Standard deviation of the sampled function" },
      { symbol: "N", meaning: "Number of simulated events" }
    ]
  },
  {
    id: "snr-daq",
    title: "Signal-to-Noise Ratio (SNR)",
    category: "Detectors",
    description: "Ratio of the signal amplitude to the root-mean-square of the noise.",
    equations: ["SNR = \\frac{\\mu_{\\text{signal}}}{\\sigma_{\\text{noise}}}"],
    variables: [
      { symbol: "\\mu_{\\text{signal}}", meaning: "Mean signal amplitude" },
      { symbol: "\\sigma_{\\text{noise}}", meaning: "RMS noise" }
    ]
  },
  {
    id: "enc",
    title: "Equivalent Noise Charge (ENC)",
    category: "Detectors",
    description: "The amount of charge that would produce a signal equal to the RMS noise of a detector system.",
    equations: ["ENC = \\frac{\\sigma_V}{q_e G_{\\text{amp}}}"],
    variables: [
      { symbol: "\\sigma_V", meaning: "RMS output voltage noise" },
      { symbol: "G_{\\text{amp}}", meaning: "Preamplifier gain" }
    ]
  },
  {
    id: "dead-time-paralyzable",
    title: "Paralyzable Dead Time",
    category: "Detectors",
    description: "True event rate calculation for a paralyzable detector system.",
    equations: ["m = n e^{-n\\tau}"],
    variables: [
      { symbol: "m", meaning: "Measured count rate" },
      { symbol: "n", meaning: "True count rate" },
      { symbol: "\\tau", meaning: "Dead time per event" }
    ]
  },
  {
    id: "dead-time-nonparalyzable",
    title: "Non-paralyzable Dead Time",
    category: "Detectors",
    description: "True event rate calculation for a non-paralyzable detector system.",
    equations: ["n = \\frac{m}{1 - m\\tau}"],
    variables: [
      { symbol: "m", meaning: "Measured count rate" },
      { symbol: "n", meaning: "True count rate" },
      { symbol: "\\tau", meaning: "Dead time per event" }
    ]
  },
  {
    id: "coincidence-rate",
    title: "Random Coincidence Rate",
    category: "Detectors",
    description: "Rate of accidental coincidences between two detectors.",
    equations: ["R_{acc} = 2 \\tau R_1 R_2"],
    variables: [
      { symbol: "R_1, R_2", meaning: "Singles rates of the two detectors" },
      { symbol: "\\tau", meaning: "Coincidence time window" }
    ]
  },
  {
    id: "trigger-efficiency",
    title: "Trigger Efficiency",
    category: "Detectors",
    description: "Probability that a valid event satisfies the trigger conditions.",
    equations: ["\\varepsilon_{\\text{trig}} = \\frac{N_{\\text{accepted}}}{N_{\\text{true}}}"],
    variables: [
      { symbol: "N_{\\text{accepted}}", meaning: "Number of events passing trigger" },
      { symbol: "N_{\\text{true}}", meaning: "Number of actual events of interest" }
    ]
  },
  {
    id: "shaping-time",
    title: "Optimum Shaping Time",
    category: "Detectors",
    description: "Time constant that minimizes the combined series and parallel noise in a readout amplifier.",
    equations: ["\\tau_{\\text{opt}} = C_{\\text{tot}} \\sqrt{\\frac{e_n^2}{i_n^2}}"],
    variables: [
      { symbol: "C_{\\text{tot}}", meaning: "Total input capacitance" },
      { symbol: "e_n", meaning: "Series voltage noise spectral density" },
      { symbol: "i_n", meaning: "Parallel current noise spectral density" }
    ]
  },
  {
    id: "cross-talk",
    title: "Optical Crosstalk Probability",
    category: "Detectors",
    description: "Probability that an avalanche in one SiPM pixel triggers an avalanche in a neighboring pixel.",
    equations: ["P_{CT} = 1 - e^{-\\mu_{CT}} \\approx \\frac{N_{>1}}{N_{\\geq 1}}"],
    variables: [
      { symbol: "N_{>1}", meaning: "Events with >1 fired microcells (dark conditions)" }
    ]
  },
  {
    id: "energy-resolution-poisson",
    title: "Poisson Limit of Energy Resolution",
    category: "Detectors",
    description: "Theoretical lower bound on energy resolution due to counting statistics.",
    equations: ["\\frac{\\sigma_E}{E} = \\frac{1}{\\sqrt{N}} = \\sqrt{\\frac{W}{E}}"],
    variables: [
      { symbol: "N", meaning: "Number of charge carriers/photons generated" },
      { symbol: "W", meaning: "Energy required to produce one carrier/photon" }
    ]
  },
  {
    id: "mott-scattering",
    title: "Mott Scattering Cross Section",
    category: "Scattering",
    description: "Scattering cross section for identical fermions (e.g. electron-electron scattering).",
    equations: ["\\frac{d\\sigma}{d\\Omega} = \\frac{\\alpha^2}{4s} \\left[ \\frac{s^2 + u^2}{t^2} + \\frac{s^2 + t^2}{u^2} + \\frac{2s^2}{tu} \\right]"],
    variables: [
      { symbol: "s, t, u", meaning: "Mandelstam variables" },
      { symbol: "\\alpha", meaning: "Fine structure constant" }
    ]
  },
  {
    id: "bhabha-scattering",
    title: "Bhabha Scattering Cross Section",
    category: "Scattering",
    description: "Scattering cross section for electron-positron scattering.",
    equations: ["\\frac{d\\sigma}{d\\Omega} = \\frac{\\alpha^2}{2s} \\left[ \\frac{u^2 + s^2}{t^2} + \\frac{2u^2}{st} + \\frac{u^2 + t^2}{s^2} \\right]"],
    variables: [
      { symbol: "s, t, u", meaning: "Mandelstam variables" }
    ]
  },
  {
    id: "klein-nishina",
    title: "Klein-Nishina Formula",
    category: "Scattering",
    description: "Differential cross section for photons scattered from a single free electron (Compton scattering).",
    equations: ["\\frac{d\\sigma}{d\\Omega} = \\frac{1}{2} r_e^2 \\left( \\frac{\\lambda}{\\lambda'} \\right)^2 \\left[ \\frac{\\lambda}{\\lambda'} + \\frac{\\lambda'}{\\lambda} - \\sin^2\\theta \\right]"],
    variables: [
      { symbol: "r_e", meaning: "Classical electron radius" },
      { symbol: "\\lambda, \\lambda'", meaning: "Initial and final photon wavelengths" }
    ]
  },
  {
    id: "compton-shift",
    title: "Compton Shift",
    category: "Scattering",
    description: "Change in wavelength of a photon after scattering off a particle at rest.",
    equations: ["\\Delta \\lambda = \\lambda' - \\lambda = \\frac{h}{m_e c} (1 - \\cos\\theta)"],
    variables: [
      { symbol: "\\theta", meaning: "Scattering angle" }
    ]
  },
  {
    id: "thomson-scattering",
    title: "Thomson Scattering Cross Section",
    category: "Scattering",
    description: "Low-energy limit of Compton scattering (elastic scattering of electromagnetic radiation).",
    equations: ["\\sigma_T = \\frac{8\\pi}{3} r_e^2 \\approx 0.665 \\text{ barn}"],
    variables: [
      { symbol: "r_e", meaning: "Classical electron radius" }
    ]
  },
  {
    id: "fermi-golden-rule",
    title: "Fermi's Golden Rule",
    category: "Quantum",
    description: "Transition rate from one energy eigenstate of a quantum system into a continuum of eigenstates.",
    equations: ["\\Gamma_{i \\to f} = \\frac{2\\pi}{\\hbar} |\\langle f | H' | i \\rangle|^2 \\rho(E_f)"],
    variables: [
      { symbol: "H'", meaning: "Perturbation Hamiltonian" },
      { symbol: "\\rho(E_f)", meaning: "Density of states at final energy" }
    ]
  },
  {
    id: "yukawa-potential",
    title: "Yukawa Potential",
    category: "Quantum",
    description: "Nuclear potential mediated by a massive scalar field (pion).",
    equations: ["V(r) = -g^2 \\frac{e^{-\\mu r}}{r}"],
    variables: [
      { symbol: "g", meaning: "Coupling constant" },
      { symbol: "\\mu", meaning: "Mass of the mediating meson" }
    ]
  },
  {
    id: "bjorken-x",
    title: "Bjorken x",
    category: "Kinematics",
    description: "Fraction of the nucleon's momentum carried by the struck parton in Deep Inelastic Scattering.",
    equations: ["x = \\frac{Q^2}{2 P \\cdot q} = \\frac{Q^2}{2 M \\nu}"],
    variables: [
      { symbol: "Q^2", meaning: "Momentum transfer squared" },
      { symbol: "P", meaning: "Four-momentum of the target nucleon" },
      { symbol: "\\nu", meaning: "Energy transfer in the lab frame" }
    ]
  },
  {
    id: "inelasticity-y",
    title: "Inelasticity y",
    category: "Kinematics",
    description: "Fraction of the lepton's energy lost in the rest frame of the target.",
    equations: ["y = \\frac{P \\cdot q}{P \\cdot k} = \\frac{\\nu}{E}"],
    variables: [
      { symbol: "k", meaning: "Four-momentum of the incident lepton" },
      { symbol: "E", meaning: "Initial lepton energy" }
    ]
  },
  {
    id: "center-of-mass-energy",
    title: "Center of Mass Energy (Collider)",
    category: "Kinematics",
    description: "Total energy in the center-of-mass frame of two colliding particles.",
    equations: ["s = (p_1 + p_2)^2 = m_1^2 + m_2^2 + 2(E_1 E_2 - \\mathbf{p}_1 \\cdot \\mathbf{p}_2)"],
    variables: [
      { symbol: "s", meaning: "Mandelstam s (square of CM energy)" }
    ]
  },
  {
    id: "impact-parameter-resolution",
    title: "Transverse Impact Parameter Resolution",
    category: "Tracking",
    description: "Measurement precision for vertex reconstruction in particle physics.",
    equations: ["\\sigma_{d0}^2 = \\frac{r_2^2 \\sigma_1^2 + r_1^2 \\sigma_2^2}{(r_2 - r_1)^2} + \\left( \\frac{13.6 \\text{ MeV}}{p_T c} \\sqrt{\\frac{x}{X_0}} r_1 \\right)^2"],
    variables: [
      { symbol: "r_1, r_2", meaning: "Radii of innermost tracker layers" },
      { symbol: "\\sigma_1, \\sigma_2", meaning: "Spatial resolution of the layers" }
    ]
  },
  {
    id: "momentum-conservation",
    title: "Four-Momentum Conservation",
    category: "Kinematics",
    description: "The total four-momentum of a closed system is conserved in any interaction.",
    equations: ["\\sum_{initial} P^\\mu = \\sum_{final} P^\\mu"],
    variables: [
      { symbol: "P^\\mu", meaning: "Four-momentum vector" }
    ]
  },
  {
    id: "cherenkov-angle-dispersion",
    title: "Cherenkov Angle Dispersion",
    category: "Cherenkov",
    description: "Chromatic dispersion of the Cherenkov angle due to the variation of refractive index with wavelength.",
    equations: ["\\Delta \\theta_C = \\frac{1}{n \\sqrt{n^2 \\beta^2 - 1}} \\frac{dn}{d\\lambda} \\Delta \\lambda"],
    variables: [
      { symbol: "\\frac{dn}{d\\lambda}", meaning: "Chromatic dispersion of the radiator" }
    ]
  },
  {
    id: "photon-energy",
    title: "Photon Energy",
    category: "Quantum",
    description: "Energy of a single photon.",
    equations: ["E = h \\nu = \\frac{h c}{\\lambda}"],
    variables: [
      { symbol: "h", meaning: "Planck constant" },
      { symbol: "\\lambda", meaning: "Wavelength" }
    ]
  },
  {
    id: "de-broglie-wavelength",
    title: "de Broglie Wavelength",
    category: "Quantum",
    description: "The wavelength associated with a massive particle.",
    equations: ["\\lambda = \\frac{h}{p}"],
    variables: [
      { symbol: "p", meaning: "Momentum of the particle" }
    ]
  },
  {
    id: "heisenberg-uncertainty",
    title: "Heisenberg Uncertainty Principle",
    category: "Quantum",
    description: "Fundamental limit to the precision with which certain pairs of physical properties can be known.",
    equations: ["\\Delta x \\Delta p \\ge \\frac{\\hbar}{2}", "\\Delta E \\Delta t \\ge \\frac{\\hbar}{2}"],
    variables: [
      { symbol: "\\Delta x", meaning: "Uncertainty in position" },
      { symbol: "\\Delta p", meaning: "Uncertainty in momentum" }
    ]
  },
  {
    id: "bohr-radius",
    title: "Bohr Radius",
    category: "Quantum",
    description: "Mean radius of the orbit of an electron around the nucleus of a hydrogen atom at its ground state.",
    equations: ["a_0 = \\frac{4\\pi \\varepsilon_0 \\hbar^2}{m_e e^2}"],
    variables: [
      { symbol: "a_0", meaning: "Bohr radius (~0.529 Å)" }
    ]
  },
  {
    id: "larmor-radius",
    title: "Gyroradius (Larmor Radius)",
    category: "Tracking",
    description: "The radius of the circular motion of a charged particle in a uniform magnetic field.",
    equations: ["r_g = \\frac{p_T}{q B}"],
    variables: [
      { symbol: "p_T", meaning: "Transverse momentum" },
      { symbol: "q", meaning: "Charge" },
      { symbol: "B", meaning: "Magnetic field" }
    ]
  },
  {
    id: "cyclotron-frequency",
    title: "Cyclotron Frequency",
    category: "Tracking",
    description: "The frequency of a charged particle moving perpendicular to the direction of a uniform magnetic field.",
    equations: ["f_c = \\frac{q B}{2\\pi m}"],
    variables: [
      { symbol: "m", meaning: "Mass of the particle" }
    ]
  },
  {
    id: "exb-drift",
    title: "ExB Drift Velocity",
    category: "Detectors",
    description: "Drift velocity of a guiding center in crossed electric and magnetic fields.",
    equations: ["\\mathbf{v}_D = \\frac{\\mathbf{E} \\times \\mathbf{B}}{B^2}"],
    variables: [
      { symbol: "\\mathbf{E}", meaning: "Electric field" },
      { symbol: "\\mathbf{B}", meaning: "Magnetic field" }
    ]
  },
  {
    id: "time-projection-chamber-z",
    title: "TPC Z-Coordinate",
    category: "Tracking",
    description: "Reconstruction of the longitudinal coordinate in a Time Projection Chamber.",
    equations: ["z = L_{drift} - v_d (t_{arrival} - t_0)"],
    variables: [
      { symbol: "L_{drift}", meaning: "Maximum drift length" },
      { symbol: "v_d", meaning: "Drift velocity" },
      { symbol: "t_{arrival}", meaning: "Signal arrival time" }
    ]
  },
  {
    id: "diffusion-transverse",
    title: "Transverse Diffusion (Gas)",
    category: "Detectors",
    description: "Spread of the electron cloud transverse to the drift direction in a gas detector.",
    equations: ["\\sigma_T = \\sqrt{2 D_T t} = D_{T1} \\sqrt{z}"],
    variables: [
      { symbol: "D_T", meaning: "Transverse diffusion coefficient" },
      { symbol: "t", meaning: "Drift time" },
      { symbol: "z", meaning: "Drift distance" }
    ]
  },
  {
    id: "diffusion-longitudinal",
    title: "Longitudinal Diffusion (Gas)",
    category: "Detectors",
    description: "Spread of the electron cloud parallel to the drift direction.",
    equations: ["\\sigma_L = \\sqrt{2 D_L t} = D_{L1} \\sqrt{z}"],
    variables: [
      { symbol: "D_L", meaning: "Longitudinal diffusion coefficient" }
    ]
  },
  {
    id: "d-edx-resolution",
    title: "dE/dx Resolution (Truncated Mean)",
    category: "Detectors",
    description: "Energy loss measurement resolution using multiple samples in a tracking detector.",
    equations: ["\\frac{\\sigma_{dE/dx}}{dE/dx} = \\frac{c}{\\sqrt{N}} L^{-0.32}"],
    variables: [
      { symbol: "N", meaning: "Number of track samples" },
      { symbol: "L", meaning: "Total track length" }
    ]
  },
  {
    id: "energy-loss-fluctuations",
    title: "Landau Distribution Mode",
    category: "Energy Loss",
    description: "Most probable energy loss (mode of the Landau distribution) for a thin absorber.",
    equations: ["\\Delta_p = \\xi \\left[ \\ln\\left(\\frac{2 m_e c^2 \\beta^2 \\gamma^2 \\xi}{I^2}\\right) - \\beta^2 + 0.2 - \\delta \\right]"],
    variables: [
      { symbol: "\\xi", meaning: "Parameter proportional to absorber thickness x" }
    ]
  },
  {
    id: "shower-max-fluctuations",
    title: "Shower Maximum Fluctuations",
    category: "Calorimetry",
    description: "Event-by-event variation in the depth of the shower maximum.",
    equations: ["\\sigma_{t_{\\text{max}}} \\approx 1.0 \\, X_0 \\, (\\text{EM}), \\quad \\sigma_{t_{\\text{max}}} \\approx 1.5 \\, \\lambda_I \\, (\\text{Hadronic})"],
    variables: []
  },
  {
    id: "hadronic-em-fraction",
    title: "Electromagnetic Fraction in Hadronic Showers",
    category: "Calorimetry",
    description: "Fraction of energy in a hadronic shower deposited electromagnetically (mainly via pi0 decay).",
    equations: ["f_{em} \\approx 1 - \\left( \\frac{E}{E_0} \\right)^{m-1} \\quad (m \\approx 0.85)"],
    variables: [
      { symbol: "E", meaning: "Incident hadron energy" }
    ]
  },
  {
    id: "compensation-ratio",
    title: "Calorimeter e/h Ratio",
    category: "Calorimetry",
    description: "Ratio of calorimeter response to electromagnetic versus hadronic energy depositions.",
    equations: ["\\frac{e}{h} = \\frac{\\text{Response to electrons}}{\\text{Response to hadrons}}"],
    variables: [
      { symbol: "e/h = 1", meaning: "Compensated calorimeter" }
    ]
  },
  {
    id: "brem-cross-section",
    title: "Bremsstrahlung Cross Section",
    category: "Energy Loss",
    description: "Differential cross section for electron bremsstrahlung in the field of a nucleus.",
    equations: ["\\frac{d\\sigma}{dk} \\approx \\frac{4 \\alpha Z^2 r_e^2}{k} \\ln\\left( \\frac{183}{Z^{1/3}} \\right)"],
    variables: [
      { symbol: "k", meaning: "Radiated photon energy" }
    ]
  },
  {
    id: "pair-production-cross",
    title: "Pair Production Cross Section",
    category: "Scattering",
    description: "High energy limit cross section for pair production in the field of a nucleus.",
    equations: ["\\sigma_{\\text{pair}} \\approx \\frac{7}{9} \\frac{A}{N_A X_0}"],
    variables: [
      { symbol: "X_0", meaning: "Radiation length" },
      { symbol: "N_A", meaning: "Avogadro's number" }
    ]
  },
  {
    id: "dirac-delta",
    title: "Dirac Delta Function (Properties)",
    category: "Quantum",
    description: "Properties of the Dirac delta function heavily used in QFT phase space integrals.",
    equations: ["\\int_{-\\infty}^{\\infty} f(x) \\delta(x - a) \\, dx = f(a)", "\\delta(kx) = \\frac{1}{|k|} \\delta(x)"],
    variables: []
  },
  {
    id: "phase-space-2body",
    title: "2-Body Phase Space",
    category: "Kinematics",
    description: "Lorentz-invariant phase space volume for a 1 -> 2 particle decay.",
    equations: ["d\\Phi_2 = \\frac{1}{32\\pi^2} \\frac{2|\\mathbf{p}|}{M} d\\Omega"],
    variables: [
      { symbol: "|\\mathbf{p}|", meaning: "Momentum of daughter particles in CM frame" },
      { symbol: "M", meaning: "Mass of parent particle" }
    ]
  },
  {
    id: "momentum-cm-2body",
    title: "CM Momentum (2-Body Decay)",
    category: "Kinematics",
    description: "Momentum of daughter particles in the rest frame of the decaying parent.",
    equations: ["|\\mathbf{p}| = \\frac{\\sqrt{[M^2 - (m_1 + m_2)^2][M^2 - (m_1 - m_2)^2]}}{2M}"],
    variables: [
      { symbol: "M", meaning: "Mass of parent" },
      { symbol: "m_1, m_2", meaning: "Masses of daughters" }
    ]
  },
  {
    id: "dirac-lagrangian",
    title: "Dirac Lagrangian",
    category: "Quantum",
    description: "Lagrangian density for a free spin-1/2 particle.",
    equations: ["\\mathcal{L} = \\bar{\\psi}(i\\hbar c \\gamma^\\mu \\partial_\\mu - mc^2)\\psi"],
    variables: [
      { symbol: "\\bar{\\psi}", meaning: "Dirac adjoint (\\psi^\\dagger \\gamma^0)" },
      { symbol: "\\gamma^\\mu", meaning: "Dirac gamma matrices" }
    ]
  },
  {
    id: "qed-lagrangian",
    title: "QED Lagrangian",
    category: "Quantum",
    description: "Lagrangian density for Quantum Electrodynamics (interacting electrons and photons).",
    equations: ["\\mathcal{L} = \\bar{\\psi}(i\\gamma^\\mu D_\\mu - m)\\psi - \\frac{1}{4} F_{\\mu\\nu} F^{\\mu\\nu}"],
    variables: [
      { symbol: "D_\\mu", meaning: "Gauge covariant derivative (\\partial_\\mu + ieA_\\mu)" },
      { symbol: "F_{\\mu\\nu}", meaning: "Electromagnetic field tensor" }
    ]
  },
  {
    id: "qcd-lagrangian",
    title: "QCD Lagrangian",
    category: "Quantum",
    description: "Lagrangian density for Quantum Chromodynamics (quarks and gluons).",
    equations: ["\\mathcal{L} = \\sum_q \\bar{\\psi}_q(i\\gamma^\\mu D_\\mu - m_q)\\psi_q - \\frac{1}{4} G_{\\mu\\nu}^a G_a^{\\mu\\nu}"],
    variables: [
      { symbol: "G_{\\mu\\nu}^a", meaning: "Gluon field strength tensor" }
    ]
  },
  {
    id: "higgs-potential",
    title: "Higgs Potential",
    category: "Quantum",
    description: "Scalar field potential responsible for electroweak symmetry breaking.",
    equations: ["V(\\phi) = \\mu^2 \\phi^\\dagger \\phi + \\lambda (\\phi^\\dagger \\phi)^2"],
    variables: [
      { symbol: "\\mu^2 < 0", meaning: "Mass parameter triggering symmetry breaking" },
      { symbol: "\\lambda > 0", meaning: "Self-coupling constant" }
    ]
  },
  {
    id: "neutrino-oscillation",
    title: "Neutrino Oscillation Probability (2-Flavor)",
    category: "Quantum",
    description: "Probability of a neutrino changing from flavor \\alpha to flavor \\beta.",
    equations: ["P(\\nu_\\alpha \\to \\nu_\\beta) = \\sin^2(2\\theta) \\sin^2\\left( \\frac{\\Delta m^2 L}{4E} \\right)"],
    variables: [
      { symbol: "\\theta", meaning: "Mixing angle" },
      { symbol: "\\Delta m^2", meaning: "Mass squared difference" },
      { symbol: "L, E", meaning: "Baseline length and Neutrino energy" }
    ]
  },
  {
    id: "weinberg-angle",
    title: "Weak Mixing Angle (Weinberg Angle)",
    category: "Quantum",
    description: "Parameter in the Weinberg-Salam theory of the electroweak interaction.",
    equations: ["\\sin^2 \\theta_W = 1 - \\left(\\frac{M_W}{M_Z}\\right)^2"],
    variables: [
      { symbol: "M_W, M_Z", meaning: "Masses of the W and Z bosons" }
    ]
  },
  {
    id: "hawking-temperature-blackhole",
    title: "Hawking Temperature",
    category: "Astrophysics",
    description: "The thermal radiation emitted by a black hole due to quantum effects near the event horizon.",
    equations: ["T_H = \\frac{\\hbar c^3}{8 \\pi G M k_B}"],
    variables: [
      { symbol: "M", meaning: "Mass of the black hole" }
    ]
  }
];
