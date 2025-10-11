// Bcryptjs fallback implementation
export function hash(data: string, saltRounds: number): Promise<string> {
  return new Promise((resolve) => {
    // Simple base64 hash for development (NOT for production)
    const simple = Buffer.from(data + 'salt').toString('base64');
    resolve(`$bcryptjs$${simple}`);
  });
}

export function compare(data: string, encrypted: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Simple comparison for development (NOT for production)
    const simple = Buffer.from(data + 'salt').toString('base64');
    resolve(encrypted === `$bcryptjs$${simple}`);
  });
}
