const defaultEnv: Record<string, string> = {
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'local-dev-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
  DATABASE_URL: 'file:./prisma/dev.db',
  GOOGLE_CLIENT_ID: 'local-google-client-id',
  GOOGLE_CLIENT_SECRET: 'local-google-client-secret',
  FIREBASE_PROJECT_ID: 'local-firebase-project',
  FIREBASE_CLIENT_EMAIL: 'local-firebase@example.com',
  FIREBASE_PRIVATE_KEY:
    '-----BEGIN PRIVATE KEY-----\\nLOCAL_FAKE_KEY\\n-----END PRIVATE KEY-----\\n',
};

for (const [key, value] of Object.entries(defaultEnv)) {
  if (!process.env[key] || process.env[key]?.length === 0) {
    process.env[key] = value;
  }
}

async function run() {
  const { GET } = await import('../src/app/api/health/route');
  const response = await GET();
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
