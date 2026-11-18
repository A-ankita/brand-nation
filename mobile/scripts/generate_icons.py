#!/usr/bin/env python3
"""Create Brand Nation Android launcher and iOS app icons from the original logo."""
from pathlib import Path
from PIL import Image, ImageOps
import io
logo=Image.open("www/brand-nation-logo.webp").convert("RGBA")
# Preserve the original artwork, center it with padding on a dark square.
def icon(size):
    bg=Image.new("RGBA",(size,size),(23,21,19,255))
    image=logo.copy()
    image.thumbnail((round(size*.84),round(size*.84)),Image.Resampling.LANCZOS)
    bg.alpha_composite(image,((size-image.width)//2,(size-image.height)//2))
    return bg.convert("RGB")
android=Path("android/app/src/main/res")
for folder,size in [("mipmap-mdpi",48),("mipmap-hdpi",72),("mipmap-xhdpi",96),("mipmap-xxhdpi",144),("mipmap-xxxhdpi",192)]:
    d=android/folder
    d.mkdir(parents=True,exist_ok=True)
    for filename in ["ic_launcher.png","ic_launcher_round.png","ic_launcher_foreground.png"]:
        icon(size).save(d/filename)
# Remove generated adaptive-icon XML referencing a default background.
for folder in ["mipmap-anydpi-v26"]:
    d=android/folder
    if d.exists():
        for p in d.glob("ic_launcher*.xml"):p.unlink()
ios=Path("ios/App/App/Assets.xcassets/AppIcon.appiconset")
if ios.exists():
    # Capacitor 7 creates a single universal 1024px icon.
    for p in ios.glob("*.png"):
        icon(1024).save(p)
print("Brand Nation native app icons generated from official logo")
