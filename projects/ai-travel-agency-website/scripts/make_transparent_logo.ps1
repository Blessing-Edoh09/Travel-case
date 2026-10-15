Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Projects\My demo assistant\projects\ai-travel-agency-website\public\assets\logo.png"
$destPath = "c:\Projects\My demo assistant\projects\ai-travel-agency-website\public\assets\logo-transparent.png"

$fileStream = New-Object System.IO.FileStream($srcPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read)
$bmp = [System.Drawing.Bitmap]::FromStream($fileStream)
$fileStream.Close()

$transparentBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        # If near white (R > 245 and G > 245 and B > 245), make it transparent
        if ($pixel.R -ge 245 -and $pixel.G -ge 245 -and $pixel.B -ge 245) {
            $transparentBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        } else {
            $transparentBmp.SetPixel($x, $y, $pixel)
        }
    }
}

$bmp.Dispose()
$transparentBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$transparentBmp.Dispose()

Write-Host "Created transparent logo at $destPath"
