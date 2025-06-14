# Environment Setup for AI Insights

## Required Environment Variables

To enable AI-powered insights, you need to set up the following environment variable:

### GEMINI_API_KEY

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your environment variables:

**For local development (.env.local):**

```
GEMINI_API_KEY=your_api_key_here
```

**For production deployment:**
Set the environment variable in your hosting platform (Vercel, Netlify, etc.)

## Testing the Setup

After setting up the API key, you can test the AI insights by:

1. Navigate to the AI Insights page in your dashboard
2. Click "Generate AI Insights"
3. The system will analyze your goals, technical logs, and projects to provide personalized insights

## Features Enabled with AI

- **Trend Analysis**: Identifies patterns in your development activities
- **Predictive Insights**: Forecasts potential skill development paths
- **Actionable Suggestions**: Provides specific recommendations for improvement
- **Pattern Recognition**: Discovers hidden connections in your work

## Fallback Behavior

If the API key is not configured:

- The system will show an error message
- No demo data will be provided
- Users will be prompted to contact the administrator

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Rotate API keys regularly
- Monitor API usage and costs
