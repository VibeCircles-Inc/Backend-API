#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 VibeCircles Backend Setup Script');
console.log('=====================================\n');

// Generate secure secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const sessionSecret = crypto.randomBytes(32).toString('hex');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  if (fs.existsSync(envExamplePath)) {
    // Copy from example and replace secrets
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    envContent = envContent.replace('your-super-secret-jwt-key-change-this-in-production', jwtSecret);
    envContent = envContent.replace('your-session-secret-key', sessionSecret);
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created with secure secrets');
  } else {
    console.log('❌ env.example file not found');
    process.exit(1);
  }
} else {
  console.log('ℹ️  .env file already exists, skipping creation');
}

// Create uploads directory
const uploadsPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ Uploads directory created');
} else {
  console.log('ℹ️  Uploads directory already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('\n📦 Installing dependencies...');
  console.log('Run: npm install');
} else {
  console.log('✅ Dependencies already installed');
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Configure your database connection in .env');
console.log('3. Import the database schema from ../vibecircles_schema.sql');
console.log('4. Run: npm run dev');
console.log('5. Visit: http://localhost:3000/health');
console.log('\nFor deployment instructions, see: DEPLOYMENT.md');
