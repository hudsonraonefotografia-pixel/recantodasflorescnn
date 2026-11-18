Add-Type -AssemblyName System.Drawing

function Generate-Icon {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [int]$TargetSize,
        [double]$ContentScale,
        [System.Drawing.Color]$BgColor
    )
    
    $src = [System.Drawing.Bitmap]::FromFile($SourcePath)
    $dest = New-Object System.Drawing.Bitmap($TargetSize, $TargetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Fill solid background
    $brush = New-Object System.Drawing.SolidBrush($BgColor)
    $g.FillRectangle($brush, 0, 0, $TargetSize, $TargetSize)
    $brush.Dispose()
    
    # Calculate target dimensions
    # Source badge bounds
    $srcX = 44
    $srcY = 28
    $srcW = 980 - 44
    $srcH = 1004 - 28
    
    $drawSize = [int]($TargetSize * $ContentScale)
    $aspect = $srcW / $srcH
    
    if ($aspect -gt 1.0) {
        $destW = $drawSize
        $destH = [int]($drawSize / $aspect)
    } else {
        $destH = $drawSize
        $destW = [int]($drawSize * $aspect)
    }
    
    $destX = [int](($TargetSize - $destW) / 2)
    $destY = [int](($TargetSize - $destH) / 2)
    
    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
    $srcRect = New-Object System.Drawing.Rectangle($srcX, $srcY, $srcW, $srcH)
    
    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    
    $g.Dispose()
    $src.Dispose()
    
    # Save as PNG
    $dest.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated: $TargetPath ($TargetSize x $TargetSize) with scale $ContentScale"
}

$srcPath = "$PSScriptRoot\..\src\assets\logo-recantodasflores.png"
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

# Maskable icons: safe zone requires 80% (scale 0.76 - 0.78) so Android launcher circular / squircle mask will never clip the badge!
Generate-Icon -SourcePath $srcPath -TargetPath "$PSScriptRoot\..\public\icon-maskable-512x512.png" -TargetSize 512 -ContentScale 0.76 -BgColor $white
Generate-Icon -SourcePath $srcPath -TargetPath "$PSScriptRoot\..\public\icon-maskable-192x192.png" -TargetSize 192 -ContentScale 0.76 -BgColor $white

# Any icons: safe and clean solid white background with scale 0.82
Generate-Icon -SourcePath $srcPath -TargetPath "$PSScriptRoot\..\public\icon-512x512.png" -TargetSize 512 -ContentScale 0.82 -BgColor $white
Generate-Icon -SourcePath $srcPath -TargetPath "$PSScriptRoot\..\public\icon-192x192.png" -TargetSize 192 -ContentScale 0.82 -BgColor $white

# Apple Touch Icon: 180x180 solid white background
Generate-Icon -SourcePath $srcPath -TargetPath "$PSScriptRoot\..\public\apple-touch-icon.png" -TargetSize 180 -ContentScale 0.82 -BgColor $white
