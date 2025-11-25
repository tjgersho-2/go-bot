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
    SectionMessage,
    Form,
    Link,
    Textfield,
    Modal,
    ModalTransition
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
    const [issueDetails, setIssueDetails] = useState(null);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    
    // Access key state
    const [isKeyModalOpen, setKeyModalOpen] = useState(false);
    const [accessKey, setAccessKey] = useState('');
    const [orgId, setOrgId] = useState(null);
    const [plan, setPlan] = useState('free');
    const [isValidatingKey, setValidatingKey] = useState(false);
    
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

    const checkOnAccessKey = async () =>{
        const result = await invoke('getKeyByInstall');
        if (result.valid) {
            setOrgId(result.orgId);
            setPlan(result.plan);
            setKeyModalOpen(false);
            setAccessKey(result.key);
            return result.key;
        } else {
            throw 'No Key Found';
        }
    }


    const validateAccessKey = async (key) => {
        setValidatingKey(true);
        setError(null);
        
        try {
            const result = await invoke('validateAccessKey', { accessKey: key });
            
            if (result.valid) {
                setOrgId(result.orgId);
                setPlan(result.plan);
                setKeyModalOpen(false);
                setError(null);
                return true;
            } else {
                setError(result.message || 'Invalid access key');
                return false;
            }
        } catch (err) {
            console.error('Key validation error:', err);
            setError('Failed to validate access key. Please try again.');
            return false;
        } finally {
            setValidatingKey(false);
        }
    };

    const handleKeySubmit = async () => {
        if (!accessKey || accessKey.trim() === '') {
            setError('Please enter an access key');
            return;
        }
        
        await validateAccessKey(accessKey.trim().toUpperCase());
    };

    const clarifyTicket = async (ctx) => {
        // Check if user has access
        if (!orgId) {
            setKeyModalOpen(true);
            setError('Please enter your access key to use this feature');
            return;
        }
        
        if(issueDetails){
            setAnalyzing(true);
            setError(null);
            setFeedbackSubmitted(false);
            
            try {
                const result = await invoke('clarifyIssue', { 
                    issueData: issueDetails,
                    orgId: orgId 
                });
                
                if (result.error) {
                  setError(result.error);
                } else {
                  setClarifiedData(result);
                }
            } catch (err) {
                console.error('Invoke error:', err);
                setError('Failed to clarify ticket. Please try again.');
            } finally {
                setAnalyzing(false);
            }
        }
    };

    const submitFeedback = async (feedbackType) => {
        if (!clarifiedData || !issueDetails) return;
        
        try {
            await invoke('submitFeedback', {
                ticketData: issueDetails,
                clarifiedOutput: clarifiedData,
                feedbackType: feedbackType,
                orgId: orgId || 'unknown'
            });
            
            setFeedbackSubmitted(true);
        } catch (err) {
            console.error('Feedback error:', err);
        }
    };

    const applyToTicket = async () => {
        setLoading(true);
        try {
          const issueId = context?.extension.issue.id;
          const res = await updateIssueDescription(issueId, clarifiedData);
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
      setFeedbackSubmitted(false);
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

          {/* Feedback buttons */}
          {!feedbackSubmitted && !applied ? (
            <Box>
              <Text><Em>Was this helpful?</Em></Text>
              <ButtonGroup>
                <Button onClick={() => submitFeedback('upvote')}>
                  👍 Yes
                </Button>
                <Button onClick={() => submitFeedback('downvote')}>
                  👎 No
                </Button>
              </ButtonGroup>
            </Box>
          ) : feedbackSubmitted ? (
            <SectionMessage appearance="confirmation">
              <Text>Thank you for your feedback!</Text>
            </SectionMessage>
          ) : <></>}
  
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
        if(!initial) {
          jsx = <ButtonGroup>
                  <Button 
                    onClick={applyToTicket}
                    appearance="primary"
                  >Apply to Ticket</Button>
                  <Button 
                    onClick={clarifyTicket}
                  >Go Bot Again</Button>
                </ButtonGroup>
        } else {
          jsx = <Button 
                  onClick={clarifyTicket}
                  appearance="primary"
                >Go Bot</Button>
        }
      }
      return (
      <Box>
        {jsx}
        {/* Show access key link if no org */}
        {!orgId ? (
          <Button onClick={() => setKeyModalOpen(true)} appearance="link">
            Enter Access Key
          </Button>
        ) : (
          <Text><Em>Plan: {plan}</Em></Text>
        )}
      </Box>);
    }

 React.useEffect(() => {
   if (context) {
     const issueId = context?.extension.issue.id;
     checkOnAccessKey().then((key) => validateAccessKey(key));
     getIssueData(issueId).then(setIssueDetails);
   }
 }, [context]);


 return (
    <Box>
 
      <Stack>
        <Text>
          <Em>Transform tickets into crystal-clear scope with initial AI implementation.</Em>
        </Text>
      </Stack>

      {/* Access Key Modal */}
      <ModalTransition>
        {isKeyModalOpen && (
          <Modal onClose={() => setKeyModalOpen(false)}>
            <Box padding="space.100">
              <Heading size="small">Enter Access Key:</Heading>
              <Text>
                <Em>Enter your license key to unlock GoBot features.</Em>
              </Text>
         
              <Form onSubmit={handleKeySubmit}>
                <Textfield 
                    name="accessKey"
                    label="Access Key"
                    placeholder="JIRA-XXXX-XXXX-XXXX"
                    value={accessKey}
                    onChange={(e) => {setAccessKey(e.target.value)} }
                />
                
                <ButtonGroup>
                  <Button 
                    type="submit" 
                    appearance="primary"
                    isDisabled={isValidatingKey}
                  >
                    {isValidatingKey ? 'Validating...' : 'Validate Key'}
                  </Button>
                  
                  <Button onClick={() => setKeyModalOpen(false)}>
                    Cancel
                  </Button>
                </ButtonGroup>
                
              </Form>
              
              <Text>
                <Em> Don't have a key? </Em> 
                Purchase here: <Link href="https://gobot.ai/checkout">https://gobot.ai/checkout</Link>  
              </Text>  

            </Box>
          </Modal>
        )}
      </ModalTransition>
    
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