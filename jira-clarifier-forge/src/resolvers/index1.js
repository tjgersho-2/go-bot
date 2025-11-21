import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getText', async (req) => {
  try{
    const response = await fetch('https://jira-clarifier-production.up.railway.app/health');
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
 * Call the AI clarification service
 */
const callClarificationAPI = async (issueData) => {
  try {
    const response = await fetch('https://jira-clarifier-production.up.railway.app/clarify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueData.title,
        description: issueData.description,
        issueType: issueData.issueType,
        priority: issueData.priority
      })
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
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
resolver.define('clarifyIssue', async ( { payload } ) => {
  const { issueData } = payload;
  try {
    // Call AI service
    const clarifiedData = await callClarificationAPI(issueData);
    return clarifiedData;
  } catch (error) {
    return {
      error: `Failed to clarify ticket. Please try again or contact support. ${error}`
    };
  }
});


export const handler = resolver.getDefinitions();
