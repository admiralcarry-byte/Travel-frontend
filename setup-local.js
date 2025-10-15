#!/usr/bin/env node

/**
 * Frontend Local Development Setup Script
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== FRONTEND LOCAL DEVELOPMENT SETUP ===\n');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file...');
  const envContent = `# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Development Configuration
VITE_NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✓ Created .env file with local configuration');
} else {
  console.log('✓ .env file already exists');
}

console.log('\n=== FRONTEND SETUP COMPLETE ===');
console.log('Next steps:');
console.log('1. Make sure the backend is running on http://localhost:5000');
console.log('2. Run: npm run dev (to start the frontend development server)');
console.log('\nThe frontend will be available at: http://localhost:5173');