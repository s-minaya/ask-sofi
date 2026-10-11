// Une clases opcionales sin dejar huecos ni valores falsos.
export function cx(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ')
}
