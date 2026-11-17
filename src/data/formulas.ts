/**
 * @license
 * SPDX-License-Identifier: MIT
 */

// Formula reference for the Theory tab. Only formulas used by, or directly describing, the model in
// src/core/physics.ts are kept (plan T1.5). Each entry has a `reference` field. Entries marked
// "Pointer" name the source to check; they have not yet been checked line by line against it.

export interface FormulaData {
  id: string;
  title: string;
  description: string;
  equations: string[];
  variables: { symbol: string; meaning: string }[];
  category: string;
  reference: string;
}

export const PHYSICS_FORMULAS: FormulaData[] = [
  {
    "id": "frank-tamm",
    "title": "Frank-Tamm Equation",
    "category": "Cherenkov",
    "description": "Describes the spectrum and intensity of Cherenkov radiation emitted when a charged particle travels through a dielectric medium faster than the phase velocity of light in that medium.",
    "equations": [
      "\\frac{d^2 N}{dx d\\lambda} = \\frac{2\\pi \\alpha z^2}{\\lambda^2} \\left( 1 - \\frac{1}{\\beta^2 n^2(\\lambda)} \\right)"
    ],
    "variables": [
      {
        "symbol": "N",
        "meaning": "Number of photons emitted"
      },
      {
        "symbol": "\\alpha",
        "meaning": "Fine-structure constant (≈ 1/137)"
      },
      {
        "symbol": "z",
        "meaning": "Particle charge (in multiples of e)"
      },
      {
        "symbol": "\\beta",
        "meaning": "Velocity of particle v/c"
      },
      {
        "symbol": "n(\\lambda)",
        "meaning": "Refractive index of the medium"
      }
    ],
    "reference": "Frank & Tamm (1937). Form used in src/core/physics.ts. Pointer only: check against the PDG review 'Passage of particles through matter'."
  },
  {
    "id": "sellmeier",
    "title": "Sellmeier Equation",
    "category": "Cherenkov",
    "description": "Empirical relationship between refractive index and wavelength for a particular transparent medium, enabling our wavelength-dependent Cherenkov cone modeling.",
    "equations": [
      "n^2(\\lambda) = 1 + \\sum_i \\frac{B_i \\lambda^2}{\\lambda^2 - C_i}"
    ],
    "variables": [
      {
        "symbol": "B_i, C_i",
        "meaning": "Empirically determined Sellmeier coefficients"
      },
      {
        "symbol": "\\lambda",
        "meaning": "Wavelength (in micrometers)"
      }
    ],
    "reference": "Sellmeier (1871) dispersion form. Coefficients for fused silica: Malitson, J. Opt. Soc. Am. 55, 1205 (1965)."
  },
  {
    "id": "cherenkov-angle",
    "title": "Cherenkov Emission Angle",
    "category": "Cherenkov",
    "description": "The half-angle of the characteristic cone of Cherenkov radiation emitted by a superluminal particle relative to its trajectory vector.",
    "equations": [
      "\\cos \\theta_c = \\frac{1}{\\beta n(\\lambda)}"
    ],
    "variables": [
      {
        "symbol": "\\theta_c",
        "meaning": "Cherenkov cone half-angle"
      },
      {
        "symbol": "\\beta",
        "meaning": "Relativistic speed v/c"
      },
      {
        "symbol": "n(\\lambda)",
        "meaning": "Refractive index at given wavelength"
      }
    ],
    "reference": "Pointer: PDG review 'Passage of particles through matter', Cherenkov radiation section."
  },
  {
    "id": "relativistic-momentum",
    "title": "Relativistic Momentum",
    "category": "Kinematics",
    "description": "The momentum of a particle moving at relativistic speeds.",
    "equations": [
      "p = \\gamma m_0 v = \\frac{m_0 v}{\\sqrt{1 - v^2/c^2}}"
    ],
    "variables": [
      {
        "symbol": "m_0",
        "meaning": "Rest mass"
      },
      {
        "symbol": "v",
        "meaning": "Velocity"
      },
      {
        "symbol": "\\gamma",
        "meaning": "Lorentz factor"
      }
    ],
    "reference": "Pointer: PDG review 'Kinematics'."
  },
  {
    "id": "relativistic-energy",
    "title": "Relativistic Total Energy",
    "category": "Kinematics",
    "description": "The total energy of a particle moving at relativistic speeds.",
    "equations": [
      "E = \\gamma m_0 c^2 = \\sqrt{(pc)^2 + (m_0 c^2)^2}"
    ],
    "variables": [
      {
        "symbol": "E",
        "meaning": "Total energy"
      },
      {
        "symbol": "p",
        "meaning": "Momentum"
      },
      {
        "symbol": "m_0 c^2",
        "meaning": "Rest mass energy"
      }
    ],
    "reference": "Pointer: PDG review 'Kinematics'."
  },
  {
    "id": "cyclotron-frequency",
    "title": "Cyclotron Frequency",
    "category": "Kinematics",
    "description": "The frequency of a charged particle moving perpendicular to the direction of a uniform magnetic field.",
    "equations": [
      "f = \\frac{qB}{2\\pi m}"
    ],
    "variables": [
      {
        "symbol": "f",
        "meaning": "Cyclotron frequency"
      },
      {
        "symbol": "q",
        "meaning": "Charge"
      },
      {
        "symbol": "B",
        "meaning": "Magnetic field"
      },
      {
        "symbol": "m",
        "meaning": "Mass of particle"
      }
    ],
    "reference": "Pointer: standard electrodynamics text (e.g. Jackson, Classical Electrodynamics)."
  },
  {
    "id": "cherenkov-threshold",
    "title": "Cherenkov Threshold Velocity",
    "category": "Cherenkov",
    "description": "The minimum velocity required for a particle to emit Cherenkov radiation in a medium.",
    "equations": [
      "v_{th} = \\frac{c}{n(\\lambda)}",
      "\\beta_{th} = \\frac{1}{n(\\lambda)}"
    ],
    "variables": [
      {
        "symbol": "v_{th}",
        "meaning": "Threshold velocity"
      },
      {
        "symbol": "n(\\lambda)",
        "meaning": "Refractive index"
      }
    ],
    "reference": "Pointer: PDG review 'Passage of particles through matter', Cherenkov radiation section."
  },
  {
    "id": "cherenkov-energy-threshold",
    "title": "Cherenkov Kinetic Energy Threshold",
    "category": "Cherenkov",
    "description": "The minimum kinetic energy a particle must have to emit Cherenkov radiation.",
    "equations": [
      "E_k^{th} = m_0 c^2 \\left( \\frac{n}{\\sqrt{n^2 - 1}} - 1 \\right)"
    ],
    "variables": [
      {
        "symbol": "E_k^{th}",
        "meaning": "Threshold kinetic energy"
      },
      {
        "symbol": "m_0",
        "meaning": "Rest mass of the particle"
      },
      {
        "symbol": "n",
        "meaning": "Refractive index"
      }
    ],
    "reference": "Pointer: PDG review 'Passage of particles through matter', Cherenkov radiation section."
  },
  {
    "id": "mass-energy",
    "title": "Mass-Energy Equivalence",
    "category": "Kinematics",
    "description": "The principle that anything having mass has an equivalent amount of energy and vice versa.",
    "equations": [
      "E = mc^2"
    ],
    "variables": [
      {
        "symbol": "E",
        "meaning": "Energy"
      },
      {
        "symbol": "m",
        "meaning": "Relativistic mass"
      },
      {
        "symbol": "c",
        "meaning": "Speed of light in vacuum"
      }
    ],
    "reference": "Pointer: PDG review 'Kinematics'."
  },
  {
    "id": "cherenkov-photon-yield",
    "title": "Cherenkov Photon Yield",
    "category": "Cherenkov",
    "description": "Number of Cherenkov photons emitted per unit path length and wavelength interval.",
    "equations": [
      "\\frac{d^2 N}{dx d\\lambda} = \\frac{2\\pi\\alpha z^2}{\\lambda^2} \\left( 1 - \\frac{1}{\\beta^2 n^2(\\lambda)} \\right)"
    ],
    "variables": [
      {
        "symbol": "\\alpha",
        "meaning": "Fine structure constant"
      },
      {
        "symbol": "\\lambda",
        "meaning": "Wavelength"
      }
    ],
    "reference": "Pointer: Frank-Tamm integrated over the stated band; see PDG review, Cherenkov radiation section."
  },
  {
    "id": "rich-ring-radius",
    "title": "RICH Ring Radius",
    "category": "Cherenkov",
    "description": "Radius of the Cherenkov ring projected onto the photodetector plane in a Ring-Imaging Cherenkov detector.",
    "equations": [
      "r = L \\tan \\theta_C = L \\tan\\left( \\arccos\\left( \\frac{1}{\\beta n} \\right) \\right)"
    ],
    "variables": [
      {
        "symbol": "L",
        "meaning": "Distance from radiator to detector plane"
      },
      {
        "symbol": "\\theta_C",
        "meaning": "Cherenkov emission angle"
      }
    ],
    "reference": "Pointer: RICH design literature (to be cited in Phase 4, T4.4). Not implemented in the engine."
  },
  {
    "id": "pid-separation",
    "title": "PID Separation Power",
    "category": "Cherenkov",
    "description": "Statistical separation in standard deviations between two particle hypotheses (e.g. pion vs kaon).",
    "equations": [
      "N_{\\sigma} = \\frac{|\\theta_1 - \\theta_2|}{\\sigma_{\\theta}}"
    ],
    "variables": [
      {
        "symbol": "\\theta_1, \\theta_2",
        "meaning": "Expected Cherenkov angles for the two hypotheses"
      },
      {
        "symbol": "\\sigma_{\\theta}",
        "meaning": "Angular resolution per track"
      }
    ],
    "reference": "Pointer: RICH design literature (to be cited in Phase 4, T4.4). Not implemented in the engine."
  },
  {
    "id": "rich-angular-resolution",
    "title": "RICH Angular Resolution",
    "category": "Cherenkov",
    "description": "Total angular resolution per track in a RICH detector.",
    "equations": [
      "\\sigma_{\\theta} = \\frac{\\sigma_{photon}}{\\sqrt{N_{pe}}} \\oplus \\sigma_{track} \\oplus \\sigma_{chromatic}"
    ],
    "variables": [
      {
        "symbol": "N_{pe}",
        "meaning": "Number of detected photoelectrons"
      },
      {
        "symbol": "\\sigma_{chromatic}",
        "meaning": "Chromatic dispersion error"
      }
    ],
    "reference": "Pointer: RICH design literature (to be cited in Phase 4, T4.4). Not implemented in the engine."
  },
  {
    "id": "number-photoelectrons-rich",
    "title": "Detected Photoelectrons (RICH)",
    "category": "Cherenkov",
    "description": "Approximation for the number of photoelectrons detected in a RICH counter.",
    "equations": [
      "N_{pe} = N_0 L \\sin^2 \\theta_C"
    ],
    "variables": [
      {
        "symbol": "N_0",
        "meaning": "Detector figure of merit (cm^-1)"
      },
      {
        "symbol": "L",
        "meaning": "Radiator thickness"
      }
    ],
    "reference": "Pointer: RICH design literature (to be cited in Phase 4, T4.4). Not implemented in the engine."
  },
  {
    "id": "cherenkov-angle-dispersion",
    "title": "Cherenkov Angle Dispersion",
    "category": "Cherenkov",
    "description": "Chromatic dispersion of the Cherenkov angle due to the variation of refractive index with wavelength.",
    "equations": [
      "\\Delta \\theta_C = \\frac{1}{n \\sqrt{n^2 \\beta^2 - 1}} \\frac{dn}{d\\lambda} \\Delta \\lambda"
    ],
    "variables": [
      {
        "symbol": "\\frac{dn}{d\\lambda}",
        "meaning": "Chromatic dispersion of the radiator"
      }
    ],
    "reference": "Pointer: chromatic dispersion of the Cherenkov angle; RICH design literature (to be cited in Phase 4, T4.4)."
  }
];
