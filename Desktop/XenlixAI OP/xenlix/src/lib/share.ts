// URL state sharing utilities

export function serializeState(state: any): string {
  try {
    const json = JSON.stringify(state);
    const encoded = btoa(json);
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (error) {
    return '';
  }
}

export function deserializeState<T>(encoded: string): T | null {
  try {
    // Restore base64 padding and characters
    const restored = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = restored + '='.repeat((4 - (restored.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

export function createShareableUrl(
  basePath: string,
  state: any,
  baseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
): string {
  const encoded = serializeState(state);
  if (!encoded) return `${baseUrl}${basePath}`;
  return `${baseUrl}${basePath}?state=${encoded}`;
}

export function getStateFromUrl(): any {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const stateParam = params.get('state');

  if (!stateParam) return null;
  return deserializeState(stateParam);
}

// CSV export utilities
export function exportToCSV(data: Record<string, any>, filename: string): void {
  const headers = Object.keys(data);
  const values = Object.values(data);

  const csvContent = [
    headers.join(','),
    values.map((val) => (typeof val === 'object' ? JSON.stringify(val) : String(val))).join(','),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Copy to clipboard utilities
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    return false;
  }
}

export function copyJsonToClipboard(data: any): Promise<boolean> {
  const json = JSON.stringify(data, null, 2);
  return copyToClipboard(json);
}
