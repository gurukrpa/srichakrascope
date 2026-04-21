# ─────────────────────────────────────────────────────────
# Vinayagar Agaval — Audio Processing Script
# Processes raw recordings into web-ready MP3 files
# 
# Usage:
#   .\process-audio.ps1                    # Process all files in VinayagarAgaval/
#   .\process-audio.ps1 -File "Agaval 1.1.mp4"  # Process a single file
# ─────────────────────────────────────────────────────────

param(
    [string]$File = "",
    [string]$InputDir = "VinayagarAgaval",
    [string]$OutputDir = "audio-processed",
    [string]$WebDir = "client\public\audio"
)

$ErrorActionPreference = "Stop"

# File-to-day mapping: add entries as you record
$dayMap = @{
    "Agaval 1.1" = "day-01"
    "Agaval 1.2" = "day-02"
    "Agaval 1.3" = "day-03"
    "Agaval 1.4" = "day-04"
    "Agaval 1.5" = "day-05"
    "Agaval 1.6" = "day-06"
    "Agaval 1.7" = "day-07"
    "Agaval 1.8" = "day-08"
    "Agaval 1.9" = "day-09"
    "Agaval 2.0" = "day-10"
    "Agaval 2.1" = "day-11"
    "Agaval 2.2" = "day-12"
    "Agaval 2.3" = "day-13"
    "Agaval 2.4" = "day-14"
    "Agaval 2.5" = "day-15"
    "Agaval 2.6" = "day-16"
    "Agaval 2.7" = "day-17"
    "Agaval 2.8" = "day-18"
}

# Ensure output dirs exist
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
New-Item -ItemType Directory -Path $WebDir -Force | Out-Null

function Process-AudioFile {
    param([string]$InputPath)
    
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($InputPath)
    
    # Look up day mapping
    $dayName = $dayMap[$baseName]
    if (-not $dayName) {
        Write-Host "  [SKIP] No day mapping for '$baseName' — add it to the `$dayMap in this script" -ForegroundColor Yellow
        return
    }

    $outputPath = Join-Path $OutputDir "$dayName.mp3"
    $webPath = Join-Path $WebDir "$dayName.mp3"

    Write-Host "  Processing: $baseName -> $dayName.mp3" -ForegroundColor Cyan

    # Get duration for fade-out calculation
    $durationJson = ffprobe -v quiet -print_format json -show_format $InputPath | ConvertFrom-Json
    $duration = [math]::Round([double]$durationJson.format.duration, 1)
    $fadeOutStart = [math]::Max(0, $duration - 0.5)

    # FFmpeg processing pipeline:
    #   1. highpass=80Hz     — remove low-frequency rumble
    #   2. lowpass=12000Hz   — remove high-frequency hiss
    #   3. afftdn            — FFT-based noise reduction
    #   4. acompressor       — even out loud/soft parts
    #   5. loudnorm          — normalize to -14 LUFS (broadcast standard)
    #   6. afade in          — smooth 0.3s fade in
    #   7. afade out         — smooth 0.5s fade out
    #   8. mono 44.1kHz 128k — web-optimized MP3
    
    $filter = "highpass=f=80, lowpass=f=12000, afftdn=nf=-25, acompressor=threshold=-20dB:ratio=3:attack=5:release=50:makeup=2, loudnorm=I=-14:TP=-1:LRA=11, afade=t=in:st=0:d=0.3, afade=t=out:st=${fadeOutStart}:d=0.5"

    ffmpeg -y -i $InputPath -af $filter -ac 1 -ar 44100 -b:a 128k $outputPath 2>$null

    if (Test-Path $outputPath) {
        # Copy to web folder
        Copy-Item $outputPath $webPath -Force
        
        $origSize = [math]::Round((Get-Item $InputPath).Length / 1KB)
        $procSize = [math]::Round((Get-Item $outputPath).Length / 1KB)
        Write-Host "    OK: ${origSize}KB -> ${procSize}KB ($dayName.mp3)" -ForegroundColor Green
    } else {
        Write-Host "    FAILED: Could not process $baseName" -ForegroundColor Red
    }
}

# ── Main ──
Write-Host ""
Write-Host "=== Vinayagar Agaval Audio Processor ===" -ForegroundColor Magenta
Write-Host ""

if ($File) {
    # Process single file
    $path = Join-Path $InputDir $File
    if (Test-Path $path) {
        Process-AudioFile $path
    } else {
        Write-Host "File not found: $path" -ForegroundColor Red
    }
} else {
    # Process all audio files in input dir
    $audioFiles = Get-ChildItem -Path $InputDir -Include *.mp4,*.m4a,*.mp3,*.wav,*.webm,*.aac,*.ogg -Recurse
    if ($audioFiles.Count -eq 0) {
        Write-Host "No audio files found in $InputDir/" -ForegroundColor Yellow
        Write-Host "Place your recordings there and re-run this script."
    } else {
        Write-Host "Found $($audioFiles.Count) audio file(s)" -ForegroundColor White
        foreach ($f in $audioFiles) {
            Process-AudioFile $f.FullName
        }
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
