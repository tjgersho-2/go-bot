import Resolver from '@forge/resolver';

const resolver = new Resolver();

// Base API URL - use environment variable or hardcode
const API_BASE_URL = 'https://jira-clarifier-production.up.railway.app';

/**
 * Health check resolver (for testing)
 */
resolver.define('getHealth', async (req) => {
  try{
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
});


/**
 * Health check resolver (for testing)
 */
resolver.define('getKeyByInstall', async ({ payload }) => {
  try{
    const { install } = payload;
    const response = await fetch(`${API_BASE_URL}/find-key-by-install`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        install:  install
      })
     }
    );
    if (!response.ok) {
      return response;
    }
    const data = await response.json();
    return data;
  }catch(e){
    return e;
  }
});

 
/**
 * Call the AI clarification service
 */
const callClarificationAPI = async (issueData, customPrompt, install, accessKey) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clarify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueData.title,
        description: issueData.description,
        issueType: issueData.issueType,
        priority: issueData.priority,
        customPrompt: customPrompt || '',
        install: install || 'unknown',
        accessKey
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Resolver function for clarifying an issue
 */
resolver.define('clarifyIssue', async ({ payload }) => {
  const { issueData, customPrompt, install, accessKey } = payload;
  
  try {
    // Call AI service with orgId for rate limiting
    const clarifiedData = await callClarificationAPI(issueData, customPrompt, install, accessKey);
    return clarifiedData;
  } catch (error) {
    return {
      error: error.message || 'Failed to clarify ticket. Please try again or contact support.'
    };
  }
}, { runAsync: true });

 
/**
 * Generate code from clarified ticket data
 * This is Step 2 of the GoBot workflow
 * 
 * Frontend sends:
 * - issueData.title - The ticket title
 * - issueData.description - The full ticket description (already contains clarified data from Step 1)
 * - customPrompt - Optional custom instructions (e.g., "Use Python", "Include TypeScript types")
 * - install - Installation/organization ID
 * - accessKey - License key for auth
 */
resolver.define('genCode', async ({ payload }) => {
  const { issueData, install, customPrompt, accessKey } = payload;

  try {
      // Combine title and description into jiraDescription
      // The description already contains the clarified data (acceptance criteria, edge cases, etc.)
      // since the user applied it to the ticket in Step 1
      const jiraDescription = `# ${issueData.title || 'Untitled'}\n\n${issueData.description || ''}`;
      
      const requestBody = {
          jiraDescription: jiraDescription,
          customPrompt: customPrompt || '',
          install: install,
          accessKey: accessKey || null
      };
      
 
      const response = await fetch(`${API_BASE_URL}/gen-code`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));          
          // Handle rate limiting
          if (response.status === 429) {
              return { 
                  error: errorData.detail || 'Monthly usage limit reached. Please upgrade your plan.' 
              };
          }
          
          return { 
              error: errorData.detail || `Code generation failed: ${response.status}` 
          };
      }
      
      const result = await response.json();
      return result;
      
  } catch (error) {
      return { 
          error: `Failed to generate code. Please try again. ${error}` 
      };
  }
}, { runAsync: true });

 

/**
 * Validate access key
 */
resolver.define('validateAccessKey', async ({ payload }) => {
  const { accessKey, install } = payload;
  
  try {
    const response = await fetch(`${API_BASE_URL}/validate-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessKey: accessKey,
        install: install
      })
    });
    
    if (!response.ok) {
      throw new Error(`Validation failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Access key validation error:', error);
    return {
      valid: false,
      message: 'Failed to validate access key. Please try again.'
    };
  }
});

/**
 * Submit feedback (upvote/downvote)
 */
resolver.define('submitFeedback', async ({ payload }) => {
  const { ticketData, clarifiedOutput, feedbackType, orgId } = payload;
  
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticketData: ticketData,
        clarifiedOutput: clarifiedOutput,
        feedbackType: feedbackType,
        orgId: orgId,
        comment: null
      })
    });
    
    if (!response.ok) {
      throw new Error(`Feedback submission failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Feedback submission error:', error);
    // Don't throw error for feedback - just log it
    return {
      status: 'error',
      message: 'Failed to submit feedback'
    };
  }
});

export const handler = resolver.getDefinitions();