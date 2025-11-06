// Server-safe URL utilities (no window/document)

/**
 * Normalize canonical URL on the server.
 * - Ensures a leading slash for internal paths
 * - Resolves against NEXT_PUBLIC_SITE_URL when provided
 * - Removes duplicate slashes
 * - Preserves protocol/host for absolute URLs
 */
export function normalizeCanonicalUrlServer(pathOrUrl: string): string {
  try {
    // Absolute URL => return as-is normalized by URL
    if (/^https?:\/\//i.test(pathOrUrl)) {
      const u = new URL(pathOrUrl);
      // Clean up any duplicate slashes in pathname
      u.pathname = u.pathname.replace(/\/+/, '/');
      return u.toString().replace(/\/$/, ''); // trim trailing slash (except root)
    }

    // Relative path => ensure leading slash
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;

    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://xenlix.ai';
    const base = new URL(site);
    base.pathname = `${base.pathname.replace(/\/$/, '')}${path}`.replace(/\/+/, '/');

    const normalized = base.toString();
    // Avoid trailing slash except for root
    return normalized.endsWith('/') && base.pathname !== '/' ? normalized.slice(0, -1) : normalized;
  } catch {
    // Fallback to original input on error
    return pathOrUrl;
  }
}
