export const LAB_SECTIONS = [
  { key: 'foundations', num: '01', label: 'Foundations' },
  { key: 'ui', num: '02', label: 'UI Components' },
  { key: 'sofi', num: '03', label: 'Sofi Components' },
  { key: 'motion', num: '04', label: 'Motion & Sound' },
  { key: 'preview', num: '05', label: 'Experience Preview' },
] as const

export type LabSectionKey = (typeof LAB_SECTIONS)[number]['key']

export function sectionFromSearch(search: string): LabSectionKey {
  const key = new URLSearchParams(search).get('s')
  return (
    LAB_SECTIONS.find((section) => section.key === key)?.key ?? 'foundations'
  )
}

export function sectionHref(key: LabSectionKey): string {
  return `?s=${key}`
}
