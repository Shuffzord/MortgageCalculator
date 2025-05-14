// PowerShell version for Windows environments
# generate-build-info.ps1

# Get current timestamp in ISO format
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"

# Read version from package.json (if available)
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    $version = $packageJson.version
} else {
    $version = "1.0.0"
}

# Read template
$template = Get-Content "build-info.js.template" -Raw

# Replace placeholders
$content = $template.Replace("BUILD_TIMESTAMP_PLACEHOLDER", $timestamp).Replace("VERSION_PLACEHOLDER", $version)

# Ensure public directory exists
if (-Not (Test-Path "public")) {
    New-Item -Path "public" -ItemType Directory
}

# Write to output file
$content | Out-File -FilePath "public/build-info.js" -Encoding utf8

Write-Host "Generated build-info.js with timestamp: $timestamp and version: $version"