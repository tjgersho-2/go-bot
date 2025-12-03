import { storage } from '@forge/api';
import api, { fetch } from '@forge/api';

const API_BASE_URL = 'https://go-bot-production-b18c.up.railway.app';

// V2 style - direct function export, receives AsyncEvent
export async function handler(event, context) {
    // event.body contains what you pushed to the queue
    const { jobId, type, data } = event.body || {};
    
    console.log(`🚀 Processing job ${jobId} of type ${type}`);
    console.log('📦 Data:', JSON.stringify(data));
    
    if (!jobId) {
        console.error('❌ No jobId provided');
        return;
    }
    
    try {
        // Update status to processing
        await storage.set(`job:${jobId}`, {
            status: 'processing',
            startedAt: new Date().toISOString()
        });
        
        let result;
        
        if (type === 'genCode') {
            console.log('🔧 Calling /gen-code API...');
            
            const response = await fetch(`${API_BASE_URL}/gen-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jiraDescription: data.jiraDescription,
                    customPrompt: data.customPrompt,
                    install: data.install,
                    accessKey: data.accessKey
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }
            
            result = await response.json();
            
        } else if (type === 'clarifyIssue') {
            console.log('🔧 Calling /clarify API...');
            
            const response = await fetch(`${API_BASE_URL}/clarify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    issueType: data.issueType,
                    priority: data.priority,
                    customPrompt: data.customPrompt,
                    install: data.install,
                    accessKey: data.accessKey
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }
            
            result = await response.json();
            
        } else {
            throw new Error(`Unknown job type: ${type}`);
        }
        
        // Store successful result
        await storage.set(`job:${jobId}`, {
            status: 'completed',
            result: result,
            completedAt: new Date().toISOString()
        });
        
        console.log(`✅ Job ${jobId} completed successfully`);
        
    } catch (error) {
        console.error(`❌ Job ${jobId} failed:`, error.message);
        
        // Store error
        await storage.set(`job:${jobId}`, {
            status: 'failed',
            error: error.message,
            failedAt: new Date().toISOString()
        });
    }
}