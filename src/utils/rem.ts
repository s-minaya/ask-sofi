// Las medidas de diseño se expresan en px (16 px = 1 rem), pero se emiten en rem
// para que crezcan con el tamaño de texto que el usuario haya elegido.
export function rem(px: number): string {
  return `${px / 16}rem`
}
