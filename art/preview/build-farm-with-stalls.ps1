Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$farmPath = Join-Path $PSScriptRoot "farm-day-x1.png"
$stallSamplePath = Join-Path $PSScriptRoot "samples/stall-with-horse-sample.png"
$outputPath = Join-Path $PSScriptRoot "samples/farm-with-horses-preview.png"

$farm = [System.Drawing.Bitmap]::new($farmPath)
$stall = [System.Drawing.Bitmap]::new($stallSamplePath)
$g = [System.Drawing.Graphics]::FromImage($farm)

try {
    # 7 visible stall anchors
    $anchors = @(
        @{ x = 0; y = 32 },
        @{ x = 128; y = 32 },
        @{ x = 192; y = 32 },
        @{ x = 96; y = 128 },
        @{ x = 160; y = 128 },
        @{ x = 288; y = 128 },
        @{ x = 352; y = 128 }
    )

    foreach ($a in $anchors) {
        $g.DrawImage($stall, $a.x, $a.y, 32, 32)
    }

    $farm.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output $outputPath
}
finally {
    $g.Dispose()
    $stall.Dispose()
    $farm.Dispose()
}
