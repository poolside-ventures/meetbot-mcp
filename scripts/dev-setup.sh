#!/bin/bash

# Development setup script for Meet.bot MCP

echo "🚀 Setting up Meet.bot MCP development environment for GitLab..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOF
# Meet.bot API Configuration
MEETBOT_BASE_URL=https://api.meet.bot
MEETBOT_AUTH_TOKEN=your_bearer_token_here
MEETBOT_SESSION_ID=your_session_id_here
EOF
    echo "📝 Please update .env with your actual API credentials"
fi

# Build the package
echo "🔨 Building package..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Meet.bot API credentials"
echo "2. Run 'npm run dev' to start development mode"
echo "3. Run 'npm start' to start the MCP server"
echo "4. Run 'npm test' to run tests"
echo "5. Run 'npm run lint' to check code quality"
echo ""
echo "Happy coding! 🚀"
