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
const callClarificationAPI = async (issueData, install) => {
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
        install: install || 'unknown'
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
  const { issueData, install } = payload;
  
  try {
    // Call AI service with orgId for rate limiting
    const clarifiedData = await callClarificationAPI(issueData, install);
    return clarifiedData;
  } catch (error) {
    return {
      error: error.message || 'Failed to clarify ticket. Please try again or contact support.'
    };
  }
});


/**
 * Call the AI clarification service
 */
const callCodeGenAPI = async (issueData, install) => {
  try {
    const response = await fetch(`${API_BASE_URL}/gen-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueData.title,
        description: issueData.description,
        issueType: issueData.issueType,
        priority: issueData.priority,
        install: install || 'unknown'
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


resolver.define('genCode', async ({ payload }) => {
  const { issueData, install } = payload;
  
  try {
    // Call AI service with orgId for rate limiting
    const clarifiedData = await callCodeGenAPI(issueData, install);
    return clarifiedData;
  } catch (error) {
    return {
      error: error.message || 'Failed to generate code for ticket. Please try again or contact support.'
    };
  }
});

 

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