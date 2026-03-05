# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.9] - 2025-03-05

### Added

- **Server card** at `/.well-known/mcp/server-card.json` for discovery and manual metadata (tools, prompts, authentication).
- **Smithery quality improvements**: tool annotations (`audience`, `priority`), richer parameter descriptions for all tools, and prompts capability for quality scoring.
- **Six prompts (skills)** for Smithery and MCP clients:
  - `schedule_meeting` – full flow: list pages → slots → book (with user confirmation).
  - `check_availability` – “When is [person] next free?” (page, optional days_ahead).
  - `book_for_guest` – fast path when all details are known (page, guest_name, guest_email, preferred_time).
  - `share_booking_link` – return shareable booking links only (page, optional count).
  - `list_my_pages` – list scheduling pages with brief descriptions.
  - `suggest_times` – offer N slot options for the user to pick (page, optional count, timezone, start_date, end_date).
- `prompts/list` and `prompts/get` are fully supported via the MCP server (used by the above prompts).

### Changed

- Tool definitions now include MCP annotations and clearer parameter descriptions in both runtime and server card.
