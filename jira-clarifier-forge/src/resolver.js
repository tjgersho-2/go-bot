import api, { route, fetch } from '@forge/api';
import Resolver from '@forge/resolver';

const resolver = new Resolver();

/**
 * Fetch issue data from Jira
 */
const getIssueData = async (issueKey) => {
  try {
    const response = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch issue: ${response.status}`);
    }

    const issue = await response.json();
    
    return {
      title: issue.fields.summary,
      description: extractDescription(issue.fields.description),
      issueType: issue.fields.issuetype?.name,
      priority: issue.fields.priority?.name,
      status: issue.fields.status?.name
    };
  } catch (error) {
    console.error('Error fetching issue:', error);
    throw error;
  }
};

/**
 * Extract plain text from Jira's Atlassian Document Format (ADF)
 */
const extractDescription = (description) => {
  if (!description) return '';
  
  let text = '';
  
  const traverse = (node) => {
    if (node.type === 'text') {
      text += node.text + ' ';
    }
    
    if (node.content) {
      node.content.forEach(traverse);
    }
  };
  
  traverse(description);
  return text.trim();
};

/**
 * Call the AI clarification service
 */
const callClarificationAPI = async (issueData) => {
  try {
    const response = await fetch('https://jira-clarifier.up.railway.app/clarify', {
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
    console.error('Error calling clarification API:', error);
    throw error;
  }
};

/**
 * Update Jira issue with clarified content
 */
const updateIssueDescription = async (issueKey, clarifiedData) => {
  const { acceptanceCriteria, edgeCases, successMetrics, testScenarios } = clarifiedData;
  
  // Build the new description in ADF format
  const newDescription = {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '✅ Acceptance Criteria' }]
      },
      {
        type: 'bulletList',
        content: acceptanceCriteria.map(criteria => ({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: criteria }]
          }]
        }))
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '⚠️ Edge Cases' }]
      },
      {
        type: 'bulletList',
        content: edgeCases.map(edge => ({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: edge }]
          }]
        }))
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '📊 Success Metrics' }]
      },
      {
        type: 'bulletList',
        content: successMetrics.map(metric => ({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: metric }]
          }]
        }))
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '🧪 Test Scenarios' }]
      },
      {
        type: 'bulletList',
        content: testScenarios.map(scenario => ({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: scenario }]
          }]
        }))
      }
    ]
  };

  try {
    const response = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            description: newDescription
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update issue: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating issue:', error);
    throw error;
  }
};

/**
 * Resolver function for clarifying an issue
 */
resolver.define('clarifyIssue', async ({ payload }) => {
  const { issueKey } = payload;
  
  try {
    // Fetch issue data
    const issueData = await getIssueData(issueKey);
    
    // Call AI service
    const clarifiedData = await callClarificationAPI(issueData);
    
    return clarifiedData;
  } catch (error) {
    console.error('Error in clarifyIssue resolver:', error);
    return {
      error: 'Failed to clarify ticket. Please try again or contact support.'
    };
  }
});

/**
 * Resolver function for updating an issue
 */
resolver.define('updateIssue', async ({ payload }) => {
  const { issueKey, clarifiedData } = payload;
  
  try {
    await updateIssueDescription(issueKey, clarifiedData);
    return { success: true };
  } catch (error) {
    console.error('Error in updateIssue resolver:', error);
    return {
      error: 'Failed to update ticket. Please try again.'
    };
  }
});

export const handler = resolver.getDefinitions();