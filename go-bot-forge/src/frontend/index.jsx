import React, { useEffect, useState  } from 'react';
// useProductContext hook retrieves current product context
import ForgeReconciler, { 
    Text, 
    Button,
    Em,
    Heading,
    useProductContext,
    Box,
    ButtonGroup,
    SectionMessage,
    Form,
    Inline,
    Label,
    Strong,
    Link,
    TextArea,
    Textfield,
    Tooltip,
    Modal,
    ModalTransition
 } from '@forge/react';
// requestJira calls the Jira REST API
import { requestJira, invoke } from '@forge/bridge';

const App = () => {
    const context = useProductContext();

    const [clarifiedData, setClarifiedData] = useState(null);
    const [codeImplementation, setCodeImplementation] = useState(null);
    const [isAnalyzing, setAnalyzing] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [isInitializing, setInitializing] = useState(true); // New: for initial load
    const [error, setError] = useState(null);
    const [issueDetails, setIssueDetails] = useState(null);
    const [clarifyCustomPrompt, setClarifyCustomPrompt] = useState(null);
    const [codeGenCustomPrompt, setCodeGenCustomPrompt]  = useState(null);
    const [showCustomPromptForm, setShowCustomPromptForm] = useState(false);
    const [isKeyModalOpen, setKeyModalOpen] = useState(false);
    const [accessKey, setAccessKey] = useState('');
    const [install, setInstall] = useState(null);
    const [plan, setPlan] = useState('free');
    const [isValidatingKey, setValidatingKey] = useState(false);
    const [codeSaved, setCodeSaved] = useState(false);
    const [gobotUsed, setGobotUsed] = useState(0);
    const [gobotLimit, setGobotLimit] = useState(5);
    const [usageResetsAt, setUsageResetsAt] = useState("");
    const [attachmentFilename, setAttachmentFilename] = useState(null);
    const [keyValid, setKeyValid] = useState(false);
    const [skipped, setSkipped] = useState(false);

    const POLL_INTERVAL = 3000; // Poll every 2 seconds

    const pollJobStatus = async (jobId, onComplete, onError) => {
        const poll = async () => {
            try {
                const status = await invoke('getJobStatus', { jobId });

                if (status.status === 'completed') {
                    // Clean up storage
                    await invoke('clearJob', { jobId });
                    onComplete(status.result);
                    await getKeyUsage();
                    return;
                }
                
                if (status.status === 'failed') {
                    await invoke('clearJob', { jobId });
                    onError(status.error || 'Job failed');
                    return;
                }
                
                // Still processing, poll again
                setTimeout(poll, POLL_INTERVAL);
                
            } catch (err) {
                console.error('Polling error:', err);
                onError('Failed to check job status');
            }
        };
        
        poll();
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    const checkHealth = async () => {
      try {
          const results = await invoke('getHealth');
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

    const uploadCodeAsAttachment = async (issueKey, codeImplementation) => {
          const { implementation, summary } = codeImplementation;
          
          // Create filename with timestamp
          const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          const filename = `gobot-implementation-${timestamp}.md`;
          
          // Build the markdown content
          const fileContent = `# 🤖 GoBot Implementation
      
      > ${summary}
      
      ---
      
      ${implementation}
      
      ---
      
      *Generated by GoBot on ${new Date().toLocaleString()}*
      `;
      
          try {
              // Create a Blob from the content
              const blob = new Blob([fileContent], { type: 'text/markdown' });
              
              // Create FormData and append the file
              const formData = new FormData();
              formData.append('file', blob, filename);
              
              const response = await requestJira(
                  `/rest/api/3/issue/${issueKey}/attachments`,
                  {
                      method: 'POST',
                      headers: {
                          'Accept': 'application/json',
                          'X-Atlassian-Token': 'no-check'
                      },
                      body: formData
                  }
              );
              
              if (!response.ok) {
                  const errorText = await response.text();
                  console.error('Attachment error:', errorText);
                  throw new Error(`Failed to upload attachment: ${response.status}`);
              }
              
              const result = await response.json();
 
              return { 
                  success: true, 
                  filename: filename,
                  attachmentId: result[0]?.id 
              };
          } catch (error) {
              console.error('Upload error:', error);
              throw error;
          }
      };
      
      const getKeyUsage = async () =>{
        try {
          const result = await invoke('getKeyUsage', { accessKey: accessKey });
          if (result.isActive) {
              setPlan(result.plan);
              setGobotUsed(result.gobot_used);
              setGobotLimit(result.gobot_limit);
              setUsageResetsAt(result.usageResetsAt);
              setAccessKey(result.keyCode);
          } else {
              console.error("Problem getting key usage.");
          }
        }catch(e){
          console.error(e);
        }  
      }


    const checkOnAccessKey = async (install) =>{
      try {
        setValidatingKey(true);
        setError(null);
        const result = await invoke('getKeyByInstall', { install: install });
        if (result.isActive) {
            setInstall(install);
            setPlan(result.plan);
            setGobotUsed(result.gobot_used);
            setGobotLimit(result.gobot_limit);
            setUsageResetsAt(result.usageResetsAt);
            setKeyModalOpen(false);
            setAccessKey(result.keyCode);
            setKeyValid(true)
            return {install: install, accessKey: result.keyCode};
        } else {
            setKeyValid(false)
            console.error("No key found by install.");
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
        try {
            const result = await invoke('validateAccessKey', { accessKey: key, install: install });
            if (result.valid) {
                setInstall(result.install);
                setPlan(result.plan);
                setKeyModalOpen(false);
                setError(null);
                setKeyValid(true)
                return true;
            } else {
                setKeyValid(false)
                setError(result.message || 'Invalid access key');
                setTimeout(()=>resetAnalysis(), 300);
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

    const enterNewKey = async () => {
      await resetAnalysis();
      setAccessKey(null);
      setKeyModalOpen(true);
    };

    const skipStepOne = async () => {
      setSkipped(true)
      setClarifiedData({
        acceptanceCriteria: "",
        edgeCases: "",
        successMetrics: "",
        testScenarios: "",
        confidence: "",
        processingTime: "",
        applied: true 
      });
    };

    // Updated clarifyTicket function
    const clarifyTicket = async () => {
        if (!install) {
            setKeyModalOpen(true);
            setError('Please enter your access key to use this feature');
            return;
        }
        
        if (issueDetails) {
            setAnalyzing(true);
            setError(null);
            
            try {
                // Start the job (returns immediately)
                const { jobId } = await invoke('startClarifyIssue', { 
                    issueData: issueDetails,
                    install: install,
                    customPrompt: clarifyCustomPrompt || "",
                    accessKey: accessKey
                });
                // Poll for completion
                pollJobStatus(
                    jobId,
                    (result) => {
                        // Success
                        setClarifiedData(result);
                        setAnalyzing(false);
                    },
                    (error) => {
                        // Error
                        setError(error);
                        setAnalyzing(false);
                    }
                );
                
            } catch (err) {
                console.error('Invoke error:', err);
                setError('Failed to start clarification. Please try again.');
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
      

      // Updated goBotCode function
      const goBotCode = async () => {
        if (clarifiedData) {
            setAnalyzing(true);
            setError(null);
            setCodeSaved(false);
            
            try {
                let formattedDescription = formatClarifiedDescription(
                    clarifiedData
                );
                if (skipped){
                  formattedDescription = issueDetails?.description;
                }
                
                // Start the job (returns immediately)
                const { jobId } = await invoke('startGenCode', { 
                    issueData: {
                        title: issueDetails?.title || '',
                        description: formattedDescription
                    },
                    install: install,
                    customPrompt: codeGenCustomPrompt || '',
                    accessKey: accessKey
                });
                
                // Poll for completion
                pollJobStatus(
                    jobId,
                    (result) => {
                        // Success
                        setCodeImplementation(result);
                        setAnalyzing(false);
                    },
                    (error) => {
                        // Error
                        setError(error);
                        setAnalyzing(false);
                    }
                );
                
            } catch (err) {
                console.error('Invoke error:', err);
                setError('Failed to start code generation. Please try again.');
                setAnalyzing(false);
            }
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

    
  const saveCodeToTicket = async () => {
        if (!codeImplementation) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const issueId = context?.extension.issue.id;
            const result = await uploadCodeAsAttachment(issueId, codeImplementation);
            setCodeSaved(true);
            // Optionally store the filename to show to user
            setAttachmentFilename(result.filename);
        } catch (err) {
            setError(`Failed to save code as attachment. ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const resetAnalysis = async () => {
      setClarifiedData(null);
      setCodeImplementation(null);
      setLoading(false);
      setAnalyzing(false);
      setClarifyCustomPrompt(null);
      setCodeGenCustomPrompt(null);
      setError(null);
      setCodeSaved(false);
      const issueId = context?.extension.issue.id;
      getIssueData(issueId).then(setIssueDetails);
    }

    const renderCodeOutput = () => {
        if (!codeImplementation) return null;
        
        const { implementation, summary } = codeImplementation;
        
        return (
            <Box>
                {codeSaved ? (
                    <SectionMessage title="✅ Saved to Ticket" appearance="confirmation">
                        <Text>
                            Code saved as attachment: <Strong>{attachmentFilename}</Strong>
                        </Text>
                        <Text>Check the Attachments section of this ticket to download.</Text>
                    </SectionMessage>
                ) : (
                    <SectionMessage title="🤖 Code Generated" appearance="info">
                        <Text>{summary}</Text>
                    </SectionMessage>
                )}
                
                <Box backgroundColor="color.background.neutral" padding="space.100">
                    <Text  style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '11px' }}>
                        {implementation.substring(0, 400)}...
                    </Text>
                </Box>
            </Box>
        );
    };

    const renderClarifiedContent = () => {
      if (!clarifiedData) return null;
  
      const { acceptanceCriteria, edgeCases, successMetrics, testScenarios, applied } = clarifiedData;

      return (
        <Box>
          {applied && !codeImplementation && !skipped ? (
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

    // Loading state renderer
    const renderLoadingState = () => {
      if (isInitializing) {
        return (
          <Box>
            <Text>🔄 Loading GoBot...</Text>
          </Box>
        );
      }
      
      if (isAnalyzing) {
        return (
          <Box>
            <Text>⏳ {codeImplementation || clarifiedData?.applied ? 'Generating code' : 'Analyzing ticket'}...</Text>
            <Text><Em>This can take up to {codeImplementation || clarifiedData?.applied ? '90' : '60'} seconds...</Em></Text>
          </Box>
        );
      }
      
      if (isLoading) {
        return (
          <Box>
            <Text>⏳ Saving to ticket...</Text>
          </Box>
        );
      }
      
      if (isValidatingKey) {
        return (
          <Box>
            <Text>🔑 Validating access key...</Text>
          </Box>
        );
      }
      
      return null;
    };

    // Check if any loading state is active
    const isAnyLoading = isInitializing || isAnalyzing || isLoading || isValidatingKey;

    const renderButtons = () => {
      // Don't render buttons during any loading state
      if (isAnyLoading) {
        return null;
      }

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
      
      if(accessKey && keyValid){
          if( coded ) {
            jsx = (
              <Box>
                <ButtonGroup>
                  {!codeSaved ?
                    <Button 
                      onClick={saveCodeToTicket}
                      appearance="primary"
                    >Save to Ticket</Button>
                 :<></> }
                  <Button 
                    onClick={()=>{setCodeImplementation(null); setSkipped(true);}}
                  >GoBot Code Again</Button>
                  <Button onClick={resetAnalysis}>Reset</Button>
                </ButtonGroup>
              </Box>
            );
          } else {
            if(applied){
              jsx = (
                <Box>
                  <Text>
                    <Em>Step 2. Transform scope to an initial AI implementation.</Em>
                  </Text>
                  <Inline  alignInline="start" grow="fill">
                  {showCustomPromptForm ? (
                    <Box>
                        <Label labelFor="codeGenCustomPrompt">Custom Prompt:</Label>
                        <Inline grow="fill">
                        <TextArea 
                            id="codeGenCustomPrompt"
                            name="codeGenCustomPrompt"
                            placeholder="e.g. Build with Python"
                            value={codeGenCustomPrompt}
                            onChange={(e) => {setCodeGenCustomPrompt(e.target.value)}}
                        />
                        <Button onClick={() => {setShowCustomPromptForm(false); setCodeGenCustomPrompt(null);}}>Clear</Button>
                      </Inline>
                    </Box>
                  ) : (
                    <Button onClick={() => setShowCustomPromptForm(true)}>Custom Prompt</Button>
                  )}
                  <Button onClick={goBotCode} appearance="primary">GoBot Code!</Button>
                    <Inline  alignInline="center" grow="fill">
                        <Button onClick={resetAnalysis}>Back &#8592;</Button>
                    </Inline>
                  </Inline>
                </Box>
              );
            } else {
              if(!initial) {
                jsx = (
                  <ButtonGroup>
                    <Button 
                      onClick={applyToTicket}
                      appearance="primary"
                    >Apply to Ticket</Button>
                    <Button 
                      onClick={()=>resetAnalysis()}
                    >GoBot Again</Button>
                  </ButtonGroup>
                );
              } else {
                jsx = (
                  <Box> 
                    <Text>
                      <Em>Step 1. Transform tickets into crystal-clear scope.</Em>
                    </Text>
                    <Inline  alignInline="start" grow="fill">
                    {showCustomPromptForm ? (
                      <Box>
                        <Label labelFor="clarifyCustomPrompt">Custom Prompt:</Label>
                        <Inline grow="fill">
                          <TextArea 
                              id="clarifyCustomPrompt"
                              name="clarifyCustomPrompt"
                              placeholder="e.g. Focus on security requirements"
                              value={clarifyCustomPrompt}
                              onChange={(e) => {setClarifyCustomPrompt(e.target.value)}}
                          />
                          <Button onClick={() => {setShowCustomPromptForm(false); setClarifyCustomPrompt(null);}}>Clear</Button>
                        </Inline>
                      </Box>
                    ) : (
                      <Button onClick={() => setShowCustomPromptForm(true)}>Custom Prompt</Button>
                    )}
                    <Button onClick={clarifyTicket} appearance="primary">GoBot</Button>
                      <Inline  alignInline="center" grow="fill">
                        <Tooltip content="Skip clarification step, and use your jira title and description to Gen Code.">
                          <Button onClick={skipStepOne}>Skip &#8594;</Button>
                        </Tooltip>
                        <Tooltip content="Skip clarification step, and use your jira title and description to Gen Code.">
                          <Button onClick={enterNewKey}>Enter New Key</Button>
                        </Tooltip>
                      </Inline>
                    </Inline>
                  </Box>
                );
              }
            }
          }
        } else {
          jsx = (
            <ButtonGroup>
              <Button onClick={() => setKeyModalOpen(true)} appearance="primary">
                Enter Access Key
              </Button>
            </ButtonGroup>
          );
        }

      return (  
        <Box>
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
    
    // Initialize app
    const initializeApp = async () => {
      setInitializing(true);
      try {
        const keyInfo = await checkOnAccessKey(context?.accountId);
        if (keyInfo) {
          await validateAccessKey(context?.accountId, keyInfo.accessKey);
        }
        await getIssueData(issueId).then(setIssueDetails);
        await checkHealth();
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setInitializing(false);
      }
    };
    
    initializeApp();
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
                    placeholder="GOBOT-XXXX-XXXX-XXXX"
                    value={accessKey}
                    onChange={(e) => {setAccessKey(e.target.value)}}
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
    
      {/* Error message */}
      {error && !isAnyLoading && (  
        <SectionMessage title="Error" appearance="error">
          <Text>{error}</Text>
        </SectionMessage>
      )}
 
      {/* Loading states */}
      {renderLoadingState()}

      {/* User actions - only shown when not loading */}
      {renderButtons()}

      {/* Content - only shown when not loading */}
      {!isAnyLoading && (
        <>
          {renderCodeOutput()}
          {renderClarifiedContent()}
        </>
      )}
      {!isAnyLoading &&  keyValid  ?
            <Text><Em>Plan: {plan.toUpperCase()}</Em>, Usage {gobotUsed}/{gobotLimit}, Resets on: {formatDate(usageResetsAt)}</Text>
      :<></>}
    </Box>
 );
};


ForgeReconciler.render(
 <React.StrictMode>
   <App />
 </React.StrictMode>
);