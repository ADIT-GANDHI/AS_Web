# Export White_parda_asset_480x1660_updated.ai → hi-res transparent PNG via Illustrator COM.
$ErrorActionPreference = 'Stop'
$aiPath = 'D:\Mihir_Avni\Ajab_New\ajabshar-main\White_parda_asset_480x1660_updated.ai'
$outPng = 'D:\Mihir_Avni\Ajab_New\ajabshar-main\public\songs-assets\song_filter_white_480x1660_updated.png'
$outBackup = 'D:\Mihir_Avni\Ajab_New\ajabshar-main\public\songs-assets\song_filter_white_480x1660_updated_semitransparent-backup.png'
$scale = 300  # percent — crisp under scaleY stretch in 360px drawer

$ill = New-Object -ComObject Illustrator.Application
$ill.UserInteractionLevel = 2  # dontDisplayAlerts
$doc = $ill.Open($aiPath)

$pngOpts = New-Object -ComObject Illustrator.ExportOptionsPNG24
$pngOpts.Transparency = $true
$pngOpts.ArtBoardClipping = $true
$pngOpts.AntiAliasing = $true
$pngOpts.HorizontalScale = $scale
$pngOpts.VerticalScale = $scale

# ExportType.PNG24 = 5
$doc.Export($outPng, 5, $pngOpts)
$doc.Close(2)  # DONOTSAVECHANGES

Copy-Item -Force $outPng $outBackup
Write-Output "Exported $outPng @ ${scale}%"
Get-Item $outPng | Select-Object FullName, Length, LastWriteTime
