# Fast Test Counter Script with Improved Exclusions and JSON Output
param(
    [string]$RootPath = ".",
    [string]$StatisticsPath = "",
    [switch]$Detailed,
    [switch]$Debug,
    [int]$MaxWorkers = [Environment]::ProcessorCount
)

function Write-Debug-Info {
    param([string]$Message)
    if ($Debug) {
        Write-Host "[DEBUG] $Message" -ForegroundColor DarkGray
    }
}

function Find-TestFiles-Fast {
    param(
        [string]$SearchPath,
        [string[]]$Patterns
    )
    Write-Debug-Info "Searching for test files..."
    $excludeDirs = @("node_modules", ".git", "dist", "build", "coverage", ".next", ".nuxt", "target", "bin", "obj")
    $foundFiles = @()
    foreach ($pattern in $Patterns) {
        $files = Get-ChildItem -Path $SearchPath -Recurse -Include $pattern -File -ErrorAction SilentlyContinue |
            Where-Object {
                $fullPath = $_.FullName
                -not ($excludeDirs | Where-Object { $fullPath -like "*\$_\*" })
            }
        $foundFiles += $files.FullName
    }
    return $foundFiles | Sort-Object -Unique
}

function Count-TestsInFiles {
    param(
        [string[]]$Files,
        [string]$TestType
    )
    $results = @()
    $jobs = @()
    foreach ($file in $Files) {
        $jobs += Start-ThreadJob -ScriptBlock {
            param($path)
            if (-not (Test-Path $path)) { return $null }
            $content = Get-Content $path -Raw -ErrorAction SilentlyContinue
            if (-not $content) { return $null }
            $matches = [regex]::Matches($content, '\b(test|it)(?:\.each)?\s*\(', 'IgnoreCase')
            if ($matches.Count -gt 0) {
                return @{ File = $path; Tests = $matches.Count }
            }
            return $null
        } -ArgumentList $file
    }
    $jobs | Wait-Job | ForEach-Object {
        $result = Receive-Job $_ -ErrorAction SilentlyContinue
        if ($result) { $results += $result }
        Remove-Job $_
    }
    $totalTests = ($results | Measure-Object -Property Tests -Sum).Sum
    return @{ TotalTests = $totalTests; FileCount = $results.Count; Details = $results }
}

Write-Host "🧪 Fast Test Counter Script" -ForegroundColor Cyan

$searchPath = Resolve-Path $RootPath
Write-Host "📁 Searching in: $searchPath" -ForegroundColor Yellow

if ($StatisticsPath -and -not (Test-Path $StatisticsPath)) {
    Write-Host "ERROR: Statistics file not found: $StatisticsPath" -ForegroundColor Red
    exit 1
}

$jestPatterns = @("*.test.js", "*.test.ts", "*.test.jsx", "*.test.tsx", "*.spec.js", "*.spec.ts", "*.spec.jsx", "*.spec.tsx")
$e2ePatterns = @("*e2e*.js", "*e2e*.ts", "*e2e*.jsx", "*e2e*.tsx", "*integration*.js", "*integration*.ts", "*puppeteer*.js", "*puppeteer*.ts")

$unitTestFiles = Find-TestFiles-Fast -SearchPath $searchPath -Patterns $jestPatterns
$e2eTestFiles = Find-TestFiles-Fast -SearchPath $searchPath -Patterns $e2ePatterns

$e2eDirectory = Join-Path $searchPath "client/e2e-tests"
if (Test-Path $e2eDirectory) {
    $e2eSpecificFiles = Find-TestFiles-Fast -SearchPath $e2eDirectory -Patterns @("*.js", "*.ts", "*.jsx", "*.tsx")
    $e2eTestFiles = $e2eTestFiles + $e2eSpecificFiles | Sort-Object -Unique
}

$unitTestResults = Count-TestsInFiles -Files $unitTestFiles -TestType "Unit"
$e2eTestResults = Count-TestsInFiles -Files $e2eTestFiles -TestType "E2E"

if ($StatisticsPath) {
    $statisticsContent = Get-Content $StatisticsPath -Raw | ConvertFrom-Json
    $testString = "Unit: $($unitTestResults.TotalTests) & UI: $($e2eTestResults.TotalTests)"
    $statisticsContent.Tests = $testString
    $statisticsContent | ConvertTo-Json -Depth 10 | Set-Content $StatisticsPath -Encoding UTF8
    Write-Host "✅ Statistics file updated." -ForegroundColor Green
}

Write-Host "📊 TEST SUMMARY" -ForegroundColor Magenta
Write-Host "Unit Test Files: $($unitTestResults.FileCount), Tests: $($unitTestResults.TotalTests)" -ForegroundColor Gray
Write-Host "E2E Test Files: $($e2eTestResults.FileCount), Tests: $($e2eTestResults.TotalTests)" -ForegroundColor Gray
Write-Host "Total Test Files: $($unitTestResults.FileCount + $e2eTestResults.FileCount), Total Tests: $($unitTestResults.TotalTests + $e2eTestResults.TotalTests)" -ForegroundColor Green