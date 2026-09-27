@./AGENTS.md

<!--
  Thin pointer, matching the CLAUDE.md convention. AGENTS.md is the single source of
  truth for this repo's rules; edit it there, not here.

  Gemini-specific notes:
  - Gemini CLI reads GEMINI.md (uppercase) from the project root and from every ancestor
    up to the .git root, and also scans subdirectories as just-in-time context. Imports
    use an at-sign followed by a relative .md path, are scoped to .md files, and nest up
    to 10 levels deep. This repo has no sub-directory GEMINI.md files; add one only if a
    subdirectory ever develops rules of its own.
  - That import processor matches anywhere in the text, including inside code blocks and
    comments, so this file deliberately never writes the at-sign import syntax out
    literally. Doing so would register a bogus import.
  - If you rename or relocate AGENTS.md, update the import on line 1.

  The repo's agents and the expo-router-screen skill live in agents/ and are wired for
  opencode through opencode.json: agent prompts are plain .md files in agents/, and the
  skill is agents/skills/expo-router-screen/SKILL.md. Gemini CLI does not auto-discover
  those, so the "Before you change anything" table in AGENTS.md carries direct file paths.
  Read the referenced file before editing.
-->
