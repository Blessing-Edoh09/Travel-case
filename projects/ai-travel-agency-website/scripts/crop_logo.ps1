Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\edohb\.gemini\antigravity-ide\brain\0687c339-79a3-4001-afb2-4493d266037c\.user_uploaded\media_1792064304844.png"
$destPath = "c:\Projects\My demo assistant\projects\ai-travel-agency-website\public\assets\logo.png"

$fileStream = New-Object System.IO.FileStream($srcPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read)
$bmp = [System.Drawing.Bitmap]::FromStream($fileStream)
$fileStream.Close()

$minX = $bmp.Width
$minY = $bmp.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.R -lt 240 -or $pixel.G -lt 240 -or $pixel.B -lt 240) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Bounding box: X=$minX..$maxX, Y=$minY..$maxY"

$pad = 12
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = [Math]::Min($bmp.Width - $cropX, ($maxX - $minX) + ($pad * 2))
$cropH = [Math]::Min($bmp.Height - $cropY, ($maxY - $minY) + ($pad * 2))

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$cropped = $bmp.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bmp.Dispose()

$cropped.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()

Write-Host "Saved tightly cropped logo: ${cropW}x${cropH} to $destPath"
