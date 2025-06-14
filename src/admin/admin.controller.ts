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
    <title>🐴 Pegasus by Ace - Dysh Backend Admin</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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

        .chart-container {
            position: relative;
            height: 300px;
            margin: 1rem 0;
        }

        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .metric-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.75rem;
            padding: 1rem;
            text-align: center;
            min-width: 200px;
        }

        .metric-value {
            font-size: 1.5rem;
            font-weight: 500;
            color: #ff6b35;
            margin-bottom: 0.25rem;
        }

        .metric-label {
            color: #888;
            font-size: 0.8rem;
            margin-bottom: 0.25rem;
        }

        .metric-change {
            font-size: 0.7rem;
            margin-top: 0.25rem;
        }

        .metric-change.positive { color: #4ade80; }
        .metric-change.negative { color: #ef4444; }

        /* Logs Styles */
        .logs-container {
            max-height: 600px;
            overflow-y: auto;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.5rem;
            background: rgba(0, 0, 0, 0.2);
        }

        .logs-header {
            margin-bottom: 1rem;
            color: #888;
            font-size: 0.9rem;
        }

        .log-entry {
            padding: 0.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 0.85rem;
            line-height: 1.4;
        }

        .log-entry:last-child {
            border-bottom: none;
        }

        .log-entry:hover {
            background: rgba(255, 255, 255, 0.02);
        }

        .log-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
        }

        .log-icon {
            font-size: 0.9rem;
        }

        .log-timestamp {
            color: #888;
            font-size: 0.8rem;
            min-width: 150px;
        }

        .log-context {
            color: #ff6b35;
            font-size: 0.8rem;
            font-weight: 500;
            padding: 0.125rem 0.5rem;
            border-radius: 0.25rem;
            background: rgba(255, 107, 53, 0.1);
        }

        .log-message {
            color: #e0e0e0;
            margin-left: 1.5rem;
            word-break: break-word;
        }

        .log-details {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-top: 0.25rem;
            margin-left: 1.5rem;
            font-size: 0.8rem;
        }

        .log-method {
            color: #10b981;
            font-weight: 500;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            background: rgba(16, 185, 129, 0.1);
        }

        .log-url {
            color: #888;
            font-family: 'DM Mono', monospace;
        }

        .log-status {
            font-weight: 500;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
        }

        .log-time {
            color: #f59e0b;
            font-size: 0.75rem;
        }

        .log-level-error {
            border-left: 3px solid #ef4444;
            background: rgba(239, 68, 68, 0.05);
        }

        .button.active {
            background: #10b981;
            color: #000;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Pegasus by Ace</h1>
        <p>Dysh Backend Administration Panel</p>
    </div>

    <div class="container">
        <div class="tabs">
            <div class="tab active" onclick="showTab('dashboard')">Dashboard</div>
            <div class="tab" onclick="showTab('auth')">Authentication</div>
            <div class="tab" onclick="showTab('users')">Users</div>
            <div class="tab" onclick="showTab('recipes')">Recipes</div>
            <div class="tab" onclick="showTab('api')">API Testing</div>
            <div class="tab" onclick="showTab('logs')">Logs</div>
            <div class="tab" onclick="showTab('explore')">Explore</div>
            <div class="tab" onclick="showTab('system')">System</div>
        </div>

        <!-- Dashboard Tab -->
        <div id="dashboard" class="tab-content active">
            <!-- Key Metrics Grid -->
            <div class="grid">
                <div class="metric-card">
                    <div class="metric-value" id="total-users-metric">-</div>
                    <div class="metric-label">Total Users</div>
                    <div class="metric-change positive" id="users-change">+12% this month</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="total-recipes-metric">-</div>
                    <div class="metric-label">Total Recipes</div>
                    <div class="metric-change positive" id="recipes-change">+5 new recipes</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="completion-rate-metric">-</div>
                    <div class="metric-label">Onboarding Rate</div>
                    <div class="metric-change positive" id="completion-change">100% completion</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="uptime-metric">-</div>
                    <div class="metric-label">System Uptime</div>
                    <div class="metric-change positive" id="uptime-change">99.9% availability</div>
                </div>
            </div>

            <!-- Charts Grid -->
            <div class="chart-grid">
                <div class="card">
                    <h3>📈 User Growth Trend</h3>
                    <div class="chart-container">
                        <canvas id="userGrowthChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <h3>🍳 Recipe Categories</h3>
                    <div class="chart-container">
                        <canvas id="recipeCategoriesChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <h3>💾 Memory Usage</h3>
                    <div class="chart-container">
                        <canvas id="memoryUsageChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <h3>🏥 System Health</h3>
                    <div class="chart-container">
                        <canvas id="systemHealthChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card">
                <h3>🚀 Quick Actions</h3>
                <button class="button" onclick="refreshDashboard()">🔄 Refresh Dashboard</button>
                <button class="button" onclick="generateToken()">🔑 Generate Test Token</button>
                <button class="button secondary" onclick="showTab('api')">🧪 Test APIs</button>
                <button class="button secondary" onclick="showTab('users')">👥 View Users</button>
                <button class="button secondary" onclick="exportData()">📊 Export Data</button>
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

        <!-- Logs Tab -->
        <div id="logs" class="tab-content">
            <div class="card">
                <h3>📝 Server Logs</h3>
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;">
                    <button class="button" onclick="loadLogs()">🔄 Refresh Logs</button>
                    <button class="button secondary" onclick="clearLogs()">🗑️ Clear Logs</button>
                    <button class="button secondary" onclick="toggleAutoRefresh()">⏱️ Auto Refresh: OFF</button>
                    <input type="text" class="input" id="log-search" placeholder="🔍 Search logs..." style="max-width: 300px; margin: 0;" oninput="filterLogs()">
                </div>
                <div id="logs-content">
                    <p style="color: #888; text-align: center; padding: 2rem;">Click "Refresh Logs" to load server logs</p>
                </div>
            </div>
        </div>

        <!-- Explore Tab -->
        <div id="explore" class="tab-content">
            <div class="grid">
                <div class="card">
                    <h3>📊 Explore Recipe Statistics</h3>
                    <button class="button" onclick="loadExploreStats()">🔄 Load Stats</button>
                    <div id="explore-stats-content">
                        <p style="color: #888; text-align: center; padding: 2rem;">Click "Load Stats" to see current recipe counts</p>
                    </div>
                </div>
                <div class="card">
                    <h3>🎯 Generate New Recipes</h3>
                    <select class="input" id="recipe-category">
                        <option value="chefs-pick">Chef's Pick</option>
                        <option value="thirty-min-meals">30-Min Meals</option>
                        <option value="healthy-light">Healthy & Light</option>
                        <option value="comfort-food">Comfort Food</option>
                        <option value="one-pot-meals">One Pot Meals</option>
                        <option value="occasion">Special Occasion</option>
                    </select>
                    <select class="input" id="meal-type">
                        <option value="">Any Meal Type</option>
                        <option value="BREAKFAST">Breakfast</option>
                        <option value="LUNCH">Lunch</option>
                        <option value="DINNER">Dinner</option>
                    </select>
                    <input type="number" class="input" id="recipe-count" placeholder="Number of recipes" value="5" min="1" max="20">
                    <input type="text" class="input" id="recipe-countries" placeholder="Countries (comma separated, optional)" style="margin-bottom: 1rem;">
                    <button class="button" onclick="generateRecipes()">🚀 Generate Recipes</button>
                    <div id="generate-result" class="response-box" style="display: none;"></div>
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
        <p>🐴 Pegasus by Ace</p>
    </div>

    <script>
        // Global state
        let currentToken = '';

        // Chart instances
        let userGrowthChart, recipeCategoriesChart, memoryUsageChart, systemHealthChart;
        
        // Chart configuration with dark theme
        Chart.defaults.color = '#e0e0e0';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
        Chart.defaults.backgroundColor = 'rgba(255, 107, 53, 0.1)';

        // Initialize dashboard on page load
        document.addEventListener('DOMContentLoaded', function() {
            refreshDashboard();
        });

        // Refresh entire dashboard
        async function refreshDashboard() {
            try {
                await Promise.all([
                    loadMetrics(),
                    initializeCharts()
                ]);
                console.log('Dashboard refreshed successfully');
            } catch (error) {
                console.error('Error refreshing dashboard:', error);
            }
        }

        // Load key metrics
        async function loadMetrics() {
            try {
                const [statsResponse, healthResponse] = await Promise.all([
                    fetch('/admin/stats'),
                    fetch('/admin/health')
                ]);
                
                const stats = await statsResponse.json();
                const health = await healthResponse.json();

                // Update metric cards
                document.getElementById('total-users-metric').textContent = stats.totalUsers || 0;
                document.getElementById('total-recipes-metric').textContent = stats.totalRecipes || 0;
                document.getElementById('completion-rate-metric').textContent = (stats.completionRate || 0) + '%';
                
                // Format uptime
                const uptimeHours = Math.floor(health.uptime / 3600);
                document.getElementById('uptime-metric').textContent = uptimeHours + 'h';

            } catch (error) {
                console.error('Error loading metrics:', error);
            }
        }

        // Initialize all charts
        async function initializeCharts() {
            try {
                await Promise.all([
                    createUserGrowthChart(),
                    createRecipeCategoriesChart(),
                    createMemoryUsageChart(),
                    createSystemHealthChart()
                ]);
            } catch (error) {
                console.error('Error initializing charts:', error);
            }
        }

        // Create user growth trend chart
        async function createUserGrowthChart() {
            const ctx = document.getElementById('userGrowthChart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (userGrowthChart) {
                userGrowthChart.destroy();
            }

            // Sample data - in real app, fetch from API
            const userData = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Active Users',
                    data: [1, 1, 2, 2, 3, 3],
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            };

            userGrowthChart = new Chart(ctx, {
                type: 'line',
                data: userData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        }

        // Create recipe categories chart
        async function createRecipeCategoriesChart() {
            const ctx = document.getElementById('recipeCategoriesChart').getContext('2d');
            
            if (recipeCategoriesChart) {
                recipeCategoriesChart.destroy();
            }

            const categoryData = {
                labels: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts'],
                datasets: [{
                    data: [15, 25, 30, 10, 6],
                    backgroundColor: [
                        '#ff6b35',
                        '#ffa500',
                        '#ffcc00',
                        '#87ceeb',
                        '#dda0dd'
                    ],
                    borderWidth: 0
                }]
            };

            recipeCategoriesChart = new Chart(ctx, {
                type: 'doughnut',
                data: categoryData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }

        // Create memory usage chart
        async function createMemoryUsageChart() {
            const ctx = document.getElementById('memoryUsageChart').getContext('2d');
            
            if (memoryUsageChart) {
                memoryUsageChart.destroy();
            }

            try {
                const response = await fetch('/admin/health');
                const health = await response.json();
                const memory = health.memory;

                const memoryData = {
                    labels: ['Heap Used', 'Heap Free', 'External', 'Array Buffers'],
                    datasets: [{
                        data: [
                            Math.round(memory.heapUsed / 1024 / 1024),
                            Math.round((memory.heapTotal - memory.heapUsed) / 1024 / 1024),
                            Math.round(memory.external / 1024 / 1024),
                            Math.round(memory.arrayBuffers / 1024 / 1024)
                        ],
                        backgroundColor: [
                            '#ff6b35',
                            '#4ade80',
                            '#60a5fa',
                            '#a78bfa'
                        ],
                        borderWidth: 0
                    }]
                };

                memoryUsageChart = new Chart(ctx, {
                    type: 'pie',
                    data: memoryData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.label + ': ' + context.parsed + ' MB';
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error creating memory usage chart:', error);
            }
        }

        // Create system health chart (gauge-like bar chart)
        async function createSystemHealthChart() {
            const ctx = document.getElementById('systemHealthChart').getContext('2d');
            
            if (systemHealthChart) {
                systemHealthChart.destroy();
            }

            const healthData = {
                labels: ['Database', 'Memory', 'CPU', 'Disk', 'Network'],
                datasets: [{
                    label: 'Health Score',
                    data: [100, 85, 92, 78, 96],
                    backgroundColor: [
                        '#4ade80',
                        '#60a5fa',
                        '#4ade80',
                        '#fbbf24',
                        '#4ade80'
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }]
            };

            systemHealthChart = new Chart(ctx, {
                type: 'bar',
                data: healthData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Export dashboard data
        function exportData() {
            const data = {
                timestamp: new Date().toISOString(),
                metrics: {
                    totalUsers: document.getElementById('total-users-metric').textContent,
                    totalRecipes: document.getElementById('total-recipes-metric').textContent,
                    completionRate: document.getElementById('completion-rate-metric').textContent,
                    uptime: document.getElementById('uptime-metric').textContent
                }
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`pegasus-dashboard-\${new Date().toISOString().split('T')[0]}.json\`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Tab management
        function showTab(tabName) {
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from all tabs
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
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

        // Logs management
        let autoRefreshInterval = null;
        let autoRefreshEnabled = false;
        let allLogs = []; // Store all logs for filtering

        async function loadLogs() {
            const logsContent = document.getElementById('logs-content');
            logsContent.innerHTML = '<div class="loading"></div> Loading logs...';
            
            const result = await apiCall('GET', '/admin/logs?limit=50');
            if (result.ok) {
                const { logs, total, maxLogs } = result.data;
                allLogs = logs; // Store logs for filtering
                
                if (logs.length === 0) {
                    logsContent.innerHTML = '<p style="color: #888; text-align: center; padding: 2rem;">No user app requests logged yet</p>';
                    return;
                }

                displayLogs(logs, total, maxLogs);
            } else {
                logsContent.innerHTML = \`<div class="status-error">Error: \${result.data.message || 'Failed to load logs'}</div>\`;
            }
        }

        function displayLogs(logs, total, maxLogs) {
            const logsContent = document.getElementById('logs-content');
            
            if (logs.length === 0) {
                logsContent.innerHTML = '<p style="color: #888; text-align: center; padding: 2rem;">No logs match your search</p>';
                return;
            }

            const logsHtml = logs.map(log => {
                    const timestamp = new Date(log.timestamp).toLocaleString();
                    let levelClass = 'log-level-log';
                    let levelIcon = '📋';
                    
                    if (log.level === 'ERROR') {
                        levelClass = 'log-level-error';
                        levelIcon = '🔴';
                    } else if (log.context === 'HTTP_RESPONSE') {
                        levelIcon = '🟢';
                    } else if (log.context === 'HTTP_REQUEST') {
                        levelIcon = '🔵';
                    }

                    return \`
                        <div class="log-entry \${levelClass}">
                            <div class="log-header">
                                <span class="log-icon">\${levelIcon}</span>
                                <span class="log-timestamp">\${timestamp}</span>
                                <span class="log-context">\${log.context || log.level}</span>
                            </div>
                            <div class="log-message">\${log.message}</div>
                            \${log.method && log.url ? \`<div class="log-details">
                                <span class="log-method">\${log.method}</span>
                                <span class="log-url">\${log.url}</span>
                                \${log.statusCode ? \`<span class="log-status status-\${log.statusCode < 400 ? 'good' : 'error'}">\${log.statusCode}</span>\` : ''}
                                \${log.responseTime ? \`<span class="log-time">\${log.responseTime}ms</span>\` : ''}
                            </div>\` : ''}
                        </div>
                    \`;
                }).join('');

            logsContent.innerHTML = \`
                <div class="logs-header">
                    <p>Showing \${logs.length} of \${total} user app requests (max: \${maxLogs})</p>
                </div>
                <div class="logs-container">
                    \${logsHtml}
                </div>
            \`;
        }

        async function clearLogs() {
            if (!confirm('Are you sure you want to clear all logs?')) {
                return;
            }

            const result = await apiCall('POST', '/admin/logs/clear');
            if (result.ok) {
                document.getElementById('logs-content').innerHTML = '<p style="color: #888; text-align: center; padding: 2rem;">Logs cleared successfully</p>';
            } else {
                alert('Failed to clear logs');
            }
        }

        function toggleAutoRefresh() {
            const button = event.target;
            
            if (autoRefreshEnabled) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
                autoRefreshEnabled = false;
                button.textContent = '⏱️ Auto Refresh: OFF';
                button.classList.remove('active');
            } else {
                autoRefreshInterval = setInterval(loadLogs, 5000); // Refresh every 5 seconds
                autoRefreshEnabled = true;
                button.textContent = '⏱️ Auto Refresh: ON';
                button.classList.add('active');
                loadLogs(); // Load immediately
            }
        }

        function filterLogs() {
            const searchTerm = document.getElementById('log-search').value.toLowerCase();
            
            if (!searchTerm) {
                // Show all logs if search is empty
                displayLogs(allLogs, allLogs.length, allLogs.length);
                return;
            }

            // Filter logs based on search term
            const filteredLogs = allLogs.filter(log => {
                return (
                    log.message.toLowerCase().includes(searchTerm) ||
                    (log.method && log.method.toLowerCase().includes(searchTerm)) ||
                    (log.url && log.url.toLowerCase().includes(searchTerm)) ||
                    (log.context && log.context.toLowerCase().includes(searchTerm)) ||
                    (log.userAgent && log.userAgent.toLowerCase().includes(searchTerm)) ||
                    (log.statusCode && log.statusCode.toString().includes(searchTerm))
                );
            });

            displayLogs(filteredLogs, filteredLogs.length, allLogs.length);
        }

        // Explore Management
        async function loadExploreStats() {
            const exploreStatsContent = document.getElementById('explore-stats-content');
            exploreStatsContent.innerHTML = '<div class="loading"></div> Loading explore recipe statistics...';
            
            const result = await apiCall('GET', '/admin/explore/stats');
            if (result.ok) {
                const stats = result.data;
                exploreStatsContent.innerHTML = \`
                    <div class="stat">
                        <span class="stat-label">Chef's Pick:</span>
                        <span class="stat-value">\${stats['chefs-pick']}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">30-Min Meals:</span>
                        <span class="stat-value">\${stats['thirty-min-meals']}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Healthy & Light:</span>
                        <span class="stat-value">\${stats['healthy-light']}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Comfort Food:</span>
                        <span class="stat-value">\${stats['comfort-food']}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">One Pot Meals:</span>
                        <span class="stat-value">\${stats['one-pot-meals']}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Special Occasion:</span>
                        <span class="stat-value">\${stats.occasion}</span>
                    </div>
                    <div class="stat" style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 1rem; padding-top: 1rem;">
                        <span class="stat-label">Total Recipes:</span>
                        <span class="stat-value status-good">\${stats.total}</span>
                    </div>
                \`;
            } else {
                exploreStatsContent.innerHTML = \`<div class="status-error">Error: \${result.data.message || 'Failed to load stats'}</div>\`;
            }
        }

        async function generateRecipes() {
            const category = document.getElementById('recipe-category').value;
            const mealType = document.getElementById('meal-type').value;
            const count = document.getElementById('recipe-count').value;
            const countries = document.getElementById('recipe-countries').value;
            const result = document.getElementById('generate-result');
            
            result.style.display = 'block';
            result.innerHTML = '<div class="loading"></div> Generating recipes... This may take 30-60 seconds.';
            
            const params = new URLSearchParams({
                category,
                count,
            });
            
            if (mealType) params.append('mealType', mealType);
            if (countries.trim()) params.append('countries', countries.trim());

            const apiResult = await apiCall('POST', \`/admin/explore/generate?\${params.toString()}\`);
            
            if (apiResult.ok) {
                result.innerHTML = \`✅ \${apiResult.data.message}

Generated Recipes:
\${apiResult.data.recipes.map(recipe => \`• \${recipe.title} (\${recipe.country})\`).join('\\n')}\`;
                
                // Refresh stats after successful generation
                loadExploreStats();
            } else {
                result.innerHTML = \`❌ Failed to generate recipes: \${apiResult.data.message || 'Unknown error'}\`;
            }
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

  @Get('admin/logs')
  @ApiOperation({ summary: 'Get server logs' })
  @ApiResponse({ status: 200, description: 'Server logs retrieved successfully' })
  async getLogs(@Query('limit') limit = '100') {
    return this.adminService.getLogs(parseInt(limit));
  }

  @Post('admin/logs/clear')
  @ApiOperation({ summary: 'Clear server logs' })
  @ApiResponse({ status: 200, description: 'Server logs cleared successfully' })
  async clearLogs() {
    return this.adminService.clearLogs();
  }

  @Post('admin/explore/generate')
  @ApiOperation({ summary: 'Generate new explore recipes' })
  @ApiResponse({ status: 200, description: 'Explore recipes generated successfully' })
  async generateExploreRecipes(
    @Query('category') category: string,
    @Query('count') count = '5',
    @Query('countries') countries?: string,
    @Query('mealType') mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER'
  ) {
    const countryArray = countries ? countries.split(',').map(c => c.trim()) : undefined;
    return this.adminService.generateExploreRecipes(
      category,
      parseInt(count),
      countryArray,
      mealType
    );
  }

  @Get('admin/explore/stats')
  @ApiOperation({ summary: 'Get explore recipe statistics' })
  @ApiResponse({ status: 200, description: 'Explore recipe stats retrieved successfully' })
  async getExploreStats() {
    return this.adminService.getExploreRecipeStats();
  }
} 