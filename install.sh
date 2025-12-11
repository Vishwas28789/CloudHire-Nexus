#!/bin/bash

# CloudHire Nexus Installation Script
# This script sets up both backend and mobile app

set -e

echo "🚀 CloudHire Nexus Installation"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your API keys"
else
    echo "✅ .env file already exists"
fi

echo "Installing backend dependencies..."
npm install

echo "✅ Backend setup complete"
echo ""

# Mobile app setup
echo "📱 Setting up Mobile App..."
cd ../mobile-app

echo "Installing mobile app dependencies..."
npm install

echo "✅ Mobile app setup complete"
echo ""

# Create necessary directories
echo "📁 Creating directories..."
cd ..
mkdir -p backend/database backend/logs backend/database/resumes

echo "✅ Directory structure created"
echo ""

# Summary
echo "✨ Installation Complete!"
echo "========================"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Start backend: cd backend && npm start"
echo "3. Start worker: cd backend && npm run worker"
echo "4. Start mobile app: cd mobile-app && npm start"
echo "5. Run Android: cd mobile-app && npx react-native run-android"
echo ""
echo "For detailed instructions, see docs/GETTING_STARTED.md"
echo ""
echo "Happy job hunting! 🎯"
