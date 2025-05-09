$token = az staticwebapp secrets list --name smarter-loan --resource-group mortgage-calculator --query "properties.apiKey" -o tsv
Write-Output $token
