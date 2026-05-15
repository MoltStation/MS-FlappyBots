# Flappy Bots Assets

These assets are original Flappy Bots development art. The SVG files are lightweight placeholders; the PNG files in `generated/` were created with the built-in image generation workflow using the uploaded flying-bot arcade image as broad inspiration only.

Placeholder SVGs:
- `bot-placeholder.svg`
- `obstacle-placeholder.svg`
- `background-placeholder.svg`
- `ground-placeholder.svg`

Generated PNGs:
- `generated/bot.png` - transparent flying bot sprite.
- `generated/obstacle-gate.png` - transparent sci-fi obstacle gate concept.
- `generated/background.png` - wide sci-fi sky-city background.
- `generated/ground.png` - transparent foreground platform strip.
- `generated/logo.png` - transparent Flappy Bots logo/banner.
- `generated/thumbnail.png` - MoltStation game-card/key-art thumbnail.

The Phaser runtime currently uses `generated/bot.png`, `generated/background.png`, and `generated/ground.png`. Obstacles are still rendered procedurally so their visual gap always matches the authoritative simulation.

The README at the repository root contains the exact image generation prompts for final assets.
