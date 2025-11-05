import { NextRequest, NextResponse } from 'next/server';

// Simple development page to grant premium access
export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not available in production', { status: 403 });
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Development Premium Access</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 5px;
            font-size: 16px;
        }
        button:hover { background: #0056b3; }
        .status {
            margin: 20px 0;
            padding: 15px;
            border-radius: 5px;
            background: #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Development Premium Access</h1>
        <p>This page allows you to quickly grant premium access for testing purposes.</p>
        
        <div class="status" id="status">
            Click "Check Status" to see your current access level.
        </div>
        
        <button onclick="checkStatus()">Check Status</button>
        <button onclick="grantPremium()">Grant Premium Access</button>
        <button onclick="createMockData()">Create Mock Data</button>  
        <button onclick="openDashboard()">Open Premium Dashboard</button>
        
        <h3>Quick Links:</h3>
        <ul>
            <li><a href="/signin" target="_blank">Sign In Page</a></li>
            <li><a href="/dashboard" target="_blank">Main Dashboard</a></li>
            <li><a href="/dashboard/premium-aeo" target="_blank">Premium AEO Dashboard</a></li>
            <li><a href="/checkout?plan=premium" target="_blank">Checkout Page (for testing)</a></li>
        </ul>
        
        <div style="margin-top: 30px; padding: 15px; background: #d1ecf1; border-radius: 5px;">
            <strong>🚀 Testing Mode:</strong> No sign-in required! This completely bypasses authentication.
            <br><br>
            <strong>Steps:</strong>
            <ol>
                <li>Click "Grant Premium Access" to enable premium features</li>
                <li>Click "Create Mock Data" to add sample companies</li>  
                <li>Click "Open Premium Dashboard" to view the premium interface</li>
            </ol>
        </div>
    </div>

    <script>
        async function checkStatus() {
            const status = document.getElementById('status');
            status.innerHTML = '⏳ Checking status...';
            
            try {
                const response = await fetch('/api/dev/grant-premium');
                const data = await response.json();
                
                if (response.ok) {
                    status.innerHTML = \`
                        <div class="success">✅ Status Check:</div>
                        <strong>Email:</strong> \${data.user?.email || 'Not signed in'}<br>
                        <strong>Premium Access:</strong> \${data.user?.hasPremium ? 'Yes' : 'No'}<br>
                        <strong>Development Mode:</strong> \${data.isDevelopment ? 'Yes' : 'No'}<br>
                        <strong>Testing Mode:</strong> \${data.testingMode ? 'Yes' : 'No'}
                    \`;
                } else {
                    status.innerHTML = \`<div class="error">❌ Error: \${data.error}</div>\`;
                }
            } catch (error) {
                status.innerHTML = \`<div class="error">❌ Failed to check status: \${error.message}</div>\`;
            }
        }
        
        async function grantPremium() {
            const status = document.getElementById('status');
            status.innerHTML = '⏳ Granting premium access...';
            
            try {
                const response = await fetch('/api/dev/grant-premium', {
                    method: 'POST'
                });
                const data = await response.json();
                
                if (response.ok) {
                    status.innerHTML = \`
                        <div class="success">🎉 \${data.message}</div>
                        <p>You now have premium access! You can access the premium dashboard.</p>
                        <strong>User:</strong> \${data.user?.email}
                    \`;
                } else {
                    status.innerHTML = \`<div class="error">❌ Error: \${data.error}</div>\`;
                }
            } catch (error) {
                status.innerHTML = \`<div class="error">❌ Failed to grant premium: \${error.message}</div>\`;
            }
        }
        
        async function createMockData() {
            const status = document.getElementById('status');
            status.innerHTML = '⏳ Creating mock companies and data...';
            
            try {
                const response = await fetch('/api/dev/mock-data', {
                    method: 'POST'
                });
                const data = await response.json();
                
                if (response.ok) {
                    status.innerHTML = \`
                        <div class="success">🎉 \${data.message}</div>
                        <p>Mock companies created with sample data for testing the premium dashboard.</p>
                        <strong>Companies:</strong> \${data.companiesCreated}<br>
                        <strong>User:</strong> \${data.user}
                    \`;
                } else {
                    status.innerHTML = \`<div class="error">❌ Error: \${data.error}</div>\`;
                }
            } catch (error) {
                status.innerHTML = \`<div class="error">❌ Failed to create mock data: \${error.message}</div>\`;
            }
        }
        
        function openDashboard() {
            window.open('/dashboard/premium-aeo', '_blank');
        }
    </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
