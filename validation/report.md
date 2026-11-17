# Validation report

Generated from validation/references.json (retrieved 2026-11-17). Regenerate with `npm run validate`.

| id | quantity | reference | computed | status | source |
|---|---|---|---|---|---|
| pdg-electron-mass | electron mass m_e | 0.51099895069 MeV/c^2 | 0.510999 | pass | PDG 2026 pdgLive node S003 |
| pdg-muon-mass | muon mass | 105.6583755 MeV/c^2 | 105.658 | pass | PDG 2026 pdgLive node S004 |
| pdg-proton-mass | proton mass | 938.27208943 MeV/c^2 | 938.272 | pass | PDG 2026 pdgLive node S016 |
| pdg-kaon-mass | charged kaon mass | 493.677 MeV/c^2 | 493.677 | pass | PDG 2026 pdgLive node S010 (HTML value) |
| pdg-water-I | mean excitation energy, liquid water | 79.7 eV | 79.7000 | pass | PDG 2026 Atomic and Nuclear Properties, water liquid |
| pdg-water-ZoverA | Z/A, liquid water | 0.55509 mol/g | 0.555090 | pass | PDG 2026 Atomic and Nuclear Properties, water liquid |
| estar-electron-collision-0.5MeV | electron collision stopping power, water, 0.5 MeV | 2.034 MeV cm^2/g | 2.03420 | pass | NIST ESTAR (I = 75.0 eV) |
| estar-electron-collision-1MeV | electron collision stopping power, water, 1 MeV | 1.849 MeV cm^2/g | 1.87250 | pass | NIST ESTAR (I = 75.0 eV) |
| estar-electron-collision-2MeV | electron collision stopping power, water, 2 MeV | 1.824 MeV cm^2/g | 1.89677 | known limitation | NIST ESTAR (I = 75.0 eV) |
| estar-electron-csda-0.5MeV | electron CSDA range, water, 0.5 MeV | 0.1766 g/cm^2 | 0.176966 | pass | NIST ESTAR |
| estar-electron-csda-1MeV | electron CSDA range, water, 1 MeV | 0.4367 g/cm^2 | 0.437013 | pass | NIST ESTAR |
| pstar-proton-csda-100MeV | proton CSDA range, water, 100 MeV | 7.718 g/cm^2 | 7.67932 | pass | NIST PSTAR |
| pstar-proton-csda-200MeV | proton CSDA range, water, 200 MeV | 25.96 g/cm^2 | 25.9198 | pass | NIST PSTAR |
| ensdf-sr90-endpoint | Sr-90 beta- endpoint | 545.9 keV | not automated | - | ENSDF (Basu and McCutchan 2020) via NuDat 3 |
| nist-n-bk7-nd | N-BK7 refractive index at 587.56 nm | 1.5168  | 1.51680 | pass | refractiveindex.info, SCHOTT N-BK7, printed nd |
| hale-water-abs-450nm | water absorption coefficient at 450 nm, 25 C | 0.028484 1/m | 0.0284838 | pass | Hale and Querry 1973 via refractiveindex.info: k = 1.02e-9 at 450 nm, alpha = 4 pi k / lambda |
| derived-threshold-electron-water | electron Cherenkov threshold kinetic energy, n = 1.328 | 0.2656 MeV | 0.265587 | pass | derived: PDG electron mass and n = 1.328 (heavy-water index from earlier code, NOT sourced); arithmetic check |
