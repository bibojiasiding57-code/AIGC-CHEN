param(
  [string]$FfmpegPath = "",
  [string]$SourceDirectory = "public/media/works",
  [string]$OutputDirectory = "public/videos",
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$sourceRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $SourceDirectory))
$outputRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $OutputDirectory))

if (-not $sourceRoot.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase) -or
    -not $outputRoot.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Source and output directories must stay inside the project."
}
if (-not $FfmpegPath) {
  $FfmpegPath = Get-ChildItem (Join-Path $env:TEMP "aigc-chen-ffmpeg-npm") -Filter ffmpeg.exe -Recurse |
    Select-Object -First 1 -ExpandProperty FullName
}
if (-not $FfmpegPath -or -not (Test-Path -LiteralPath $FfmpegPath)) {
  throw "FFmpeg was not found. Pass -FfmpegPath with an absolute path."
}

$jobs = @(
  @{ Name = "avatr-ad.mp4"; PrimaryCrf = 17; FallbackCrf = 18 },
  @{ Name = "play-study.mp4"; PrimaryCrf = 15; FallbackCrf = 16 },
  @{ Name = "fs21.mp4"; PrimaryCrf = 15; FallbackCrf = 16 },
  @{ Name = "pv.mp4"; PrimaryCrf = 15; FallbackCrf = 16 },
  @{ Name = "test-success.mp4"; PrimaryCrf = 15; FallbackCrf = 16 },
  @{ Name = "back-to-that-time.mp4"; PrimaryCrf = 15; FallbackCrf = 16 },
  @{ Name = "japanese-style-test.mp4"; PrimaryCrf = 15; FallbackCrf = 16 },
  @{ Name = "style-test.mp4"; PrimaryCrf = 15; FallbackCrf = 16 },
  @{ Name = "dark-night-style.mp4"; PrimaryCrf = 15; FallbackCrf = 16 },
  @{ Name = "vlog-mv.mp4"; PrimaryCrf = 15; FallbackCrf = 16 },
  @{ Name = "vlog.mp4"; PrimaryCrf = 15; FallbackCrf = 16 },
  @{ Name = "mv-vlog.mp4"; PrimaryCrf = 15; FallbackCrf = 16 }
)

New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$results = @()

function Invoke-Encode([string]$InputPath, [string]$OutputPath, [int]$Crf) {
  if (Test-Path -LiteralPath $OutputPath) { Remove-Item -LiteralPath $OutputPath -Force }
  Write-Host "Encoding $(Split-Path $OutputPath -Leaf) at CRF $Crf..."
  & $FfmpegPath -hide_banner -loglevel warning -stats -y -i $InputPath `
    -map "0:v:0" -map "0:a:0?" `
    -c:v libx264 -crf $Crf -preset slow -maxrate 5M -bufsize 10M `
    -c:a aac -b:a 192k -movflags +faststart $OutputPath
  if ($LASTEXITCODE -ne 0) { throw "FFmpeg failed at CRF $Crf with exit code $LASTEXITCODE" }
}

foreach ($job in $jobs) {
  $name = $job.Name
  $input = Join-Path $sourceRoot $name
  $output = Join-Path $outputRoot $name
  if (-not (Test-Path -LiteralPath $input)) { throw "Missing source video: $input" }

  if ($Force -or -not (Test-Path -LiteralPath $output)) {
    Invoke-Encode $input $output $job.PrimaryCrf
  }

  $file = Get-Item -LiteralPath $output
  $usedCrf = $job.PrimaryCrf
  if ($file.Length -gt 95MB) {
    Write-Host "$name is $([math]::Round($file.Length / 1MB, 2)) MB; retrying at CRF $($job.FallbackCrf)..."
    Invoke-Encode $input $output $job.FallbackCrf
    $file = Get-Item -LiteralPath $output
    $usedCrf = $job.FallbackCrf
  }
  if ($file.Length -gt 95MB) {
    throw "$name remains larger than 95 MB after the permitted fallback (CRF $usedCrf)."
  }
  $results += [pscustomobject]@{
    Name = $name
    CRF = $usedCrf
    SourceMB = [math]::Round((Get-Item -LiteralPath $input).Length / 1MB, 2)
    OutputMB = [math]::Round($file.Length / 1MB, 2)
    Under95MB = $file.Length -le 95MB
  }
}

$results | Format-Table -AutoSize
