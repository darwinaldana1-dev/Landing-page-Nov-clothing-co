# =============================================================================
# Genera assets/img a partir de los flyers de "fotos productos" y de Logo.png.
# Sólo usa System.Drawing de .NET: no hace falta instalar nada.
#
#     powershell -ExecutionPolicy Bypass -File tools\build-images.ps1
#
# Todas las fotos salen a 900x1125 px (4:5), la proporción del marco de la
# galería. Los recortes apaisados (cartas de color, trío de joggers) se centran
# sobre un fondo tomado del propio flyer en vez de recortarse por los lados.
# =============================================================================

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root "fotos productos"
$out  = Join-Path $root "assets\img"
New-Item -ItemType Directory -Force -Path $out | Out-Null

$targetW = 900
$targetH = 1125

function Save-Jpeg($bitmap, $path, $quality) {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]$quality)
  $bitmap.Save($path, $codec, $params)
}

function New-Canvas($w, $h) {
  $canvas = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @($canvas, $g)
}

# $fit = $true  -> el recorte se centra completo y el resto se rellena.
# $fit = $false -> el recorte llena el marco (debe venir ya en 4:5).
function Export-Shot($file, $name, $x, $y, $w, $h, $fit) {
  $image = [System.Drawing.Image]::FromFile((Join-Path $src $file))
  $pair = New-Canvas $targetW $targetH
  $canvas = $pair[0]; $g = $pair[1]

  if ($fit) {
    $bmp = New-Object System.Drawing.Bitmap($image)
    $pad = $bmp.GetPixel($x + 3, $y + 3)    # fondo real del flyer en esa zona
    $bmp.Dispose()
    $g.Clear($pad)

    $scale = [Math]::Min($targetW / $w, $targetH / $h)
    $dw = [int]($w * $scale); $dh = [int]($h * $scale)
    $dest = New-Object System.Drawing.Rectangle([int](($targetW - $dw) / 2), [int](($targetH - $dh) / 2), $dw, $dh)
  } else {
    $dest = New-Object System.Drawing.Rectangle(0, 0, $targetW, $targetH)
  }

  $g.DrawImage($image, $dest, (New-Object System.Drawing.Rectangle($x, $y, $w, $h)), [System.Drawing.GraphicsUnit]::Pixel)
  Save-Jpeg $canvas (Join-Path $out "$name.jpg") 88
  "  {0,-22} [{1},{2} {3}x{4}]{5}" -f "$name.jpg", $x, $y, $w, $h, $(if ($fit) { " centrado" } else { "" })

  $g.Dispose(); $canvas.Dispose(); $image.Dispose()
}

"Bodys.png"
Export-Shot "Bodys.png" "body-negro" 4   330 364 455 $false
Export-Shot "Bodys.png" "body-beige" 379 330 364 455 $false
Export-Shot "Bodys.png" "body-azul"  754 330 364 455 $false

"Leggins.png"
Export-Shot "Leggins.png" "leggins-gris"    0  560 440 550 $false
Export-Shot "Leggins.png" "leggins-figura"  10  60 430 537 $false
Export-Shot "Leggins.png" "leggins-colores" 402 900 618 505 $true

"Pantalon bota recta.png"
Export-Shot "Pantalon bota recta.png" "jogger-azul"     20 430 520 650 $false
Export-Shot "Pantalon bota recta.png" "jogger-look"      0 200 560 700 $false
Export-Shot "Pantalon bota recta.png" "jogger-colores" 565 605 665 478 $true

# ── Flyers completos para el carrusel del hero ───────────────────────────────
# No se recortan: se muestran enteros, sólo se reducen de peso. Los PNG de
# origen pesan ~2 MB cada uno y no sirven para una página.
function Export-Flyer($file, $name) {
  $image = [System.Drawing.Image]::FromFile((Join-Path $src $file))

  # 1.0 como double: con "1" entero, PowerShell elige Math::Min(int,int) y
  # redondea el factor de escala a 1, dejando el flyer en su tamaño original.
  $maxSide = 1100.0
  $scale = [Math]::Min(1.0, $maxSide / [Math]::Max($image.Width, $image.Height))
  $w = [int]($image.Width * $scale)
  $h = [int]($image.Height * $scale)

  $pair = New-Canvas $w $h
  $canvas = $pair[0]; $g = $pair[1]
  $g.DrawImage($image, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)))
  Save-Jpeg $canvas (Join-Path $out "$name.jpg") 86
  "  {0,-22} {1}x{2} (flyer completo)" -f "$name.jpg", $w, $h

  $g.Dispose(); $canvas.Dispose(); $image.Dispose()
}

"Flyers para el carrusel"
Export-Flyer "Bodys.png" "flyer-bodies"
Export-Flyer "Leggins.png" "flyer-leggins"
Export-Flyer "Pantalon bota recta.png" "flyer-joggers"

# ── Logo ─────────────────────────────────────────────────────────────────────
# El logo es tinta oscura sobre blanco. Se recorta al contenido y se usa la
# luminancia como canal alfa, así los bordes quedan suaves y el logo funciona
# sobre cualquier fondo.
"Logo.png"
$logo = New-Object System.Drawing.Bitmap((Join-Path $root "Logo.png"))
$minX = $logo.Width; $minY = $logo.Height; $maxX = 0; $maxY = 0
for ($py = 0; $py -lt $logo.Height; $py++) {
  for ($px = 0; $px -lt $logo.Width; $px++) {
    $c = $logo.GetPixel($px, $py)
    if ((0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B) -lt 200) {
      if ($px -lt $minX) { $minX = $px }; if ($px -gt $maxX) { $maxX = $px }
      if ($py -lt $minY) { $minY = $py }; if ($py -gt $maxY) { $maxY = $py }
    }
  }
}
$cw = $maxX - $minX + 1; $ch = $maxY - $minY + 1
$transparent = New-Object System.Drawing.Bitmap($cw, $ch, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($py = 0; $py -lt $ch; $py++) {
  for ($px = 0; $px -lt $cw; $px++) {
    $c = $logo.GetPixel($minX + $px, $minY + $py)
    $lum = (0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B)
    if ($lum -ge 232) { $a = 0 } else { $a = [int](255 - ($lum * 255 / 232)) }
    $transparent.SetPixel($px, $py, [System.Drawing.Color]::FromArgb($a, 29, 29, 31))
  }
}
$logo.Dispose()
$transparent.Save((Join-Path $out "logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
"  {0,-22} {1}x{2} con fondo transparente" -f "logo.png", $cw, $ch

# Versión opaca sobre crema, para favicon y og:image.
$pair = New-Canvas 600 600
$flat = $pair[0]; $g = $pair[1]
$g.Clear([System.Drawing.ColorTranslator]::FromHtml("#f6f1e9"))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$boxW = 440; $boxH = 440
$scale = [Math]::Min($boxW / $cw, $boxH / $ch)
$dw = [int]($cw * $scale); $dh = [int]($ch * $scale)
$g.DrawImage($transparent, (New-Object System.Drawing.Rectangle([int]((600 - $dw) / 2), [int]((600 - $dh) / 2), $dw, $dh)))
$g.Dispose()
Save-Jpeg $flat (Join-Path $out "logo.jpg") 92
"  {0,-22} 600x600 sobre crema" -f "logo.jpg"
$flat.Dispose(); $transparent.Dispose()

""
"Listo. " + (Get-ChildItem $out).Count + " archivos en assets\img."
