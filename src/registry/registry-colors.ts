// Temporary stub for registry colors until full design tokens are reintroduced
// Shape: { [name]: Array<{ scale:number; hex:string; rgb:string; hsl:string; oklch:string }> }
export const colors = {
  gray: [
    { scale: 50, hex: '#f9f9f9', rgb: 'rgb(249,249,249)', hsl: 'hsl(0,0%,98%)', oklch: 'oklch(0.98,0,0)' },
    { scale: 100, hex: '#f2f2f2', rgb: 'rgb(242,242,242)', hsl: 'hsl(0,0%,95%)', oklch: 'oklch(0.95,0,0)' },
  ],
  blue: [
    { scale: 50, hex: '#eff6ff', rgb: 'rgb(239,246,255)', hsl: 'hsl(210,100%,97%)', oklch: 'oklch(0.97,0.02,250)' },
    { scale: 100, hex: '#dbeafe', rgb: 'rgb(219,234,254)', hsl: 'hsl(210,94%,93%)', oklch: 'oklch(0.93,0.04,250)' },
  ],
} as const;

export type RegistryColors = typeof colors;
