param(
  [string]$Source = 'D:\视频',
  [string]$Destination = (Join-Path $PSScriptRoot '..\public\media\works')
)

$map = [ordered]@{
  '啊维塔广告' = 'avatr-ad.mp4'
  '做着玩的' = 'play-study.mp4'
  'fs21' = 'fs21.mp4'
  'pv' = 'pv.mp4'
  '测试成功' = 'test-success.mp4'
  '好想回到那个时候' = 'back-to-that-time.mp4'
  '日系风格测试' = 'japanese-style-test.mp4'
  '风格测试' = 'style-test.mp4'
  '暗夜风格' = 'dark-night-style.mp4'
  'vlog.mv' = 'vlog-mv.mp4'
  'vlog' = 'vlog.mp4'
  'mv.vlog' = 'mv-vlog.mp4'
}

$files = Get-ChildItem -LiteralPath $Source -File
$byBaseName = @{}

foreach ($file in $files) {
  $key = [IO.Path]::GetFileNameWithoutExtension($file.Name).Trim().ToLowerInvariant()
  if ($byBaseName.ContainsKey($key)) {
    throw "Ambiguous source basename: $key"
  }
  $byBaseName[$key] = $file
}

New-Item -ItemType Directory -Force -Path $Destination | Out-Null

foreach ($entry in $map.GetEnumerator()) {
  $key = $entry.Key.Trim().ToLowerInvariant()
  if (-not $byBaseName.ContainsKey($key)) {
    throw "Missing source video: $($entry.Key)"
  }

  $sourceFile = $byBaseName[$key]
  if ($sourceFile.Extension.ToLowerInvariant() -ne '.mp4') {
    throw "Expected MP4: $($sourceFile.Name)"
  }

  Copy-Item -LiteralPath $sourceFile.FullName -Destination (Join-Path $Destination $entry.Value) -Force
}

$expectedNames = @($map.Values | Sort-Object)
$actualNames = @(Get-ChildItem -LiteralPath $Destination -Filter '*.mp4' | Select-Object -ExpandProperty Name | Sort-Object)

if (Compare-Object -ReferenceObject $expectedNames -DifferenceObject $actualNames) {
  throw 'Destination MP4 files do not exactly match the 12 configured works.'
}

Write-Output "Synced $($actualNames.Count) works videos to $Destination"
