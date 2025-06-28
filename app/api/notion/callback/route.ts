// This is a placeholder for the Notion OAuth2 callback endpoint
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }
  
  try {
    // In a real implementation, this would exchange the code for an access token
    // using Notion's OAuth token endpoint
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/notion/callback`;
    
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to exchange code for token');
    }
    
    const data = await response.json();
    
    // In a real implementation, you would securely store the access token
    // For this example, we'll use a simple HTML page with JavaScript to store in localStorage
    return new NextResponse(
      `<html>
        <head><title>Notion Authorization Complete</title></head>
        <body>
          <h1>Authorization Successful!</h1>
          <p>You can close this window and return to the application.</p>
          <script>
            localStorage.setItem('notion_access_token', '${data.access_token}');
            localStorage.setItem('notion_workspace_id', '${data.workspace_id}');
            localStorage.setItem('notion_workspace_name', '${data.workspace_name}');
            window.close();
          </script>
        </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
    
  } catch (error: any) {
    console.error('Error exchanging code for token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}