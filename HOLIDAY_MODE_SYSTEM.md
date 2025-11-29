# Holiday Mode System

## Overview
A modular, toggle-based system for seasonal holiday features that can be enabled/disabled instantly without code changes.

## Quick Toggle

**Location**: `src/config/holidayMode.ts`

```typescript
export const HOLIDAY_MODE = false; // Set to true to enable all holiday features
```

## Components

All holiday components live in `src/components/holiday/`:

### 1. HolidayWelcomeModal
- Displays on first login when Holiday Mode is enabled
- Uses Santa Spark image from `/spark/holiday/spark-santa-waving.png`
- Welcome message: "You're about to build your presence..."
- Stores flag in localStorage to prevent repeat displays

### 2. SantaAssistantButton
- Floating bottom-right button with Santa Spark
- Only visible when `HOLIDAY_MODE = true`
- Opens SantaAssistantPopup on click
- Clean circular button with hover scale effect

### 3. SantaAssistantPopup
- Modal with friendly greeting
- Quick action buttons:
  - Create Meeting
  - Add Podcast
  - Create Event
- Routes to corresponding pages when clicked

### 4. Snowfall
- Subtle canvas-based snowfall effect
- Non-intrusive, doesn't block interactions
- Optimized particle count based on screen size
- Automatically manages resize and cleanup

## Integration

All holiday elements are conditionally rendered in `src/App.tsx`:

```tsx
{HOLIDAY_MODE && (
  <>
    <HolidayWelcomeModal />
    <SantaAssistantButton />
    <Snowfall />
  </>
)}
```

## Design Principles

✅ **Modular**: All holiday code in dedicated folder  
✅ **Toggle-based**: Single config controls everything  
✅ **Clean**: No holiday logic in core components  
✅ **Non-invasive**: Doesn't interfere with main UI  
✅ **Performance**: Lightweight animations and effects  
✅ **Maintainable**: Easy to enable/disable year-round  

## Assets

Holiday assets are located in `public/spark/holiday/`:
- `spark-santa-waving.png` (light mode)
- `spark-santa-waving-dark.png` (dark mode)
- `spark-santa-idle.png`
- `spark-santa-idle-dark.png`

## Usage

### To Enable Holiday Mode:
1. Open `src/config/holidayMode.ts`
2. Change `export const HOLIDAY_MODE = false;` to `true`
3. Save and refresh

### To Disable Holiday Mode:
1. Open `src/config/holidayMode.ts`
2. Change `export const HOLIDAY_MODE = true;` to `false`
3. Save and refresh

No other code changes required!

## Future Enhancements

Potential additions (when HOLIDAY_MODE = true):
- Holiday-themed color accents
- Special holiday greetings in AI chat
- Seasonal dashboard widgets
- Holiday-specific email templates

---

**Version**: 1.0  
**Last Updated**: 2025-01-29  
**Status**: Ready for seasonal activation
