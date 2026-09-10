$ErrorActionPreference = "Continue"

function Test-Command($Name) {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($cmd) { "${Name}: present ($($cmd.Source))" } else { "${Name}: missing" }
}

"M3 Memory AI Environment Check"
"OS: $([System.Environment]::OSVersion.VersionString)"
"Shell: PowerShell $($PSVersionTable.PSVersion)"
Test-Command git
Test-Command node
Test-Command npm
Test-Command pnpm
Test-Command python
Test-Command pip
Test-Command pipx
Test-Command uv
Test-Command gh
Test-Command codex
Test-Command claude
Test-Command graphify
Test-Command omniroute
"Codex auth: $((codex login status 2>$null) -join ' ')"
$claudeStatus = claude auth status 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
if ($claudeStatus -and $claudeStatus.loggedIn) { "Claude auth: present" } else { "Claude auth: missing or unknown" }
"Relevant env vars present:"
Get-ChildItem Env: | Where-Object { $_.Name -match 'OPENAI|ANTHROPIC|CLAUDE|CODEX|SUPABASE|DATABASE|POSTGRES|OMNI|ROUTE|PONY|GRAPH' } | Select-Object -ExpandProperty Name
