Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$stallPath = Join-Path $root "public/assets/sprites/s07-stall.png"
$horsePath = Join-Path $root "public/assets/sprites/s01-horse.png"
$outputDir = Join-Path $PSScriptRoot "samples"
$rawPath = Join-Path $outputDir "stall-with-horse-sample.png"
$previewPath = Join-Path $outputDir "stall-with-horse-sample-x8.png"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$stallSheet = [System.Drawing.Bitmap]::new($stallPath)
$horseSheet = [System.Drawing.Bitmap]::new($horsePath)
$sample = [System.Drawing.Bitmap]::new(32, 32, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    # Approved empty barred stall: S07 column 0, row 1.
    for ($y = 0; $y -lt 32; $y++) {
        for ($x = 0; $x -lt 32; $x++) {
            $sample.SetPixel($x, $y, $stallSheet.GetPixel($x, $y + 32))
        }
    }

    # Open the center section by copying the approved dark-interior pixel over
    # the middle bars. Keep the side structure and lower half-door unchanged.
    $interiorPixel = $stallSheet.GetPixel(5, 36)
    for ($y = 4; $y -le 12; $y++) {
        for ($x = 9; $x -le 25; $x++) {
            $sample.SetPixel($x, $y, $interiorPixel)
        }
    }

    # Approved idle horse: S01 column 0, row 0. Move only its existing head
    # and neck pixels into the opened stall; no horse pixels are redrawn.
    for ($sourceY = 2; $sourceY -le 18; $sourceY++) {
        for ($sourceX = 17; $sourceX -le 31; $sourceX++) {
            $targetX = $sourceX - 8
            $targetY = $sourceY + 2
            $horsePixel = $horseSheet.GetPixel($sourceX, $sourceY)
            $stallPixel = $sample.GetPixel($targetX, $targetY)
            $isOpening = $stallPixel.R -eq 0x4E -and $stallPixel.G -eq 0x2F -and $stallPixel.B -eq 0x1A
            if ($horsePixel.A -gt 0 -and $isOpening) {
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
