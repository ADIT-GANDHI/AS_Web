$ErrorActionPreference = 'Stop'
$aiPath = 'D:\Mihir_Avni\Ajab_New\ajabshar-main\White_parda_asset_480x1660_updated.ai'
$outSvg = 'D:\Mihir_Avni\Ajab_New\ajabshar-main\public\songs-assets\song_filter_white_480x1660_updated.svg'

$ill = New-Object -ComObject Illustrator.Application
$ill.UserInteractionLevel = 2
$doc = $ill.Open($aiPath)

try { $ill.ExecuteMenuCommand('expandStyle') } catch { Write-Output "expandStyle: $_" }

$svgOpts = New-Object -ComObject Illustrator.ExportOptionsSVG
$svgOpts.EmbedRasterImages = $false
$svgOpts.CoordinatePrecision = 3

# ExportType.SVG — try common enum values
$exported = $false
foreach ($t in @(10, 8, 13, 7)) {
  try {
    $doc.Export($outSvg, $t, $svgOpts)
    Write-Output "exported with type $t"
    $exported = $true
    break
  } catch {
    Write-Output "type $t failed: $($_.Exception.Message)"
  }
}
if (-not $exported) { throw 'SVG export failed for all type ids' }

$doc.Close(2)
Get-Item $outSvg | Select-Object FullName, Length, LastWriteTime
Select-String -Path $outSvg -Pattern 'image|path|filter|feGaussian' | Select-Object -First 20
