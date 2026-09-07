param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory
)

Add-Type -AssemblyName System.Drawing

function Get-VisibleBounds {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [int]$Top,
    [int]$Bottom,
    [int]$Left = 0,
    [int]$Right = 0
  )

  if ($Right -le 0) { $Right = $Bitmap.Width }

  $visibleLeft = $Right
  $visibleRight = -1
  $visibleTop = $Bottom
  $visibleBottom = -1

  for ($y = $Top; $y -lt $Bottom; $y += 1) {
    for ($x = $Left; $x -lt $Right; $x += 1) {
      $pixel = $Bitmap.GetPixel($x, $y)
      if (($pixel.R -lt 242) -or ($pixel.G -lt 242) -or ($pixel.B -lt 242)) {
        if ($x -lt $visibleLeft) { $visibleLeft = $x }
        if ($x -gt $visibleRight) { $visibleRight = $x }
        if ($y -lt $visibleTop) { $visibleTop = $y }
        if ($y -gt $visibleBottom) { $visibleBottom = $y }
      }
    }
  }

  if ($visibleRight -lt $visibleLeft) {
    throw "Belirtilen aralıkta logo öğesi bulunamadı."
  }

  return [System.Drawing.Rectangle]::FromLTRB($visibleLeft, $visibleTop, $visibleRight + 1, $visibleBottom + 1)
}

function Copy-WithTransparentWhite {
  param(
    [System.Drawing.Bitmap]$Source,
    [System.Drawing.Rectangle]$Bounds
  )

  $result = New-Object System.Drawing.Bitmap($Bounds.Width, $Bounds.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

  for ($y = 0; $y -lt $Bounds.Height; $y += 1) {
    for ($x = 0; $x -lt $Bounds.Width; $x += 1) {
      $pixel = $Source.GetPixel($Bounds.X + $x, $Bounds.Y + $y)
      $alpha = [Math]::Max(255 - $pixel.R, [Math]::Max(255 - $pixel.G, 255 - $pixel.B))

      # Kaynak PNG'nin beyaz tuvalindeki çok hafif sıkıştırma/gölge gürültüsü
      # logonun parçası değildir; düşük opaklıktaki bu pikselleri temizle.
      if ($alpha -le 36) {
        $result.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        continue
      }

      # Beyaz zeminle karışmış kenar piksellerini geri ayrıştır. Böylece koyu
      # temada beyaz bir kontur oluşmaz ve kaynak logonun gerçek renkleri kalır.
      $red = [Math]::Max(0, [Math]::Min(255, [int][Math]::Round(255 - ((255 - $pixel.R) * 255 / $alpha))))
      $green = [Math]::Max(0, [Math]::Min(255, [int][Math]::Round(255 - ((255 - $pixel.G) * 255 / $alpha))))
      $blue = [Math]::Max(0, [Math]::Min(255, [int][Math]::Round(255 - ((255 - $pixel.B) * 255 / $alpha))))
      $result.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $red, $green, $blue))
    }
  }

  return $result
}

$source = New-Object System.Drawing.Bitmap($SourcePath)

try {
  # Kaynak görselde ikon üst bölümde, özgün yazı ise orta bölümde bulunuyor.
  $symbolBounds = Get-VisibleBounds -Bitmap $source -Top 100 -Bottom 530 -Left 520 -Right 920
  $wordmarkBounds = Get-VisibleBounds -Bitmap $source -Top 540 -Bottom 790

  $symbol = Copy-WithTransparentWhite -Source $source -Bounds $symbolBounds
  $wordmark = Copy-WithTransparentWhite -Source $source -Bounds $wordmarkBounds

  try {
    $targetHeight = 190
    $symbolWidth = [int][Math]::Round($symbol.Width * ($targetHeight / $symbol.Height))
    $wordmarkHeight = 138
    $wordmarkWidth = [int][Math]::Round($wordmark.Width * ($wordmarkHeight / $wordmark.Height))
    $gap = 34
    $canvasWidth = $symbolWidth + $gap + $wordmarkWidth
    $canvas = New-Object System.Drawing.Bitmap($canvasWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    try {
      $graphics = [System.Drawing.Graphics]::FromImage($canvas)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

        $graphics.DrawImage($symbol, 0, 0, $symbolWidth, $targetHeight)
        $wordmarkY = [int][Math]::Round(($targetHeight - $wordmarkHeight) / 2)
        $graphics.DrawImage($wordmark, $symbolWidth + $gap, $wordmarkY, $wordmarkWidth, $wordmarkHeight)
      } finally {
        $graphics.Dispose()
      }

      New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
      $lockupPath = Join-Path $OutputDirectory 'menule-logo-original.png'
      $symbolPath = Join-Path $OutputDirectory 'menule-symbol-original.png'
      $canvas.Save($lockupPath, [System.Drawing.Imaging.ImageFormat]::Png)
      $symbol.Save($symbolPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $canvas.Dispose()
    }
  } finally {
    $symbol.Dispose()
    $wordmark.Dispose()
  }
} finally {
  $source.Dispose()
}
