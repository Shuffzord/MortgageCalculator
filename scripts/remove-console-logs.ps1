# Script to remove console.log statements from project files
param(
    [switch]$DryRun = $false,
    [switch]$BackupFiles = $true
)

# Directories to exclude
$excludeDirs = @(
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git'
)

# File patterns to exclude (test files, configs, etc)
$excludePatterns = @(
    '\.test\.[jt]sx?$',
    '\.spec\.[jt]sx?$',
    '\.config\.[jt]s$',
    '[\\/]__tests__[\\/]',
    '[\\/]scripts[\\/]'
)

# Counter for statistics
$stats = @{
    FilesProcessed = 0
    FilesModified = 0
    LinesRemoved = 0
}

function Should-ProcessFile {
    param($filePath)
    
    # Check excluded directories
    foreach ($dir in $excludeDirs) {
        if ($filePath -match "[\\/]$dir[\\/]") {
            return $false
        }
    }
    
    # Check excluded patterns
    foreach ($pattern in $excludePatterns) {
        if ($filePath -match $pattern) {
            return $false
        }
    }
    
    # Only process .js, .jsx, .ts, .tsx files
    return $filePath -match '\.(js|jsx|ts|tsx)$'
}

function Remove-ConsoleLog {
    param($filePath)
    
    try {
        $content = Get-Content $filePath -Raw
        if (-not $content) { return $false }
        
        # Create backup if requested and file will be modified
        if ($BackupFiles -and $content -match 'console\.(log|debug|info|warn)') {
            Copy-Item $filePath "$filePath.bak"
        }
        
        $modified = $false
        $newContent = $content -split "`n" | ForEach-Object {
            # Skip lines with console.log statements, but keep lines with @allow-console
            if ($_ -match 'console\.(log|debug|info|warn)' -and (-not ($_ -match '@allow-console'))) {
                $stats.LinesRemoved++
                $modified = $true
                return $null
            }
            return $_
        } | Where-Object { $_ -ne $null }
        
        if ($modified) {
            $stats.FilesModified++
            if (-not $DryRun) {
                $newContent | Set-Content $filePath -NoNewline
            }
        }
        
        return $modified
    }
    catch {
        Write-Error "Error processing file $filePath : $_"
        return $false
    }
}

# Main script execution
Write-Host "Starting console.log removal script..."
if ($DryRun) {
    Write-Host "Running in dry-run mode - no files will be modified"
}

Get-ChildItem -Path . -Recurse -File | ForEach-Object {
    $filePath = $_.FullName
    if (Should-ProcessFile $filePath) {
        $stats.FilesProcessed++
        $wasModified = Remove-ConsoleLog $filePath
        if ($wasModified) {
            Write-Host "Modified: $filePath"
        }
    }
}

# Print statistics
Write-Host "`nExecution Summary:"
Write-Host "Files Processed: $($stats.FilesProcessed)"
Write-Host "Files Modified: $($stats.FilesModified)"
Write-Host "Lines Removed: $($stats.LinesRemoved)"

if ($DryRun) {
    Write-Host "`nThis was a dry run. No files were actually modified."
}
