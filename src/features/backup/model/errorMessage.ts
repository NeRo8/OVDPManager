/** The message to show for a failure: an Error's own, or the value as text. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
