#!/usr/bin/env python3
"""
Derives the app's Expo icon and splash assets from the artwork in assets/ios, assets/android and
assets/splash.mp4. Run (needs Pillow and ffmpeg): python3 scripts/build-app-assets.py

  assets/icon.png                     1024 full-bleed, opaque (iOS applies its own corner mask)
  assets/android-icon-background.png  blurred enlargement of the artwork (adaptive background)
  assets/android-icon-foreground.png  the artwork as a rounded tile inside the adaptive safe zone
  assets/android-icon-monochrome.png  glyph-only silhouette for themed icons
  assets/favicon.png                  48 px web icon
  assets/splash-frame.png             first video frame, used as the native splash so the video starts seamlessly

The files in assets/ios and assets/android are the supplied originals and are left untouched.
"""
import subprocess
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = 'assets/ios/iTunesArtwork@2x.png'  # 1024, opaque, rounded art on a near-white margin
MONO = 'assets/android/mipmap-xxxhdpi/ic_launcher_monochrome.png'


def is_white(px, tol=26):
    return all(abs(a - b) <= tol for a, b in zip(px[:3], (248, 249, 253)))


def art_box(im):
    w, h = im.size
    left = next(x for x in range(w) if not is_white(im.getpixel((x, h // 2))))
    top = next(y for y in range(h) if not is_white(im.getpixel((w // 2, y))))
    right = w - next(x for x in range(w) if not is_white(im.getpixel((w - 1 - x, h // 2))))
    bottom = h - next(y for y in range(h) if not is_white(im.getpixel((w // 2, h - 1 - y))))
    return left, top, right, bottom


def full_bleed(im):
    """Crop to the artwork, then inset just enough that the rounded corners are gone."""
    l, t, r, b = art_box(im)
    inset = 0
    while any(is_white(im.getpixel(p)) for p in ((l + inset + 2, t + inset + 2), (r - inset - 3, t + inset + 2), (l + inset + 2, b - inset - 3), (r - inset - 3, b - inset - 3))):
        inset += 1
    return im.crop((l + inset, t + inset, r - inset, b - inset))


art = Image.open(SRC).convert('RGB')
bleed = full_bleed(art)
icon = bleed.resize((1024, 1024), Image.LANCZOS)
icon.save('assets/icon.png')
icon.resize((48, 48), Image.LANCZOS).save('assets/favicon.png')

# Android adaptive icon: background = blurred enlargement, foreground = rounded tile in the safe zone.
bg = bleed.resize((512, 512), Image.LANCZOS).filter(ImageFilter.GaussianBlur(40))
bg = bg.resize((1024, 1024), Image.LANCZOS).crop((256, 256, 768, 768)).resize((512, 512), Image.LANCZOS)
bg.save('assets/android-icon-background.png')

tile = bleed.resize((340, 340), Image.LANCZOS).convert('RGBA')
mask = Image.new('L', tile.size, 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, tile.size[0] - 1, tile.size[1] - 1), radius=72, fill=255)
tile.putalpha(mask)
fg = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
fg.alpha_composite(tile, ((512 - 340) // 2, (512 - 340) // 2))
fg.save('assets/android-icon-foreground.png')

# Themed (monochrome) icon: the supplied file is a white square holding a black rounded tile with a white
# glyph, so its own alpha is useless. Keep only the glyph (white inside the tile) as the alpha channel.
mono = Image.open(MONO).convert('RGBA')
flat = Image.new('RGBA', mono.size, (255, 255, 255, 255))
flat.alpha_composite(mono)  # transparent margin counts as white, not black
luma = flat.convert('L')
dark = luma.point(lambda v: 255 if v < 70 else 0)
l, t, r, b = dark.getbbox()
tile_mask = Image.new('L', mono.size, 0)
ImageDraw.Draw(tile_mask).rounded_rectangle((l, t, r - 1, b - 1), radius=round(0.2 * (r - l)), fill=255)
alpha = ImageChops.multiply(luma.point(lambda v: 0 if v < 70 else min(255, (v - 70) * 3)), tile_mask)
alpha = alpha.crop((l, t, r, b))
glyph_box = alpha.point(lambda v: 255 if v > 60 else 0).getbbox()
glyph = alpha.crop(glyph_box)
scale = 0.6 * 432 / max(glyph.size)
glyph = glyph.resize((round(glyph.size[0] * scale), round(glyph.size[1] * scale)), Image.LANCZOS)
out = Image.new('RGBA', (432, 432), (0, 0, 0, 0))
black = Image.new('RGBA', glyph.size, (0, 0, 0, 255))
black.putalpha(glyph)
out.alpha_composite(black, ((432 - glyph.size[0]) // 2, (432 - glyph.size[1]) // 2))
out.save('assets/android-icon-monochrome.png')

subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'assets/splash.mp4', '-frames:v', '1', 'assets/splash-frame.png'], check=True)
print('done')
