#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 VibeCircles Backend Setup Script');
console.log('=====================================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Error: Node.js version 18 or higher is required');
  console.error(`Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if package.json exists
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the backend directory.');
  process.exit(1);
}

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from template...');
    try {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created successfully');
      console.log('⚠️  Please edit .env file with your Supabase credentials');
    } catch (error) {
      console.error('❌ Error creating .env file:', error.message);
    }
  } else {
    console.error('❌ Error: env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Create uploads directory
const uploadsPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  console.log('\n📁 Creating uploads directory...');
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('✅ Uploads directory created');
  } catch (error) {
    console.error('❌ Error creating uploads directory:', error.message);
  }
} else {
  console.log('✅ Uploads directory already exists');
}

// Test database connection
console.log('\n🔗 Testing database connection...');
try {
  // This will be implemented when we have the database connection
  console.log('⚠️  Database connection test skipped - please configure Supabase credentials first');
} catch (error) {
  console.error('❌ Database connection test failed:', error.message);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\nNext steps:');
console.log('1. Edit .env file with your Supabase credentials');
console.log('2. Set up your Supabase database (see DEPLOYMENT_GUIDE.md)');
console.log('3. Run "npm run dev" to start the development server');
console.log('4. Visit http://localhost:3000/health to test the API');
console.log('\nFor detailed instructions, see:');
console.log('- README.md for API documentation');
console.log('- DEPLOYMENT_GUIDE.md for deployment instructions');
