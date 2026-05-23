$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$port = 5173
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$port/"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".ico"  = "image/x-icon"
  ".txt"  = "text/plain; charset=utf-8"
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch { continue }

  try {
    $req = $ctx.Request
    $res = $ctx.Response
    $res.SendChunked = $false
    $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($rel -eq "/" -or $rel.EndsWith("/")) { $rel = $rel + "index.html" }
    $safe = $rel.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
    $path = Join-Path $root $safe

    if (Test-Path -LiteralPath $path -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $ct = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $res.StatusCode = 200
      $res.ContentType = $ct
      $res.ContentLength64 = $bytes.LongLength
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rel")
      $res.StatusCode = 404
      $res.ContentType = "text/plain; charset=utf-8"
      $res.ContentLength64 = $msg.LongLength
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
  } catch {
    Write-Host "Request error: $($_.Exception.Message)"
  } finally {
    try { $ctx.Response.OutputStream.Close() } catch {}
    try { $ctx.Response.Close() } catch {}
  }
}
