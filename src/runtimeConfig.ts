export const isReadOnlyMode = import.meta.env.VITE_READ_ONLY_MODE === 'true';

// This bypass is deliberately limited to Vite's development runtime. Even if
// the variable is copied to Vercel, a production build cannot enable it.
export const isLocalDataPreview =
  import.meta.env.DEV && import.meta.env.VITE_LOCAL_DATA_PREVIEW === 'true';

export function assertWritable(operation: string): void {
  if (isReadOnlyMode) {
    throw new Error(`${operation} is disabled while the app is in read-only preview mode.`);
  }
}
