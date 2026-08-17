Add-Type -AssemblyName System.Drawing

$sourcePath = "build/icon.png"
if (!(Test-Path $sourcePath)) {
    $sourcePath = "assets/icon.png"
}

Write-Host "Using source icon: $sourcePath"
$bytes = [System.IO.File]::ReadAllBytes($sourcePath)
$ms = New-Object System.IO.MemoryStream($bytes, 0, $bytes.Length)
$src = [System.Drawing.Bitmap]::FromStream($ms)

function Resize-Image($srcImg, $targetWidth, $targetHeight, $outPath) {
    $dest = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    # Calculate aspect ratio preservation
    $srcRatio = $srcImg.Width / $srcImg.Height
    $targetRatio = $targetWidth / $targetHeight
    
    if ($srcRatio -eq $targetRatio) {
        $g.DrawImage($srcImg, 0, 0, $targetWidth, $targetHeight)
    } else {
        # Centered fit
        if ($srcRatio -gt $targetRatio) {
            $destW = $targetWidth
            $destH = [int]($targetWidth / $srcRatio)
            $destX = 0
            $destY = [int](($targetHeight - $destH) / 2)
        } else {
            $destH = $targetHeight
            $destW = [int]($targetHeight * $srcRatio)
            $destX = [int](($targetWidth - $destW) / 2)
            $destY = 0
        }
        $g.DrawImage($srcImg, $destX, $destY, $destW, $destH)
    }
    
    $g.Dispose()
    
    $parent = Split-Path $outPath
    if ($parent -and !(Test-Path $parent)) { 
        New-Item -ItemType Directory -Force -Path $parent | Out-Null 
    }
    $dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Created $outPath ($targetWidth x $targetHeight)"
}

New-Item -ItemType Directory -Force -Path 'build/appx', 'assets', 'src/renderer/public', 'src/renderer/src/assets' | Out-Null

# AppX core icons
Resize-Image $src 44 44 'build/appx/Square44x44Logo.png'
Resize-Image $src 150 150 'build/appx/Square150x150Logo.png'
Resize-Image $src 50 50 'build/appx/StoreLogo.png'
Resize-Image $src 310 310 'build/appx/Square310x310Logo.png'
Resize-Image $src 71 71 'build/appx/Square71x71Logo.png'
Resize-Image $src 310 150 'build/appx/Wide310x150Logo.png'

# AppX scale variants - Square44x44Logo
Resize-Image $src 44 44 'build/appx/Square44x44Logo.scale-100.png'
Resize-Image $src 55 55 'build/appx/Square44x44Logo.scale-125.png'
Resize-Image $src 66 66 'build/appx/Square44x44Logo.scale-150.png'
Resize-Image $src 88 88 'build/appx/Square44x44Logo.scale-200.png'
Resize-Image $src 176 176 'build/appx/Square44x44Logo.scale-400.png'

# AppX targetsize variants - Square44x44Logo
Resize-Image $src 16 16 'build/appx/Square44x44Logo.targetsize-16.png'
Resize-Image $src 24 24 'build/appx/Square44x44Logo.targetsize-24.png'
Resize-Image $src 32 32 'build/appx/Square44x44Logo.targetsize-32.png'
Resize-Image $src 48 48 'build/appx/Square44x44Logo.targetsize-48.png'
Resize-Image $src 256 256 'build/appx/Square44x44Logo.targetsize-256.png'

Resize-Image $src 16 16 'build/appx/Square44x44Logo.targetsize-16_altform-unplated.png'
Resize-Image $src 24 24 'build/appx/Square44x44Logo.targetsize-24_altform-unplated.png'
Resize-Image $src 32 32 'build/appx/Square44x44Logo.targetsize-32_altform-unplated.png'
Resize-Image $src 48 48 'build/appx/Square44x44Logo.targetsize-48_altform-unplated.png'
Resize-Image $src 256 256 'build/appx/Square44x44Logo.targetsize-256_altform-unplated.png'

# AppX scale variants - Square150x150Logo
Resize-Image $src 150 150 'build/appx/Square150x150Logo.scale-100.png'
Resize-Image $src 188 188 'build/appx/Square150x150Logo.scale-125.png'
Resize-Image $src 225 225 'build/appx/Square150x150Logo.scale-150.png'
Resize-Image $src 300 300 'build/appx/Square150x150Logo.scale-200.png'
Resize-Image $src 600 600 'build/appx/Square150x150Logo.scale-400.png'

# AppX scale variants - StoreLogo
Resize-Image $src 50 50 'build/appx/StoreLogo.scale-100.png'
Resize-Image $src 63 63 'build/appx/StoreLogo.scale-125.png'
Resize-Image $src 75 75 'build/appx/StoreLogo.scale-150.png'
Resize-Image $src 100 100 'build/appx/StoreLogo.scale-200.png'
Resize-Image $src 200 200 'build/appx/StoreLogo.scale-400.png'

# AppX scale variants - Wide310x150Logo
Resize-Image $src 310 150 'build/appx/Wide310x150Logo.scale-100.png'
Resize-Image $src 388 188 'build/appx/Wide310x150Logo.scale-125.png'
Resize-Image $src 465 225 'build/appx/Wide310x150Logo.scale-150.png'
Resize-Image $src 620 300 'build/appx/Wide310x150Logo.scale-200.png'
Resize-Image $src 1240 600 'build/appx/Wide310x150Logo.scale-400.png'

# General app icons
Resize-Image $src 1024 1024 'assets/icon.png'
Resize-Image $src 512 512 'src/renderer/src/assets/logo.png'
Resize-Image $src 256 256 'src/renderer/public/icon.png'

# Windows ICO generation
$icoBitmap = New-Object System.Drawing.Bitmap($src, 256, 256)
$hIcon = $icoBitmap.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$fs1 = [System.IO.File]::Open('build/icon.ico', [System.IO.FileMode]::Create)
$icon.Save($fs1)
$fs1.Close()

$fs2 = [System.IO.File]::Open('assets/icon.ico', [System.IO.FileMode]::Create)
$icon.Save($fs2)
$fs2.Close()

$icon.Dispose()
$icoBitmap.Dispose()
$src.Dispose()
$ms.Dispose()

Write-Host "`nAll AppX and Windows ICO icons generated successfully from new logo!"
