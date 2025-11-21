import React, { useEffect, useState  } from 'react';
// useProductContext hook retrieves current product context
import ForgeReconciler, { 
    Text, 
    Button,
    Em,
    Heading,
    useProductContext,
    Stack,
    Box,
    ButtonGroup,
    SectionMessage
 } from '@forge/react';
// requestJira calls the Jira REST API
import { requestJira, invoke } from '@forge/bridge';

const App = () => {
    const context = useProductContext();
    const issueKey = context?.issueKey;
    
    const [clarifiedData, setClarifiedData] = useState(null);
    const [isAnalyzing, setAnalyzing] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [issueDetails, setIssueDetails] = useState(null)
    
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
      
    const getIssueData = async (issueKey) => {
        try {
          const response = await requestJira(
           `/rest/api/3/issue/${issueKey}`,
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
        const response = await requestJira(
         `/rest/api/3/issue/${issueKey}`,
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
        throw error;
      }
    };

    const clarifyTicket = async (ctx) => {
        if(issueDetails){
            setAnalyzing(true);
            setError(null);
            try {
                const result = await invoke('clarifyIssue', { issueData: issueDetails });
                if (result.error) {
                  setError(result.error);
                } else {
                  setClarifiedData(result);
                }
            } catch (err) {
                console.error('Invoke error:', err);
                setError('Failed to clarify ticket. Please try again.');
            } finally {
                // CRITICAL: Always reset loading state
                setAnalyzing(false);
            }
        }
    };

    const applyToTicket = async () => {
        setLoading(true);
        try {
          const issueKey = context?.extension.issue.id;
          const res = await updateIssueDescription(issueKey,  clarifiedData);
          // Show success message
          setClarifiedData({ ...clarifiedData, applied: true });
        } catch (err) {
          setError(`Failed to apply changes. Please try again. ${err}`);
        } finally {
          setLoading(false);
        }
    };

    const resetAnalysis = async () => {
      setClarifiedData(null);
      setLoading(false);
      setAnalyzing(false);
      setError(null);
      const issueId = context?.extension.issue.id;
      getIssueData(issueId).then(setIssueDetails);
    }

    const renderClarifiedContent = () => {
      if (!clarifiedData) return null;
  
      const { acceptanceCriteria, edgeCases, successMetrics, testScenarios, applied } = clarifiedData;

      return (
        <Box>
          {applied ? (
            <SectionMessage title="Success" appearance="confirmation">
              <Text>Changes have been applied to the ticket description! Refresh browser to view.</Text>
            </SectionMessage>
          ):<></>}
  
          {acceptanceCriteria && acceptanceCriteria.length > 0 ? (
            <Box>
              <Heading size="small">✅ Acceptance Criteria</Heading>
              {acceptanceCriteria.map((criteria, i) => (
                <Text key={i}>• {criteria}</Text>
              ))}
            </Box>
          ):<></>}
  
          {edgeCases && edgeCases.length > 0  ? (
            <Box>
              <Heading size="small">⚠️ Edge Cases to Consider</Heading>
              {edgeCases.map((edge, i) => (
                <Text key={i}>• {edge}</Text>
              ))}
            </Box>
          ):<></>}
  
          {successMetrics && successMetrics.length > 0 ? (
            <Box>
              <Heading size="small">📊 Success Metrics</Heading>
              {successMetrics.map((metric, i) => (
                <Text key={i}>• {metric}</Text>
              ))}
            </Box>
          ):<></>}
  
          {testScenarios && testScenarios.length > 0 ? (
            <Box>
              <Heading size="small">🧪 Test Scenarios</Heading>
              {testScenarios.map((scenario, i) => (
                <Text key={i}>• {scenario}</Text>
              ))}
            </Box>
          ):<></>}
  
        </Box>
      );
    };

    const render_buttons = () =>{
      let initial = true;
      let applied = false;
      if (clarifiedData) {
        applied = clarifiedData?.applied;
        initial = false;
      }

      let jsx;
    
      if(applied){
        jsx = <Button onClick={resetAnalysis}>Reset</Button>
      }else{
        if(!initial){
          jsx = <ButtonGroup>
                  <Button 
                    onClick={applyToTicket}
                    appearance="primary"
                  >Apply to Ticket</Button>
                  <Button 
                    onClick={clarifyTicket}
                  >Clarify Again</Button>
                </ButtonGroup>
        }else{
          jsx = <Button 
                  onClick={clarifyTicket}
                  appearance="primary"
                >
                Clarify Ticket
              </Button>
        }
      }
      return (
      <Box>
        {jsx}
      </Box>);

    }

 React.useEffect(() => {
   if (context) {
     const issueId = context?.extension.issue.id;
     getIssueData(issueId).then(setIssueDetails);
   }
 }, [context]);


 return (
    <Box>
 
      <Stack>
        <Text>
          <Em>Transform vague tickets into crystal-clear scope with acceptance criteria.</Em>
        </Text>
      </Stack>
    
    {error ? 
        (  
        <SectionMessage title="Error" appearance="error">
          <Text>{error}</Text>
        </SectionMessage>
        ) : <></>
    }
 
    {isAnalyzing ? (
       <Box>
        <Text>⏳ Analyzing ticket...</Text>
        <Text>
            <Em>This can take 30 seconds...</Em>
        </Text>
       </Box>
    ) : <></>}

    {isLoading ? (
       <Box>
        <Text>⏳ Saving to ticket Description...</Text>
       </Box>
    ) : <></>}

    {render_buttons()}

    {renderClarifiedContent()}

  </Box>
 );
};

ForgeReconciler.render(
 <React.StrictMode>
   <App />
 </React.StrictMode>
);
