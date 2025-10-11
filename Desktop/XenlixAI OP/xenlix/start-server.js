const { execSync } = require('child_process');
const path = require('path');

// Change to the correct directory
process.chdir('C:\\Users\\Tyson\\Desktop\\XenlixAI OP\\xenlix');

console.log('Current directory:', process.cwd());
console.log('Starting Next.js development server...');

try {
  // Start the development server
  execSync('npx next dev --port 3002', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
} catch (error) {
  console.error('Error starting server:', error.message);
  process.exit(1);
}
