import React, { useEffect, useState  } from 'react';
// useProductContext hook retrieves current product context
import ForgeReconciler, { 
    Text, 
    Button,
    Em,
    Heading,
    useProductContext,
    StatusLozenge,
    Stack,
    Box,
    ButtonSet,
    SectionMessage
 } from '@forge/react';
// requestJira calls the Jira REST API
import { requestJira, invoke } from '@forge/bridge';

const App = () => {
    const context = useProductContext();
    const issueKey = context?.issueKey;
    
    const [clarifiedData, setClarifiedData] = useState(null);
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
        console.log("GetISsue Data");
        console.log(issueKey);
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
          
          console.log("Fetchin Issue details>..");
          console.log(issue);

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

    const clarifyTicket = async (ctx) => {
        if(issueDetails){
            setLoading(true);
            setError(null);
            console.log("Clarifying Ticket....");
            try {
                const res = await invoke('clarifyIssue', { issueData: issueDetails });
                console.log("RES");
                console.log(res);

            } catch (err) {
                console.error('Invoke error:', err);
                setError('Failed to clarify ticket. Please try again.');
            } finally {
                // CRITICAL: Always reset loading state
                setLoading(false);
            }
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


 React.useEffect(() => {
   if (context) {
     // extract issue ID from the context
    //  const issueId = context.extension.issue.id;
     // use the issue ID to call fetchCommentsForIssue(), 
     // then updates data stored in 'comments'
     const issueId = context?.extension.issue.id;
     console.log(issueId);
     getIssueData(issueId).then(setIssueDetails);
   }
 }, [context]);

 useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then((data) =>{
        console.log("Got data:");
        console.log(data);
       });
  }, []);

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
 
    {isLoading ? (
       <Box>
        <Text>⏳ Analyzing ticket...</Text>
        <Text>
            <Em>This usually takes 3-5 seconds...</Em>
        </Text>
       </Box>
    ) : (
      <Button 
        onClick={clarifyTicket}
        appearance="primary"
      >
        Clarify Ticket
      </Button>
    )}
  </Box>
 );
};

ForgeReconciler.render(
 <React.StrictMode>
   <App />
 </React.StrictMode>
);
