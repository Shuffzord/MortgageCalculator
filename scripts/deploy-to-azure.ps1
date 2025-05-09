# Check if Azure CLI is installed and user is logged in
$azureCheck = az account show 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Azure CLI is not installed or you're not logged in. Please run 'az login' first."
    exit 1
}

# Get the deployment token
Write-Host "🔑 Fetching deployment token..."
$token = az staticwebapp secrets list --name smarter-loan --resource-group mortgage-calculator --query "properties.apiKey" -o tsv

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to get deployment token. Please check your permissions and try again."
    exit 1
}

if ([string]::IsNullOrEmpty($token)) {
    Write-Error "Retrieved token is empty. Please check your Azure configuration."
    exit 1
}

# Deploy using the token
Write-Host "🚀 Deploying to Azure Static Web Apps..."
$deployResult = swa deploy dist/public --deployment-token $token --env production 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed: $deployResult"
    exit 1
}

Write-Host "✅ Deployment completed successfully!"
