Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$stallPath = Join-Path $root "public/assets/sprites/s07-stall.png"
$horsePath = Join-Path $root "public/assets/sprites/s01-horse.png"
$outputDir = Join-Path $PSScriptRoot "samples"
$rawPath = Join-Path $outputDir "stall-with-horse-clarity-sample.png"
$previewPath = Join-Path $outputDir "stall-with-horse-clarity-sample-x8.png"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$stallSheet = [System.Drawing.Bitmap]::new($stallPath)
$horseSheet = [System.Drawing.Bitmap]::new($horsePath)
$sample = [System.Drawing.Bitmap]::new(32, 32, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    for ($y = 0; $y -lt 32; $y++) {
        for ($x = 0; $x -lt 32; $x++) {
            $sample.SetPixel($x, $y, $stallSheet.GetPixel($x, $y + 32))
        }
    }

    $interiorPixel = $stallSheet.GetPixel(5, 36)
    for ($y = 3; $y -le 14; $y++) {
        for ($x = 7; $x -le 25; $x++) {
            $sample.SetPixel($x, $y, $interiorPixel)
        }
    }

    # Copy the same approved S01 idle horse pixels; only the viewport and vertical offset change.
    for ($sourceY = 2; $sourceY -le 18; $sourceY++) {
        for ($sourceX = 15; $sourceX -le 31; $sourceX++) {
            $targetX = $sourceX - 8
            $targetY = $sourceY + 1
            $horsePixel = $horseSheet.GetPixel($sourceX, $sourceY)
            if ($horsePixel.A -gt 0 -and $targetX -ge 7 -and $targetX -le 25 -and $targetY -ge 3 -and $targetY -le 14) {
                $sample.SetPixel($targetX, $targetY, $horsePixel)
            }
        }
    }

    $sample.Save($rawPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $scale = 8
    $preview = [System.Drawing.Bitmap]::new(32 * $scale, 32 * $scale, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        for ($y = 0; $y -lt $preview.Height; $y++) {
            for ($x = 0; $x -lt $preview.Width; $x++) {
                $preview.SetPixel($x, $y, $sample.GetPixel([Math]::Floor($x / $scale), [Math]::Floor($y / $scale)))
            }
        }
        $preview.Save($previewPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $preview.Dispose()
    }
}
finally {
    $sample.Dispose()
    $horseSheet.Dispose()
    $stallSheet.Dispose()
}

Write-Output $rawPath
Write-Output $previewPath
