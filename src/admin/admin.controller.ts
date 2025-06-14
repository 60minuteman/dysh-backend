import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('admin')
@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Pegasus Admin Dashboard',
    description: 'Main admin interface for managing backend and database',
  })
  async servePegasus(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🐴 Pegasus - Dysh Backend Admin</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DM Mono', monospace;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
            color: #e0e0e0;
            min-height: 100vh;
            font-size: 14px;
            line-height: 1.6;
        }

        .header {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header h1 {
            color: #ff6b35;
            font-size: 1.5rem;
            font-weight: 500;
        }

        .header p {
            color: #888;
            font-size: 0.9rem;
            margin-top: 0.25rem;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        .tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tab {
            padding: 0.75rem 1.5rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.5rem 0.5rem 0 0;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'DM Mono', monospace;
            font-size: 0.9rem;
        }

        .tab:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: #ff6b35;
        }

        .tab.active {
            background: #ff6b35;
            border-color: #ff6b35;
            color: #000;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.75rem;
            padding: 1.5rem;
            transition: all 0.3s ease;
        }

        .card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: #ff6b35;
            transform: translateY(-2px);
        }

        .card h3 {
            color: #ff6b35;
            margin-bottom: 1rem;
            font-size: 1.1rem;
            font-weight: 500;
        }

        .stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .stat-label {
            color: #888;
        }

        .stat-value {
            color: #e0e0e0;
            font-weight: 500;
        }

        .button {
            background: #ff6b35;
            color: #000;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-family: 'DM Mono', monospace;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            margin: 0.25rem;
        }

        .button:hover {
            background: #e55a2b;
            transform: translateY(-1px);
        }

        .button.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #e0e0e0;
        }

        .button.secondary:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .input {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            padding: 0.75rem;
            color: #e0e0e0;
            font-family: 'DM Mono', monospace;
            font-size: 0.9rem;
            width: 100%;
            margin-bottom: 1rem;
        }

        .input:focus {
            outline: none;
            border-color: #ff6b35;
            background: rgba(255, 255, 255, 0.08);
        }

        .textarea {
            min-height: 120px;
            resize: vertical;
        }

        .response-box {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.5rem;
            padding: 1rem;
            font-family: 'DM Mono', monospace;
            font-size: 0.85rem;
            color: #e0e0e0;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
            margin-top: 1rem;
        }

        .loading {
            display: inline-block;
            width: 1rem;
            height: 1rem;
            border: 2px solid rgba(255, 107, 53, 0.3);
            border-top: 2px solid #ff6b35;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-left: 0.5rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .status-good { color: #4ade80; }
        .status-warning { color: #fbbf24; }
        .status-error { color: #ef4444; }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }

        .table th,
        .table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            font-family: 'DM Mono', monospace;
            font-size: 0.85rem;
        }

        .table th {
            background: rgba(255, 255, 255, 0.05);
            color: #ff6b35;
            font-weight: 500;
        }

        .footer {
            text-align: center;
            color: #666;
            font-size: 0.8rem;
            margin-top: 3rem;
            padding: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐴 Pegasus</h1>
        <p>Dysh Backend Administration Panel</p>
    </div>

    <div class="container">
        <div class="tabs">
            <div class="tab active" onclick="showTab('dashboard')">Dashboard</div>
            <div class="tab" onclick="showTab('auth')">Authentication</div>
            <div class="tab" onclick="showTab('users')">Users</div>
            <div class="tab" onclick="showTab('recipes')">Recipes</div>
            <div class="tab" onclick="showTab('api')">API Testing</div>
            <div class="tab" onclick="showTab('system')">System</div>
        </div>

        <!-- Dashboard Tab -->
        <div id="dashboard" class="tab-content active">
            <div class="grid">
                <div class="card">
                    <h3>📊 System Stats</h3>
                    <div id="stats-content">
                        <button class="button" onclick="loadStats()">Load Dashboard Stats</button>
                    </div>
                </div>
                <div class="card">
                    <h3>🏥 System Health</h3>
                    <div id="health-content">
                        <button class="button" onclick="checkHealth()">Check System Health</button>
                    </div>
                </div>
                <div class="card">
                    <h3>🚀 Quick Actions</h3>
                    <button class="button" onclick="generateToken()">Generate Test Token</button>
                    <button class="button secondary" onclick="showTab('api')">Test APIs</button>
                    <button class="button secondary" onclick="showTab('users')">View Users</button>
                </div>
            </div>
        </div>

        <!-- Authentication Tab -->
        <div id="auth" class="tab-content">
            <div class="grid">
                <div class="card">
                    <h3>🔑 Test Token Generation</h3>
                    <button class="button" onclick="generateToken()">Generate New Token</button>
                    <div id="token-result" class="response-box" style="display: none;"></div>
                </div>
                <div class="card">
                    <h3>🍎 Apple Sign-In Test</h3>
                    <input type="text" class="input" id="apple-token" placeholder="Apple Identity Token">
                    <input type="email" class="input" id="apple-email" placeholder="Email (optional)">
                    <input type="text" class="input" id="apple-name" placeholder="Full Name (optional)">
                    <button class="button" onclick="testAppleAuth()">Test Apple Auth</button>
                    <div id="apple-result" class="response-box" style="display: none;"></div>
                </div>
                <div class="card">
                    <h3>🤖 Google Sign-In Test</h3>
                    <input type="text" class="input" id="google-token" placeholder="Google ID Token">
                    <button class="button" onclick="testGoogleAuth()">Test Google Auth</button>
                    <div id="google-result" class="response-box" style="display: none;"></div>
                </div>
            </div>
        </div>

        <!-- Users Tab -->
        <div id="users" class="tab-content">
            <div class="card">
                <h3>👥 User Management</h3>
                <button class="button" onclick="loadUsers()">Load Users</button>
                <div id="users-content"></div>
            </div>
        </div>

        <!-- Recipes Tab -->
        <div id="recipes" class="tab-content">
            <div class="card">
                <h3>🍳 Recipe Management</h3>
                <button class="button" onclick="loadRecipes()">Load Recipes</button>
                <div id="recipes-content"></div>
            </div>
        </div>

        <!-- API Testing Tab -->
        <div id="api" class="tab-content">
            <div class="grid">
                <div class="card">
                    <h3>🧪 API Tester</h3>
                    <select class="input" id="method">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                    <input type="text" class="input" id="endpoint" placeholder="Endpoint (e.g., /auth/me)" value="/auth/me">
                    <input type="text" class="input" id="token" placeholder="Bearer Token (optional)">
                    <textarea class="input textarea" id="body" placeholder="Request Body (JSON)"></textarea>
                    <button class="button" onclick="testAPI()">Send Request</button>
                    <div id="api-result" class="response-box" style="display: none;"></div>
                </div>
                <div class="card">
                    <h3>📚 Common Endpoints</h3>
                    <button class="button secondary" onclick="fillEndpoint('GET', '/auth/me')">Get Current User</button>
                    <button class="button secondary" onclick="fillEndpoint('POST', '/auth/test-token')">Generate Test Token</button>
                    <button class="button secondary" onclick="fillEndpoint('GET', '/recipes/daily')">Get Daily Recipes</button>
                    <button class="button secondary" onclick="fillEndpoint('POST', '/recipes/generate')">Generate Recipe</button>
                    <button class="button secondary" onclick="fillEndpoint('GET', '/api/docs')">API Documentation</button>
                </div>
            </div>
        </div>

        <!-- System Tab -->
        <div id="system" class="tab-content">
            <div class="grid">
                <div class="card">
                    <h3>⚙️ System Information</h3>
                    <div id="system-info">
                        <button class="button" onclick="getSystemInfo()">Get System Info</button>
                    </div>
                </div>
                <div class="card">
                    <h3>🔗 Quick Links</h3>
                    <a href="/api/docs" target="_blank" class="button secondary">API Documentation</a>
                    <button class="button secondary" onclick="window.open('https://github.com/yourusername/dysh-backend', '_blank')">GitHub Repository</button>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>🐴 Pegasus Admin Panel - Built with DM Mono</p>
        <p>Dysh Backend Management Interface</p>
    </div>

    <script>
        // Global state
        let currentToken = '';

        // Tab management
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        // API helper function
        async function apiCall(method, endpoint, body = null, token = null) {
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = \`Bearer \${token}\`;
            }

            const config = {
                method,
                headers,
            };

            if (body && method !== 'GET') {
                config.body = JSON.stringify(body);
            }

            try {
                const response = await fetch(endpoint, config);
                const data = await response.json();
                return {
                    status: response.status,
                    data,
                    ok: response.ok
                };
            } catch (error) {
                return {
                    status: 0,
                    data: { error: error.message },
                    ok: false
                };
            }
        }

        // Dashboard functions
        async function loadStats() {
            const statsContent = document.getElementById('stats-content');
            statsContent.innerHTML = '<div class="loading"></div> Loading stats...';
            
            const result = await apiCall('GET', '/admin/stats');
            if (result.ok) {
                const stats = result.data;
                statsContent.innerHTML = \`
                    <div class="stat">
                        <span class="stat-label">Total Users:</span>
                        <span class="stat-value">\${stats.totalUsers}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total Recipes:</span>
                        <span class="stat-value">\${stats.totalRecipes}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Completed Onboarding:</span>
                        <span class="stat-value">\${stats.completedOnboarding}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Recent Users (7d):</span>
                        <span class="stat-value">\${stats.recentUsers}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Completion Rate:</span>
                        <span class="stat-value">\${stats.completionRate}%</span>
                    </div>
                \`;
            } else {
                statsContent.innerHTML = \`<div class="status-error">Error: \${result.data.message || 'Failed to load stats'}</div>\`;
            }
        }

        async function checkHealth() {
            const healthContent = document.getElementById('health-content');
            healthContent.innerHTML = '<div class="loading"></div> Checking health...';
            
            const result = await apiCall('GET', '/admin/health');
            if (result.ok) {
                const health = result.data;
                healthContent.innerHTML = \`
                    <div class="stat">
                        <span class="stat-label">Database:</span>
                        <span class="stat-value status-\${health.database === 'healthy' ? 'good' : 'error'}">\${health.database}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Uptime:</span>
                        <span class="stat-value">\${Math.floor(health.uptime / 60)} minutes</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Memory Usage:</span>
                        <span class="stat-value">\${Math.round(health.memory.used / 1024 / 1024)} MB</span>
                    </div>
                \`;
            } else {
                healthContent.innerHTML = \`<div class="status-error">Error: \${result.data.message || 'Failed to check health'}</div>\`;
            }
        }

        // Authentication functions
        async function generateToken() {
            const tokenResult = document.getElementById('token-result');
            tokenResult.style.display = 'block';
            tokenResult.innerHTML = '<div class="loading"></div> Generating token...';
            
            const result = await apiCall('POST', '/auth/test-token');
            if (result.ok) {
                currentToken = result.data.accessToken;
                tokenResult.innerHTML = \`✅ Token Generated Successfully!

Access Token: \${result.data.accessToken}

User ID: \${result.data.userId}
Email: \${result.data.email}
Expires: \${result.data.expiresIn}

🔗 Use this token in API Testing tab\`;
            } else {
                tokenResult.innerHTML = \`❌ Error: \${result.data.message || 'Failed to generate token'}\`;
            }
        }

        async function testAppleAuth() {
            const token = document.getElementById('apple-token').value;
            const email = document.getElementById('apple-email').value;
            const fullName = document.getElementById('apple-name').value;
            const result = document.getElementById('apple-result');
            
            if (!token) {
                result.style.display = 'block';
                result.innerHTML = '❌ Please enter an Apple Identity Token';
                return;
            }

            result.style.display = 'block';
            result.innerHTML = '<div class="loading"></div> Testing Apple authentication...';
            
            const body = { identityToken: token };
            if (email) body.email = email;
            if (fullName) body.fullName = fullName;

            const apiResult = await apiCall('POST', '/auth/apple', body);
            result.innerHTML = \`Status: \${apiResult.status}

\${JSON.stringify(apiResult.data, null, 2)}\`;
        }

        async function testGoogleAuth() {
            const token = document.getElementById('google-token').value;
            const result = document.getElementById('google-result');
            
            if (!token) {
                result.style.display = 'block';
                result.innerHTML = '❌ Please enter a Google ID Token';
                return;
            }

            result.style.display = 'block';
            result.innerHTML = '<div class="loading"></div> Testing Google authentication...';
            
            const apiResult = await apiCall('POST', '/auth/google', { idToken: token });
            result.innerHTML = \`Status: \${apiResult.status}

\${JSON.stringify(apiResult.data, null, 2)}\`;
        }

        // User management
        async function loadUsers() {
            const usersContent = document.getElementById('users-content');
            usersContent.innerHTML = '<div class="loading"></div> Loading users...';
            
            const result = await apiCall('GET', '/admin/users');
            if (result.ok) {
                const { users, pagination } = result.data;
                usersContent.innerHTML = \`
                    <p>Total Users: \${pagination.total} | Page \${pagination.page} of \${pagination.pages}</p>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Email</th>
                                <th>Name</th>
                                <th>Onboarded</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${users.map(user => \`
                                <tr>
                                    <td>\${user.id.substring(0, 8)}...</td>
                                    <td>\${user.email || 'N/A'}</td>
                                    <td>\${user.fullName || 'N/A'}</td>
                                    <td class="status-\${user.profile?.isOnboardingComplete ? 'good' : 'warning'}">\${user.profile?.isOnboardingComplete ? 'Yes' : 'No'}</td>
                                    <td>\${new Date(user.createdAt).toLocaleDateString()}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
            } else {
                usersContent.innerHTML = \`<div class="status-error">Error: \${result.data.message || 'Failed to load users'}</div>\`;
            }
        }

        // Recipe management
        async function loadRecipes() {
            const recipesContent = document.getElementById('recipes-content');
            recipesContent.innerHTML = '<div class="loading"></div> Loading recipes...';
            
            const result = await apiCall('GET', '/admin/recipes');
            if (result.ok) {
                const { recipes, pagination } = result.data;
                recipesContent.innerHTML = \`
                    <p>Total Recipes: \${pagination.total} | Page \${pagination.page} of \${pagination.pages}</p>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Duration</th>
                                <th>Calories</th>
                                <th>Interactions</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${recipes.map(recipe => \`
                                <tr>
                                    <td>\${recipe.title}</td>
                                    <td>\${recipe.category}</td>
                                    <td>\${recipe.duration}</td>
                                    <td>\${recipe.calories}</td>
                                    <td>\${recipe._count.userInteractions}</td>
                                    <td>\${new Date(recipe.createdAt).toLocaleDateString()}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
            } else {
                recipesContent.innerHTML = \`<div class="status-error">Error: \${result.data.message || 'Failed to load recipes'}</div>\`;
            }
        }

        // API Testing
        function fillEndpoint(method, endpoint) {
            document.getElementById('method').value = method;
            document.getElementById('endpoint').value = endpoint;
            if (currentToken) {
                document.getElementById('token').value = currentToken;
            }
            showTab('api');
        }

        async function testAPI() {
            const method = document.getElementById('method').value;
            const endpoint = document.getElementById('endpoint').value;
            const token = document.getElementById('token').value;
            const bodyText = document.getElementById('body').value;
            const result = document.getElementById('api-result');
            
            result.style.display = 'block';
            result.innerHTML = '<div class="loading"></div> Sending request...';
            
            let body = null;
            if (bodyText.trim()) {
                try {
                    body = JSON.parse(bodyText);
                } catch (e) {
                    result.innerHTML = \`❌ Invalid JSON in request body: \${e.message}\`;
                    return;
                }
            }

            const apiResult = await apiCall(method, endpoint, body, token);
            result.innerHTML = \`\${method} \${endpoint}
Status: \${apiResult.status} \${apiResult.ok ? '✅' : '❌'}

\${JSON.stringify(apiResult.data, null, 2)}\`;
        }

        // System info
        async function getSystemInfo() {
            const systemInfo = document.getElementById('system-info');
            systemInfo.innerHTML = '<div class="loading"></div> Getting system info...';
            
            const healthResult = await apiCall('GET', '/admin/health');
            if (healthResult.ok) {
                const health = healthResult.data;
                systemInfo.innerHTML = \`
                    <div class="stat">
                        <span class="stat-label">Database:</span>
                        <span class="stat-value status-\${health.database === 'healthy' ? 'good' : 'error'}">\${health.database}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Server Uptime:</span>
                        <span class="stat-value">\${Math.floor(health.uptime / 3600)}h \${Math.floor((health.uptime % 3600) / 60)}m</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Memory Used:</span>
                        <span class="stat-value">\${Math.round(health.memory.used / 1024 / 1024)} MB</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Last Updated:</span>
                        <span class="stat-value">\${new Date(health.timestamp).toLocaleString()}</span>
                    </div>
                \`;
            } else {
                systemInfo.innerHTML = \`<div class="status-error">Failed to get system info</div>\`;
            }
        }

        // Auto-load dashboard on page load
        window.addEventListener('load', function() {
            loadStats();
            checkHealth();
        });
    </script>
</body>
</html>
    `;

    res.set('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('admin/health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  async getHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('admin/users')
  @ApiOperation({ summary: 'Get users list' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.adminService.getUsers(parseInt(page), parseInt(limit));
  }

  @Get('admin/recipes')
  @ApiOperation({ summary: 'Get recipes list' })
  @ApiResponse({ status: 200, description: 'Recipes retrieved successfully' })
  async getRecipes(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.adminService.getRecipes(parseInt(page), parseInt(limit));
  }
} 