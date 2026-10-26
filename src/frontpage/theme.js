export const frontpagePalette = {
  sky: '#ACD9F8',
  forest: '#5C7E6B',
  sand: '#F5D0A1',
  coral: '#D27271',
  stone: '#98A2A9',
  ink: '#15394D',
  paper: '#FFF9F0',
}

export const frontpageThemeVariables = Object.fromEntries(
  Object.entries(frontpagePalette).map(([name, value]) => [`--fp-${name}`, value]),
)
