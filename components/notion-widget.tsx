"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, FileText } from 'lucide-react';

interface NotionWidgetProps {
  pageId?: string;
}

export function NotionWidget({ pageId }: NotionWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notionToken, setNotionToken] = useState<string | null>(null);

  // Check for Notion token in localStorage or cookies
  useEffect(() => {
    const checkNotionAuth = () => {
      const token = localStorage.getItem('notion_access_token');
      if (token) {
        setNotionToken(token);
      } else {
        setError('Notion integration not authorized');
      }
      setLoading(false);
    };

    checkNotionAuth();
  }, []);

  // Handle OAuth flow
  const handleNotionOAuth = () => {
    // In a real implementation, this would redirect to a backend endpoint
    // that handles the OAuth flow with Notion
    const redirectUri = encodeURIComponent(window.location.origin + '/api/notion/callback');
    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=YOUR_NOTION_CLIENT_ID&redirect_uri=${redirectUri}&response_type=code`;
    
    // For now, we'll just open a new window
    window.open(notionAuthUrl, '_blank');
    
    toast({
      title: 'Notion Authorization',
      description: 'Please complete the authorization in the new window',
    });
  };

  // This would fetch content from Notion using react-notion-x in a real implementation
  const fetchNotionContent = async () => {
    if (!notionToken || !pageId) return;
    
    try {
      setLoading(true);
      // In a real implementation, this would use the Notion API or react-notion-x
      // to fetch and render the content
      const response = await fetch(`/api/notion/page?pageId=${pageId}`, {
        headers: {
          'Authorization': `Bearer ${notionToken}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch Notion content');
      
      const data = await response.json();
      setContent(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch Notion content:', err);
      setError(`Failed to load Notion content: ${err.message}`);
      toast({
        title: 'Notion Error',
        description: `Failed to load content: ${err.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notionToken && pageId) {
      fetchNotionContent();
    }
  }, [notionToken, pageId]);

  if (loading) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading Notion content...</p>
      </div>
    );
  }

  if (error || !notionToken) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <FileText className="h-12 w-12 text-gray-500 mb-4" />
        <h3 className="text-sm font-medium text-foreground mb-1">Connect to Notion</h3>
        <p className="text-xs text-muted-foreground mb-4">{error || 'Link your Notion account to display your pages'}</p>
        <Button 
          size="sm" 
          onClick={handleNotionOAuth}
          className="text-xs"
        >
          Connect Notion Account
        </Button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <FileText className="h-12 w-12 text-gray-500 mb-4" />
        <h3 className="text-sm font-medium text-foreground mb-1">No Notion Page Selected</h3>
        <p className="text-xs text-muted-foreground mb-4">Please select a Notion page to display</p>
      </div>
    );
  }

  // In a real implementation, this would use react-notion-x to render the content
  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-lg font-semibold mb-2">{content.title || 'Notion Page'}</h3>
      <div className="prose prose-sm max-w-none">
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </div>
  );
}