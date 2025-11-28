# Seeksy Spark Assets Inventory

## Base Character Assets (Light Mode)
Location: `public/spark/base/`

✅ `spark-idle.png` - Neutral standing pose, friendly expression
✅ `spark-happy.png` - Excited expression with sparkles, arms raised
✅ `spark-thinking.png` - Thoughtful pose, hand on chin, tilted head
✅ `spark-waving.png` - Friendly wave gesture
✅ `spark-idea.png` - Holding lightbulb, excited "eureka" moment
✅ `spark-typing.png` - Typing on laptop, focused expression

## Dark Mode Variants
Location: `public/spark/dark/`

✅ `spark-idle-dark.png` - Idle pose with blue AI glow outline
✅ `spark-happy-dark.png` - Happy pose with enhanced glow
✅ `spark-thinking-dark.png` - Thinking pose with blue glow
✅ `spark-waving-dark.png` - Waving with enhanced visibility
✅ `spark-idea-dark.png` - Idea pose with glowing lightbulb
✅ `spark-typing-dark.png` - Typing with laptop glow effect

## Holiday Variants (Santa Mode)
Location: `public/spark/holiday/`

✅ `spark-santa-idle.png` - Idle with Santa hat (light mode)
✅ `spark-santa-waving.png` - Waving with Santa hat (light mode)
✅ `spark-santa-idle-dark.png` - Santa idle with blue glow (dark mode)
✅ `spark-santa-waving-dark.png` - Santa waving with glow (dark mode)

## Mini Icons
Location: `public/spark/icons/`

✅ `spark-icon-32.png` - 32px icon (simplified face only)
✅ `spark-icon-20.png` - 20px icon (minimal features)
✅ `spark-icon-16.png` - 16px icon (ultra-simplified)
✅ `spark-santa-icon.png` - 32px holiday icon with Santa hat

---

## Usage Guidelines

### Base Assets (512×512px)
- Use for main UI elements, chat avatars, help dialogs
- Import as ES6 modules: `import sparkIdle from '/spark/base/spark-idle.png'`
- Transparent background (PNG format)

### Dark Mode Assets
- Automatically use when `data-theme="dark"` is detected
- Enhanced blue glow (#52A7FF) for visibility on dark backgrounds
- Same poses as light mode variants

### Holiday Assets (Nov 28 - Dec 31)
- Automatically activate during holiday period
- Can be manually enabled/disabled in user preferences
- Santa hat variants for festive branding

### Icons
- Generated at 512px resolution for crisp downscaling
- Use CSS to scale to target sizes (16px, 20px, 32px)
- Optimized for sidebar, inline UI, and buttons

---

## Color Specifications

- **Primary Yellow**: #F9D54A
- **Primary Gold**: #F7A928
- **Outline Brown**: #7A4A25
- **Eye Brown**: #3A2D1E
- **Cheek Blush Pink**: #F3A6A0
- **AI Glow Blue**: #52A7FF (dark mode only)

---

## Next Steps

Ready for integration! Assets are prepared for:
1. React component library (`src/components/spark/`)
2. Sidebar navigation icon
3. AI chat widget avatar
4. Help tooltips and empty states
5. Seasonal holiday theming

---

Generated: 2025-11-28
Character Guide: SEEKSY_SPARK_CHARACTER_BIBLE.md
