import { z } from "zod"

// Minimal embedded color palette (removed dependency on registry modules)
const colors: Record<string, Array<{ scale:number; hex:string; rgb:string; hsl:string; oklch:string }>> = {
  gray: [
    { scale: 50, hex: '#f9f9f9', rgb: 'rgb(249,249,249)', hsl: 'hsl(0,0%,98%)', oklch: 'oklch(0.98,0,0)' },
    { scale: 100, hex: '#f2f2f2', rgb: 'rgb(242,242,242)', hsl: 'hsl(0,0%,95%)', oklch: 'oklch(0.95,0,0)' },
  ],
  blue: [
    { scale: 50, hex: '#eff6ff', rgb: 'rgb(239,246,255)', hsl: 'hsl(210,100%,97%)', oklch: 'oklch(0.97,0.02,250)' },
    { scale: 100, hex: '#dbeafe', rgb: 'rgb(219,234,254)', hsl: 'hsl(210,94%,93%)', oklch: 'oklch(0.93,0.04,250)' },
  ],
}

const colorSchema = z.object({
  name: z.string(),
  id: z.string(),
  scale: z.number(),
  className: z.string(),
  hex: z.string(),
  rgb: z.string(),
  hsl: z.string(),
  foreground: z.string(),
  oklch: z.string(),
})

const colorPaletteSchema = z.object({
  name: z.string(),
  colors: z.array(colorSchema),
})

export type ColorPalette = z.infer<typeof colorPaletteSchema>

export function getColorFormat(color: Color) {
  return {
    className: `bg-${color.name}-100`,
    hex: color.hex,
    rgb: color.rgb,
    hsl: color.hsl,
    oklch: color.oklch,
  }
}

export type ColorFormat = keyof ReturnType<typeof getColorFormat>

export function getColors() {
  const tailwindColors = colorPaletteSchema.array().parse(
    Object.entries(colors)
      .map(([name, color]) => {
        if (!Array.isArray(color)) {
          return null
        }

        return {
          name,
          colors: color.map((color) => {
            const rgb = color.rgb.replace(
              /^rgb\((\d+),(\d+),(\d+)\)$/,
              "$1 $2 $3"
            )

            return {
              ...color,
              name,
              id: `${name}-${color.scale}`,
              className: `${name}-${color.scale}`,
              rgb,
              hsl: color.hsl.replace(
                /^hsl\(([\d.]+),([\d.]+%),([\d.]+%)\)$/,
                "$1 $2 $3"
              ),
              oklch: color.oklch.replace(
                /^oklch\(([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\)$/,
                "$1 $2 $3"
              ),
              foreground: getForegroundFromBackground(rgb),
            }
          }),
        }
      })
      .filter(Boolean)
  )

  return tailwindColors
}

export type Color = ReturnType<typeof getColors>[number]["colors"][number]

function getForegroundFromBackground(rgb: string) {
  const [r, g, b] = rgb.split(" ").map(Number)

  function toLinear(number: number): number {
    const base = number / 255
    return base <= 0.04045
      ? base / 12.92
      : Math.pow((base + 0.055) / 1.055, 2.4)
  }

  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

  return luminance > 0.179 ? "#000" : "#fff"
}
