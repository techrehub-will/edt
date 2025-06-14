# Engineering Development Tracker

_A comprehensive engineering project management and tracking application with AI-powered insights_

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/william-s-projects-7db35d0b/v0-engineering-development-tracke)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/FZLK6u3nIsJ)

## Overview

The Engineering Development Tracker is a powerful application designed to help engineers track their goals, document technical solutions, manage improvement projects, and gain AI-powered insights into their engineering journey.

### Key Features

- **🎯 Goal Tracking**: Set, monitor, and achieve engineering development goals
- **📋 Technical Logs**: Document problems, solutions, and lessons learned
- **🚀 Project Management**: Track improvement projects and their outcomes
- **🤖 AI-Powered Insights**: Get intelligent analysis and recommendations
- **💬 AI Copilot**: Interactive assistant that understands your engineering data
- **📊 Analytics**: Visualize progress and identify patterns
- **📱 Modern UI**: Responsive design with dark/light mode support

## AI Features

### AI Copilot

The AI Copilot is an intelligent assistant that can:

- Analyze your engineering data and provide personalized insights
- Answer questions about your goals, projects, and technical logs
- Identify patterns and trends in your work
- Provide recommendations for skill development and project prioritization
- Include both personal context and general engineering knowledge

**Access**: Navigate to Dashboard > AI Copilot

### AI Report Generator

Automatically generate structured technical reports from natural language descriptions:

- Convert problem descriptions into formatted technical logs
- Suggest appropriate tags and categories
- Provide consistent documentation structure

### Smart Goal Assistant

Get AI assistance for creating SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals based on your engineering focus areas.

## Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Gemini AI API Key for AI features
GEMINI_API_KEY=your-gemini-api-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file as `GEMINI_API_KEY`

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd edt

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run the development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

Your project is live at:

**[https://vercel.com/william-s-projects-7db35d0b/v0-engineering-development-tracke](https://vercel.com/william-s-projects-7db35d0b/v0-engineering-development-tracke)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/FZLK6u3nIsJ](https://v0.dev/chat/projects/FZLK6u3nIsJ)**

## Documentation

- [AI Copilot Documentation](./AI_COPILOT_DOCUMENTATION.md) - Detailed guide on using the AI Copilot feature
- [Project Management Guide](./PROJECT_MANAGEMENT_IMPROVEMENTS.md) - Best practices for managing engineering projects

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI Integration**: Google Gemini AI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Contributing

This project is continuously developed through v0.dev. Major features and improvements are implemented through the AI-assisted development process.
