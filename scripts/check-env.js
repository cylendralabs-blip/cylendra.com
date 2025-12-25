#!/usr/bin/env node

/**
 * Script to check environment variables during build
 * This helps identify missing env vars before the build completes
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually (since we're in ES module mode)
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    });
  } catch (e) {
    // Ignore errors reading .env
  }
}

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

console.log('🔍 Checking environment variables...\n');

let allPresent = true;
const missing = [];

for (const varName of requiredVars) {
  const value = process.env[varName];
  
  if (!value || value.trim() === '') {
    console.error(`❌ ${varName} is missing`);
    missing.push(varName);
    allPresent = false;
  } else {
    console.log(`✅ ${varName} is set`);
  }
}

if (!allPresent) {
  console.error('\n⚠️  Some required environment variables are missing!');
  console.error('📝 Make sure to set them in Netlify Dashboard > Site settings > Environment variables');
  console.error('\nMissing variables:', missing.join(', '));
  console.error('\n💡 The build will continue using fallback values from the code.');
  console.error('💡 To use your Netlify env vars, make sure they are set before building.\n');
  process.exit(0); // Don't fail the build, just warn
} else {
  console.log('\n✅ All required environment variables are present!\n');
  process.exit(0);
}

