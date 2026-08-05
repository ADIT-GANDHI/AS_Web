# Pack out/ into a deploy zip with spec-compliant forward-slash entry names.
# PowerShell's Compress-Archive writes backslashes, which Linux unzip/cPanel
# turn into literal "dir\file" names at the archive root instead of folders.
param(
    [string]$Source = "out",
    [string]$Destination = "ajab-out.zip"
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$srcRoot = (Resolve-Path $Source).Path.TrimEnd('\')
$destPath = Join-Path (Get-Location).Path $Destination

if (Test-Path $destPath) { Remove-Item -Force $destPath }

$zip = [System.IO.Compression.ZipFile]::Open($destPath, 'Create')
$count = 0
try {
    Get-ChildItem -Path $srcRoot -Recurse -File -Force | ForEach-Object {
        $rel = $_.FullName.Substring($srcRoot.Length + 1).Replace('\', '/')
        $entry = $zip.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        try {
            $fileStream = [System.IO.File]::OpenRead($_.FullName)
            try { $fileStream.CopyTo($entryStream) } finally { $fileStream.Dispose() }
        } finally { $entryStream.Dispose() }
        $count++
    }
} finally {
    $zip.Dispose()
}

Write-Output "packed $count entries -> $Destination"
