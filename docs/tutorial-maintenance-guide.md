# Tutorial Maintenance Guide

## Overview

This guide ensures that tutorials and documentation stay synchronized with actual feature implementations in the Post Production Studio.

---

## Files to Update When Features Change

### 1. Tutorial Component
**Location:** `src/components/media/PostProductionTutorial.tsx`

**Update when:**
- New AI tools are added
- Tool functionality changes
- UI layout changes significantly
- New workflow steps are introduced

**What to update:**
- Tutorial step descriptions
- Pro tips array
- Step images (if visual changes)

---

### 2. Help Center Documentation
**Location:** `docs/post-production-studio-guide.md`

**Update when:**
- Feature functionality changes
- New features are added
- Workflow best practices change
- Troubleshooting steps needed

**What to update:**
- Feature descriptions
- How-to instructions
- Pro tips sections
- Keyboard shortcuts
- Version number and last updated date

---

### 3. Tutorial Images
**Location:** `src/assets/tutorial-seeksy-*.jpg`

**Update when:**
- UI design changes
- New features are visible in interface
- Color schemes or branding updates
- Tool layouts change

**Images to maintain:**
- `tutorial-seeksy-timeline.jpg` - Timeline and playback controls
- `tutorial-seeksy-ai-tools.jpg` - AI editing tools sidebar
- `tutorial-seeksy-manual-tools.jpg` - Manual editing tools
- `tutorial-seeksy-export-save.jpg` - Save and export workflow

---

## Recent Updates Log

### 2025-11-25 - Picture-in-Picture Preview Feature

**Changes made:**
- Added real-time PiP preview during AI Camera Focus processing
- Main video shows original footage
- Smaller PiP window shows edited version with zoom/focus effects
- Visual overlays indicate edit type being applied

**Documentation updated:**
- ✅ PostProductionTutorial.tsx - Added PiP preview to AI tools tips
- ✅ post-production-studio-guide.md - Added detailed PiP section to AI Camera Focus
- ✅ Version bumped to 1.1

---

## Update Checklist Template

When adding or modifying features, use this checklist:

- [ ] Update tutorial step descriptions
- [ ] Update pro tips to reflect new capabilities
- [ ] Generate/update tutorial images if UI changed
- [ ] Update Help Center markdown documentation
- [ ] Add feature to appropriate section (AI Tools vs Manual Tools)
- [ ] Update workflow best practices if needed
- [ ] Add troubleshooting steps for new feature
- [ ] Update keyboard shortcuts if applicable
- [ ] Bump version number in documentation
- [ ] Update "Last Updated" date
- [ ] Test tutorial flow end-to-end

---

## Image Generation Guidelines

When creating new tutorial images:

1. Use consistent Seeksy branding and colors
2. Show realistic interface states (not empty/placeholder content)
3. Highlight the feature being documented
4. Use 16:9 aspect ratio for consistency
5. Ensure text is readable at tutorial display size
6. Include relevant UI context (don't crop too tightly)

---

## Version Numbering

- **Major version (X.0)**: Complete redesign or major feature overhaul
- **Minor version (1.X)**: New features or significant improvements
- **Patch (1.1.X)**: Bug fixes, small copy updates, minor tweaks

Current version: **1.1**

---

## Contact for Updates

If you notice outdated documentation or have questions about maintaining tutorials:
- Email: hello@seeksy.io
- Project maintainer review required for major documentation changes
