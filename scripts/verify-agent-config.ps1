$ErrorActionPreference = "Stop"
$required = @(
  "AGENTS.md",
  "CLAUDE.md",
  "docs/PRODUCT.md",
  "docs/ARCHITECTURE.md",
  "docs/HISTORICAL_INTEGRITY.md",
  "docs/AI_SYSTEM.md",
  "docs/DECISIONS.md",
  ".agents/skills/m3-memory-archive/SKILL.md",
  ".agents/skills/m3-memory-review/SKILL.md",
  ".agents/skills/m3-evidence-check/SKILL.md",
  ".agents/skills/m3-story-builder/SKILL.md",
  ".claude/skills/m3-memory-archive/SKILL.md",
  ".claude/skills/m3-memory-review/SKILL.md",
  ".claude/skills/m3-evidence-check/SKILL.md",
  ".claude/skills/m3-story-builder/SKILL.md"
)
$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing) {
  "Missing required files:"
  $missing
  exit 1
}
"Agent configuration files present."
