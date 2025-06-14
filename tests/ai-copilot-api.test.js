/**
 * Test the AI Copilot API endpoint
 * This is a simple integration test to verify the API works correctly
 */

// Simple test function to validate the AI Copilot API
async function testAICopilotAPI() {
  const testCases = [
    {
      name: 'Basic Question',
      payload: {
        question: 'What are my engineering goals?',
        includeInternet: false
      }
    },
    {
      name: 'Question with Internet',
      payload: {
        question: 'What are best practices for software engineering?',
        includeInternet: true
      }
    },
    {
      name: 'Empty Question (should fail)',
      payload: {
        question: '',
        includeInternet: false
      },
      expectError: true
    }
  ]

  console.log('Testing AI Copilot API...')

  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`)
    
    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.payload)
      })

      const data = await response.json()

      if (testCase.expectError) {
        if (response.status >= 400) {
          console.log('✅ Expected error received:', data.error)
        } else {
          console.log('❌ Expected error but got success')
        }
      } else {
        if (response.ok) {
          console.log('✅ Success:', {
            hasAnswer: !!data.answer,
            answerLength: data.answer?.length || 0,
            contextUsed: data.contextUsed,
            referencesCount: data.dataReferences?.length || 0
          })
        } else {
          console.log('❌ Unexpected error:', data.error)
        }
      }
    } catch (error) {
      console.log('❌ Network/parsing error:', error.message)
    }
  }
}

// Only run if this is being executed as a test
if (typeof window !== 'undefined') {
  // Browser environment - can be called manually
  window.testAICopilotAPI = testAICopilotAPI
  console.log('AI Copilot API test function loaded. Call testAICopilotAPI() to run tests.')
} else {
  // Node environment - export for testing
  module.exports = { testAICopilotAPI }
}
