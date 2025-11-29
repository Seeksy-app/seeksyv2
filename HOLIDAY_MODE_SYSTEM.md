# Holiday Mode System

## Overview
A modular, toggle-based system for seasonal holiday features that can be enabled/disabled instantly without code changes.

## Quick Toggle

**Location**: `src/config/holidayMode.ts`

```typescript
export const HOLIDAY_MODE = false; // Set to true to enable all holiday features
export const HOLIDAY_SNOW = false; // Optional snowfall effect
```

## Components

All holiday components live in `src/components/holiday/`:

### 1. HolidayWelcomeModal
- Displays on first login when Holiday Mode is enabled
- Uses transparent Santa Spark PNG with soft drop shadow
- One-time subtle wave animation on load (no looping)
- Welcome message: "Welcome to Seeksy! 🎄✨ I'm Santa Spark — your holiday guide..."
- Stores flag in localStorage to prevent repeat displays

### 2. SantaAssistantButton
- Floating bottom-right button with transparent Santa Spark
- Only visible when `HOLIDAY_MODE = true`
- No white background box — transparent with soft shadow only
- Subtle hover scale effect
- Opens SantaAssistantPopup on click

### 3. SantaAssistantPopup
- Modal with Santa greeting
- Quick action buttons:
  - Create Meeting
  - Add Podcast
  - Create Event
- Routes to corresponding pages when clicked

### 4. Snowfall (Optional)
- Controlled by separate `HOLIDAY_SNOW` toggle
- Subtle canvas-based snowfall effect
- Non-intrusive, doesn't block interactions
- Can be disabled while keeping Santa features active
- Optimized particle count based on screen size

## Integration

All holiday elements are conditionally rendered in `src/App.tsx`:

```tsx
{HOLIDAY_MODE && (
  <>
    <HolidayWelcomeModal />
    <SantaAssistantButton />
    {HOLIDAY_SNOW && <Snowfall />}
  </>
)}
```

## Design Principles

✅ **Modular**: All holiday code in dedicated folder  
✅ **Toggle-based**: Single config controls everything  
✅ **Clean**: No white boxes, transparent PNGs only  
✅ **Subtle**: One-time wave animation on load, no constant bouncing  
✅ **Non-invasive**: Soft shadows, doesn't interfere with main UI  
✅ **Performance**: Lightweight animations and effects  
✅ **Optional Snow**: Separate toggle for snowfall effect  
✅ **Zero Leftovers**: Complete removal when HOLIDAY_MODE = false  

## Assets

Holiday assets are located in `public/spark/holiday/`:
- `spark-santa-waving.png` - Primary Santa with wave gesture
- `spark-santa-idle.png` - Default Santa pose
- Additional dark mode variants available

All assets are transparent PNGs with no backgrounds.

## Usage

### To Enable Holiday Mode:
1. Open `src/config/holidayMode.ts`
2. Change `export const HOLIDAY_MODE = false;` to `true`
3. Optionally enable `HOLIDAY_SNOW = true` for snowfall
4. Save and refresh

### To Disable Holiday Mode:
1. Open `src/config/holidayMode.ts`
2. Change `export const HOLIDAY_MODE = true;` to `false`
3. Save and refresh

No other code changes required! When disabled, zero holiday elements render.

## Animations

- **Wave Animation**: One-time 1.2s wave gesture on modal load
- **Hover Effects**: Subtle scale transform on button hover
- **No Looping**: Animations play once, not continuously
- **Drop Shadows**: Soft shadows for depth without white boxes

## Testing Checklist

When `HOLIDAY_MODE = true`:
- ✅ Welcome modal appears on first login with wave animation
- ✅ Santa button visible in bottom-right corner
- ✅ No white boxes or backgrounds around Santa
- ✅ Soft drop shadows only
- ✅ Modal text matches holiday messaging
- ✅ Quick actions route correctly
- ✅ Snowfall appears if `HOLIDAY_SNOW = true`

When `HOLIDAY_MODE = false`:
- ✅ Zero holiday elements render
- ✅ No Santa anywhere in app
- ✅ No snowfall
- ✅ Clean standard UI

---

**Version**: 2.0 (Polished)  
**Last Updated**: 2025-01-29  
**Status**: Production-ready for seasonal activation
