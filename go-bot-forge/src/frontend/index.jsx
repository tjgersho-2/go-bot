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
    Label,
    Link,
    TextArea,
    Textfield,
    Modal,
    ModalTransition
 } from '@forge/react';
// requestJira calls the Jira REST API
import { requestJira, invoke } from '@forge/bridge';

const App = () => {
    const context = useProductContext();

    const [clarifiedData, setClarifiedData] = useState(null);
    const [codeImplementation, setCodeImplmentation] = useState(null);
    const [isAnalyzing, setAnalyzing] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [issueDetails, setIssueDetails] = useState(null);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [clarifyCustomPrompt, setClarifyCustomPrompt] = useState(null);
    const [codeGenCustomPrompt, setCodeGenCustomPrompt]  = useState(null);
    const [showCustomPromptForm, setShowCustomPromptForm] = useState(false);
    // Access key state
    const [isKeyModalOpen, setKeyModalOpen] = useState(false);
    const [accessKey, setAccessKey] = useState('');
    const [install, setInstall] = useState(null);
    const [plan, setPlan] = useState('free');
    const [isValidatingKey, setValidatingKey] = useState(false);
    

    const checkHealth = async () => {
      try {
          const results = await invoke('getHealth');
          console.log('results');
          console.log(results);
      } catch (err) {
          console.error('Results error', err);
      }
    };

    
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

    const checkOnAccessKey = async (install) =>{
      try {
        setValidatingKey(true);
        setError(null);
        const result = await invoke('getKeyByInstall', { install: install });
        if (result.isActive) {
            setInstall(install);
            setPlan(result.plan);
            setKeyModalOpen(false);
            setAccessKey(result.keyCode);
            return {install: install, accessKey: result.keyCode};
        } else {
            console.log("No key found by install.");
            return null;
        }
      }catch(e){
        console.error(e);
      } finally {
        setValidatingKey(false);
  
      }
    }


    const validateAccessKey = async (install, key) => {
        setValidatingKey(true);
        setError(null);

        console.log("Validating Access Key");
        console.log(key, install);
        
        try {
            const result = await invoke('validateAccessKey', { accessKey: key, install: install });
            
            if (result.valid) {
                setInstall(result.install);
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
        await validateAccessKey(install, accessKey.trim().toUpperCase());
    };

    const clarifyTicket = async (ctx) => {
        // Check if user has access
        if (!install) {
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
                    install: install,
                    customPrompt: clarifyCustomPrompt
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

    const formatClarifiedDescription = (clarifiedData, originalDescription = '') => {
          let description = '';
          
          // Include original description if available
          if (originalDescription) {
              description += `${originalDescription}\n\n`;
          }
          
          const { acceptanceCriteria, edgeCases, successMetrics, testScenarios } = clarifiedData;
          
          if (acceptanceCriteria && acceptanceCriteria.length > 0) {
              description += '✅ Acceptance Criteria\n';
              acceptanceCriteria.forEach(item => {
                  description += `• ${item}\n`;
              });
              description += '\n';
          }
          
          if (edgeCases && edgeCases.length > 0) {
              description += '⚠️ Edge Cases\n';
              edgeCases.forEach(item => {
                  description += `• ${item}\n`;
              });
              description += '\n';
          }
          
          if (successMetrics && successMetrics.length > 0) {
              description += '📊 Success Metrics\n';
              successMetrics.forEach(item => {
                  description += `• ${item}\n`;
              });
              description += '\n';
          }
          
          if (testScenarios && testScenarios.length > 0) {
              description += '🧪 Test Scenarios\n';
              testScenarios.forEach(item => {
                  description += `• ${item}\n`;
              });
          }
          
          return description.trim();
      };
      

      const goBotCode = async (ctx) => {
        if (clarifiedData) {
            setAnalyzing(true);
            setError(null);
            setFeedbackSubmitted(false);
            
            try {
                // Format the clarified data into a description string
                const formattedDescription = formatClarifiedDescription(
                    clarifiedData, 
                    issueDetails?.description || ''
                );
                
                const result = await invoke('genCode', { 
                    issueData: {
                        title: issueDetails?.title || '',
                        description: formattedDescription
                    },
                    install: install,
                    customPrompt: customPrompt || '',
                    accessKey: accessKey
                });
                
                if (result.error) {
                    setError(result.error);
                } else {
                    setCodeImplmentation(result);
                }
            } catch (err) {
                console.error('Invoke error:', err);
                setError('Failed to generate code from the ticket. Please try again.');
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
                install: install || 'unknown'
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
      setCodeImplmentation(null);
      setLoading(false);
      setAnalyzing(false);
      setClarifyCustomPrompt(null);
      setCodeGenCustomPrompt(null);
      setError(null);
      setFeedbackSubmitted(false);
      const issueId = context?.extension.issue.id;
      getIssueData(issueId).then(setIssueDetails);
    }

    const renderCodeOutput = () => {
        if (!codeImplementation) return null;
        
        const { files, summary, techStack, setupInstructions, nextSteps } = codeImplementation;
        
        return (
            <Box>
                {summary && (
                    <Box>
                        <Heading size="small">📋 Summary</Heading>
                        <Text>{summary}</Text>
                    </Box>
                )}
                
                {techStack && techStack.length > 0 && (
                    <Box>
                        <Heading size="small">🛠️ Tech Stack</Heading>
                        {techStack.map((tech, i) => (
                            <Text key={i}>• {tech}</Text>
                        ))}
                    </Box>
                )}
                
                {files && files.map((file, i) => (
                    <Box key={i}>
                        <Heading size="small">📄 {file.filename}</Heading>
                        {file.description && <Text><Em>{file.description}</Em></Text>}
                        <Box backgroundColor="color.background.neutral">
                            <Text>
                                <code style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                    {file.code}
                                </code>
                            </Text>
                        </Box>
                    </Box>
                ))}
                
                {setupInstructions && setupInstructions.length > 0 && (
                    <Box>
                        <Heading size="small">🚀 Setup Instructions</Heading>
                        {setupInstructions.map((step, i) => (
                            <Text key={i}>{i + 1}. {step}</Text>
                        ))}
                    </Box>
                )}
                
                {nextSteps && nextSteps.length > 0 && (
                    <Box>
                        <Heading size="small">📌 Next Steps</Heading>
                        {nextSteps.map((step, i) => (
                            <Text key={i}>• {step}</Text>
                        ))}
                    </Box>
                )}
            </Box>
        );
    };

    const renderClarifiedContent = () => {
      if (!clarifiedData) return null;
  
      const { acceptanceCriteria, edgeCases, successMetrics, testScenarios, applied } = clarifiedData;

      return (
        <Box>
          {applied ? (
            <SectionMessage title="Success" appearance="confirmation">
              <Text> Changes have been applied to the ticket description. Next, have GoBot Code! </Text>
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
      let coded = false;
      if(codeImplementation){
        coded = true;
      }

      let jsx;
      
      if(accessKey){
          if( coded ) {
            jsx = <ButtonGroup>
                    <Button 
                      onClick={applyToTicket}
                      appearance="primary"
                    >Save to Ticket</Button>
                    <Button 
                      onClick={goBotCode}
                    >GoBot Code Again</Button>
                    <Button onClick={resetAnalysis}>Reset</Button>
                  </ButtonGroup>
            if(!feedbackSubmitted){
              jsx = <Box>
                      <Text><Em>Scope clarification Good?</Em></Text>
                      <ButtonGroup>
                        <Button onClick={() => submitFeedback('upvote')}>
                          👍 Yes
                        </Button>
                        <Button onClick={() => submitFeedback('downvote')}>
                          👎 No
                        </Button>
                      </ButtonGroup>
                    </Box>
            }else{
              jsx = <SectionMessage appearance="confirmation">
                      <Text>Thank you for your feedback!</Text>
                    </SectionMessage>
            }
          } else {
            if(applied){
              jsx = <Box>
                      <Text>
                        <Em>Step 2. Transform scope to an initial AI implementation.</Em>
                      </Text>
                      {showCustomPromptForm ? 
                          <Form onSubmit={handleKeySubmit}>
                            <Label labelFor="codeGenCustomPrompt">Custom Prompt:</Label>
                            <TextArea 
                                id="codeGenCustomPrompt"
                                name="codeGenCustomPrompt"
                                label="Custom Prompt"
                                placeholder="e.g. Build with Python"
                                value={codeGenCustomPrompt}
                                onChange={(e) => {setCodeGenCustomPrompt(e.target.value)} }
                            />
                            <Button onClick={()=>{
                              if(showCustomPromptForm){
                                setShowCustomPromptForm(false);
                              }else{
                                setShowCustomPromptForm(true);
                              }
                            }}>Clear</Button>
                          </Form> 
                          :
                          <Button onClick={()=>{
                            if(showCustomPromptForm){
                              setShowCustomPromptForm(false);
                            }else{
                              setShowCustomPromptForm(true);
                            }
                          }}>Custom Prompt</Button>
                        }
                      <Button onClick={goBotCode} appearance="primary">GoBot Code!</Button>
                      {!feedbackSubmitted ? 
                          <Box>
                            <Text><Em>Scope clarification Good?</Em></Text>
                            <ButtonGroup>
                              <Button onClick={() => submitFeedback('upvote')}>
                                👍 Yes
                              </Button>
                              <Button onClick={() => submitFeedback('downvote')}>
                                👎 No
                              </Button>
                            </ButtonGroup>
                          </Box>
                        : <SectionMessage appearance="confirmation">
                            <Text>Thank you for your feedback!</Text>
                          </SectionMessage>
                      }
                    </Box>
            } else {
              if(!initial) {
                jsx = <ButtonGroup>
                        <Button 
                          onClick={applyToTicket}
                          appearance="primary"
                        >Apply to Ticket</Button>
                        <Button 
                          onClick={clarifyTicket}
                        >GoBot Again</Button>
                      </ButtonGroup>
              } else {
                jsx = <Box> 
                      <Text>
                        <Em>Step 1. Transform tickets into crystal-clear scope.</Em>
                      </Text>
                      {showCustomPromptForm ? 
                          <Form onSubmit={handleKeySubmit}>
                            <Label labelFor="clarifyCustomPrompt">Custom Prompt:</Label>
                            <TextArea 
                                name="clarifyCustomPrompt"
                                label="Custom Prompt"
                                placeholder="e.g. Satisfy with Python"
                                value={clarifyCustomPrompt}
                                onChange={(e) => {setClarifyCustomPrompt(e.target.value)} }
                            />
                            <Button onClick={()=>{
                              if(showCustomPromptForm){
                                setShowCustomPromptForm(false);
                              }else{
                                setShowCustomPromptForm(true);
                              }
                            }}>Clear</Button>
                          </Form> 
                          :
                          <Button onClick={()=>{
                            if(showCustomPromptForm){
                              setShowCustomPromptForm(false);
                            }else{
                              setShowCustomPromptForm(true);
                            }
                          }}>Custom Prompt</Button>
                        }
                      <Button onClick={clarifyTicket} appearance="primary">GoBot</Button>
                   </Box>
              }
            }
          }
        }else{
          jsx = <ButtonGroup>
                  <Button onClick={() => setKeyModalOpen(true)} appearance="link">
                    Enter Access Key
                  </Button>
                  <Button onClick={() => checkOnAccessKey(install)} appearance="link">
                    Check Key
                  </Button>
                </ButtonGroup>
        }

      console.log(jsx);
      return (  
          <Box>
            <Text><Em>Plan: {plan}</Em></Text>
            {jsx}
          </Box>
       );
    }

 React.useEffect(() => {
   if (context) {
    const issueId = context?.extension.issue.id;

    if(install != context?.accountId){   
      setInstall(context?.accountId);  
    } 
    console.log("Account");
    console.log(context?.accountId);
    console.log(issueId);
    checkOnAccessKey(context?.accountId).then((keyInfo) => {
      if (keyInfo){
        validateAccessKey(context?.accountId, keyInfo.accessKey)
      }
    });
    getIssueData(issueId).then(setIssueDetails);
    checkHealth();
   }
 }, [context]);


 return (
    <Box>
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