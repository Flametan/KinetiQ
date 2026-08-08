/** Gruppiert eine Liste aufeinanderfolgender Elemente nach gemeinsamer (nicht-leerer) supersetGroup-ID. */
export function groupBySuperset<T extends { supersetGroup?: string | null }>(items: T[]): T[][] {
  const groups: T[][] = []
  for (const item of items) {
    const last = groups.at(-1)
    if (item.supersetGroup && last && last[0].supersetGroup === item.supersetGroup) {
      last.push(item)
    } else {
      groups.push([item])
    }
  }
  return groups
}
