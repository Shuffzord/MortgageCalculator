# Count-Lines.ps1

# Set the path to the directory
$path = "."

# Get all files recursively (excluding common binary files)
$files = Get-ChildItem -Path $path -Recurse -File |
    Where-Object { $_.Extension -notin @(".exe", ".dll", ".bin", ".png", ".jpg", ".jpeg", ".gif", ".zip") }

# Create a hashtable to store counts per extension
$lineCounts = @{}
$totalLines = 0

Write-Host "Processing files..." -ForegroundColor Cyan

foreach ($file in $files) {
    try {
        $lineCount = (Get-Content $file.FullName -ErrorAction Stop | Measure-Object -Line).Lines
        Write-Host "[$($file.Extension)] $($file.FullName) - $lineCount lines"

        $ext = $file.Extension.ToLower()

        if (-not $lineCounts.ContainsKey($ext)) {
            $lineCounts[$ext] = 0
        }

        $lineCounts[$ext] += $lineCount
        $totalLines += $lineCount
    } catch {
        Write-Warning "Could not read file: $($file.FullName)"
    }
}

# Output results
Write-Host "`nSummary by file extension:" -ForegroundColor Green
foreach ($ext in $lineCounts.Keys) {
    Write-Host "$ext`t$($lineCounts[$ext])"
}

Write-Host "`nTotal lines of code: $totalLines" -ForegroundColor Yellow
