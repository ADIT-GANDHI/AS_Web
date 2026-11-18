$ErrorActionPreference = 'Stop'
$aiPath = 'D:\Mihir_Avni\Ajab_New\ajabshar-main\White_parda_asset_480x1660_updated.ai'
$ill = New-Object -ComObject Illustrator.Application
$ill.UserInteractionLevel = 2
$doc = $ill.Open($aiPath)
Write-Output ("pages=" + $doc.Pages.Count + " layers=" + $doc.Layers.Count)
function DumpItems($items, $indent) {
  $n = $items.Count
  for ($i = 1; $i -le $n; $i++) {
    $it = $items.Item($i)
    $t = $it.Typename
    Write-Output ("$indent$t")
    if ($t -eq 'GroupItem') {
      try { DumpItems $it.PageItems ($indent + '  ') } catch {}
    }
  }
}
for ($L = 1; $L -le $doc.Layers.Count; $L++) {
  $layer = $doc.Layers.Item($L)
  Write-Output ("LAYER: " + $layer.Name)
  DumpItems $layer.PageItems '  '
}
$doc.Close(2)
