/**
 * URL Validation Utility
 * Provides comprehensive client-side and server-side URL validation
 */

interface ValidationResult {
  ok: boolean;
  reason?: string;
  fixed?: string;
}

/**
 * Validates a URL input and provides user-friendly error messages
 * @param input - The URL string to validate
 * @returns ValidationResult with ok status, error reason, and suggested fix
 */
export function validateUrl(input: string): ValidationResult {
  // Trim whitespace
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      ok: false,
      reason: 'Please enter a website URL',
    };
  }

  // Check for obvious issues first
  if (trimmed.includes(' ')) {
    return {
      ok: false,
      reason: 'Website URL cannot contain spaces. Use a single domain like https://example.com',
    };
  }

  // Check if protocol is missing and tentatively add https://
  let urlToTest = trimmed;
  let protocolAdded = false;

  if (!/^https?:\/\//i.test(trimmed)) {
    urlToTest = `https://${trimmed}`;
    protocolAdded = true;
  }

  // Try to parse the URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlToTest);
  } catch {
    return {
      ok: false,
      reason: 'Invalid website address. Use a full domain like https://example.com',
    };
  }

  // Validate the hostname
  const hostname = parsedUrl.hostname.toLowerCase();

  // Must contain at least one dot
  if (!hostname.includes('.')) {
    return {
      ok: false,
      reason: 'Domain looks incomplete. Include a TLD extension like .com, .org, .net, etc.',
    };
  }

  // No trailing dot
  if (hostname.endsWith('.')) {
    return {
      ok: false,
      reason: 'Domain cannot end with a dot. Use a format like https://example.com',
    };
  }

  // Check for private/localhost addresses
  if (isPrivateOrLocalhost(hostname)) {
    return {
      ok: false,
      reason:
        'Domain looks incomplete or non-public. Include a TLD (e.g., .com) and a public domain.',
    };
  }

  // Check if the domain has a valid TLD (basic check)
  const parts = hostname.split('.');
  const tld = parts[parts.length - 1];

  if (tld.length < 2 || /^\d+$/.test(tld)) {
    return {
      ok: false,
      reason: 'Domain needs a valid extension like .com, .org, .net, etc.',
    };
  }

  // If we added protocol and everything looks good, suggest the fixed version
  if (protocolAdded) {
    return {
      ok: true,
      fixed: urlToTest,
    };
  }

  return { ok: true };
}

/**
 * Checks if a hostname is private, localhost, or invalid for public websites
 */
function isPrivateOrLocalhost(hostname: string): boolean {
  // Localhost variants
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  // Check for IP addresses
  const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipPattern);

  if (ipMatch) {
    const [, a, b, c, d] = ipMatch.map(Number);

    // Invalid IP ranges
    if (a > 255 || b > 255 || c > 255 || d > 255) return true;

    // Private IP ranges
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 127) return true; // 127.0.0.0/8 (loopback)
  }

  // Check for obviously incomplete domains (no TLD)
  if (!hostname.includes('.')) return true;

  // Check for single-word domains that are likely incomplete
  const parts = hostname.split('.');
  if (parts.length < 2) return true;

  // Last part should be a valid TLD (basic check)
  const lastPart = parts[parts.length - 1];
  if (lastPart.length < 2 || /^\d+$/.test(lastPart)) return true;

  return false;
}

/**
 * Server-side URL validation with additional checks
 */
export function validateUrlServer(url: string): ValidationResult {
  const clientResult = validateUrl(url);

  if (!clientResult.ok) {
    return clientResult;
  }

  // Additional server-side checks can go here
  // For now, we'll use the same validation logic

  return clientResult;
}
