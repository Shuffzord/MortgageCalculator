param(
    [string]$path = ".",
    [string]$excludeFoldersParam = "node_modules,bin,obj",
    [string]$statisticsJsonPath = "client/statistics.json",
    [switch]$Debug
)

# Improved exclusion handling
$excludeFolders = $excludeFoldersParam -split ',' | ForEach-Object { $_.Trim() }
$excludeFolders += @(".git", "dist", "build") # Add common exclusions

Write-Host "Excluding folders: $($excludeFolders -join ', ')" -ForegroundColor Yellow

# Binary file extensions to exclude
$binaryExtensions = @(".exe", ".dll", ".bin", ".png", ".jpg", ".jpeg", ".gif", ".zip", 
                       ".ico", ".bmp", ".tiff", ".pdf", ".mp4", ".avi", ".mov", ".mp3", 
                       ".wav", ".woff", ".woff2", ".ttf", ".eot", ".otf", ".svg")

# Get all files with proper exclusion
$files = Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
        $file = $_
        
        # Skip binary files
        $file.Extension -notin $binaryExtensions -and
        
        # Skip files in excluded folders
        -not ($excludeFolders | Where-Object { 
            $excludeFolder = $_
            $file.FullName -match [regex]::Escape([IO.Path]::DirectorySeparatorChar + $excludeFolder + [IO.Path]::DirectorySeparatorChar)
        })
    }

Write-Host "Found $($files.Count) files to process" -ForegroundColor Cyan

$lineCounts = @{}
$totalLines = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        $lineCount = ($content -split "`r`n" -split "`n").Count
        
        $ext = $file.Extension.ToLower()
        if (-not $ext) { $ext = "(no extension)" }

        if (-not $lineCounts.ContainsKey($ext)) {
            $lineCounts[$ext] = 0
        }
        $lineCounts[$ext] += $lineCount
        $totalLines += $lineCount
        
        if ($Debug) {
            Write-Host "Processed $($file.Name): $lineCount lines" -ForegroundColor Gray
        }
    } catch {
        Write-Warning "Could not read file: $($file.FullName) - $($_.Exception.Message)"
    }
}

Write-Host "`nSummary by file extension:" -ForegroundColor Green
$lineCounts.GetEnumerator() | Sort-Object Name | ForEach-Object {
    Write-Host "$($_.Key.PadRight(10)) $($_.Value.ToString().PadLeft(8)) lines"
}

Write-Host "`nTotal lines of code: $totalLines" -ForegroundColor Yellow

# Update statistics.json if path is provided
if ($statisticsJsonPath -and (Test-Path $statisticsJsonPath)) {
    try {
        $json = Get-Content $statisticsJsonPath -Raw | ConvertFrom-Json
        $json.linesOfCode = $totalLines
        $json | ConvertTo-Json -Depth 10 | Set-Content $statisticsJsonPath
        Write-Host "`nUpdated statistics.json" -ForegroundColor Green
    } catch {
        Write-Warning "Failed to update statistics.json: $_"
    }
}