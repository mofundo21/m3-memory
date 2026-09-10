$ErrorActionPreference = "Stop"
if (-not (Get-Command graphify -ErrorAction SilentlyContinue)) {
  throw "graphify is not on PATH. Install with: uv tool install graphifyy"
}
graphify update .
