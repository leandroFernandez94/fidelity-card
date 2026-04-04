# Skill Registry — fidelity-card

Auto-generated registry of available coding skills and conventions for AI agents.

---

## User Skills

Skills available globally across all projects.

### skill-creator

- **Path**: `~/.config/opencode/skills/skill-creator/SKILL.md`
- **Trigger**: When user asks to create a new skill, add agent instructions, or document patterns for AI.
- **Description**: Creates new AI agent skills following the Agent Skills spec.

---

## Project Conventions

Coding standards and rules specific to this project.

### AGENTS.md (project)

- **Path**: `/Users/leandrofernandez/Documents/projects/fidelity-card/AGENTS.md`
- **Type**: Project conventions index
- **Content**: Complete guide for code agents — commands, style, testing, architecture, naming conventions

### AGENTS.md (global)

- **Path**: `~/.config/opencode/AGENTS.md`
- **Type**: Global agent rules
- **Content**: Personality, tone, language rules, philosophy, expertise areas, behavior guidelines

---

## Usage

When launching sub-agents:

1. **Identify relevant skills** based on the task context
2. **Pass skill paths explicitly** in the sub-agent prompt: `SKILL: Load \`{path}\` before starting.`
3. **Include project conventions** when making architectural or style decisions

---

_Last updated: 2026-03-21 by sdd-init_
