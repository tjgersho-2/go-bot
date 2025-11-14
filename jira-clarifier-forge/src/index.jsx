import ForgeUI, {
    render,
    Fragment,
    IssuePanel,
    Button,
    Text,
    Strong,
    Em,
    Heading,
    useProductContext,
    useState,
    StatusLozenge,
    Stack,
    Box,
    Icon,
    Form,
    TextArea,
    ButtonSet,
    SectionMessage
  } from '@forge/ui';
  import { invoke } from '@forge/bridge';
  
  const App = () => {
    const { platformContext } = useProductContext();
    const issueKey = platformContext?.issueKey;
    
    const [clarifiedData, setClarifiedData] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const clarifyTicket = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await invoke('clarifyIssue', { issueKey });
        
        if (result.error) {
          setError(result.error);
        } else {
          setClarifiedData(result);
        }
      } catch (err) {
        setError('Failed to clarify ticket. Please try again.');
        console.error('Clarification error:', err);
      } finally {
        setLoading(false);
      }
    };
  
    const applyToTicket = async () => {
      setLoading(true);
      try {
        await invoke('updateIssue', { 
          issueKey, 
          clarifiedData 
        });
        
        // Show success message
        setClarifiedData({ ...clarifiedData, applied: true });
      } catch (err) {
        setError('Failed to apply changes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    const renderClarifiedContent = () => {
      if (!clarifiedData) return null;
  
      const { acceptanceCriteria, edgeCases, successMetrics, testScenarios, applied } = clarifiedData;
  
      return (
        <Fragment>
          {applied && (
            <SectionMessage title="Success" appearance="confirmation">
              <Text>Changes have been applied to the ticket description!</Text>
            </SectionMessage>
          )}
  
          {/* Acceptance Criteria */}
          {acceptanceCriteria && acceptanceCriteria.length > 0 && (
            <Box>
              <Heading size="small">✅ Acceptance Criteria</Heading>
              {acceptanceCriteria.map((criteria, i) => (
                <Text key={i}>• {criteria}</Text>
              ))}
            </Box>
          )}
  
          {/* Edge Cases */}
          {edgeCases && edgeCases.length > 0 && (
            <Box>
              <Heading size="small">⚠️ Edge Cases to Consider</Heading>
              {edgeCases.map((edge, i) => (
                <Text key={i}>• {edge}</Text>
              ))}
            </Box>
          )}
  
          {/* Success Metrics */}
          {successMetrics && successMetrics.length > 0 && (
            <Box>
              <Heading size="small">📊 Success Metrics</Heading>
              {successMetrics.map((metric, i) => (
                <Text key={i}>• {metric}</Text>
              ))}
            </Box>
          )}
  
          {/* Test Scenarios */}
          {testScenarios && testScenarios.length > 0 && (
            <Box>
              <Heading size="small">🧪 Test Scenarios</Heading>
              {testScenarios.map((scenario, i) => (
                <Text key={i}>• {scenario}</Text>
              ))}
            </Box>
          )}
  
          {!applied && (
            <ButtonSet>
              <Button 
                text="Apply to Ticket" 
                onClick={applyToTicket}
                appearance="primary"
              />
              <Button 
                text="Clarify Again" 
                onClick={clarifyTicket}
              />
            </ButtonSet>
          )}
        </Fragment>
      );
    };
  
    return (
      <Fragment>
        <Box>
          <Stack>
            <Heading size="medium">🎯 AI Ticket Clarifier</Heading>
            <Text>
              <Em>Transform vague tickets into crystal-clear acceptance criteria</Em>
            </Text>
          </Stack>
        </Box>
  
        {error && (
          <SectionMessage title="Error" appearance="error">
            <Text>{error}</Text>
          </SectionMessage>
        )}
  
        {!clarifiedData && !isLoading && (
          <Box>
            <Text>
              Click the button below to analyze this ticket and generate:
            </Text>
            <Text>• Clear acceptance criteria</Text>
            <Text>• Edge cases to consider</Text>
            <Text>• Success metrics</Text>
            <Text>• Test scenarios</Text>
          </Box>
        )}
  
        {isLoading ? (
          <Box>
            <StatusLozenge text="Analyzing ticket..." appearance="inprogress" />
            <Text>
              <Em>This usually takes 3-5 seconds...</Em>
            </Text>
          </Box>
        ) : !clarifiedData ? (
          <Button 
            text="✨ Clarify This Ticket" 
            onClick={clarifyTicket}
            appearance="primary"
          />
        ) : (
          renderClarifiedContent()
        )}
      </Fragment>
    );
  };
  
  export const run = render(
    <IssuePanel>
      <App />
    </IssuePanel>
  );