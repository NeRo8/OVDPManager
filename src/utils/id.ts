/** A unique enough id for a record of this device: the time and a random tail, «lz3k9x-4f8a2c». */
export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
