"""Generate Cam Pong app icons (PWA + iOS sizes)."""
from PIL import Image, ImageDraw, ImageFilter

BASE = 1024
img = Image.new("RGB", (BASE, BASE), "#050510")
d = ImageDraw.Draw(img)

# subtle vertical gradient
for y in range(BASE):
    t = abs(y - BASE / 2) / (BASE / 2)
    c = int(10 + 14 * (1 - t))
    d.line([(0, y), (BASE, y)], fill=(c, c, int(c * 2.4)))

def glow_rect(box, color, radius, blur):
    layer = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle(box, radius=radius, fill=color)
    img.paste(Image.alpha_composite(img.convert("RGBA"),
              layer.filter(ImageFilter.GaussianBlur(blur))).convert("RGB"), (0, 0))
    ld2 = ImageDraw.Draw(img)
    ld2.rounded_rectangle(box, radius=radius, fill=color)

def glow_ball(cx, cy, r, color, blur):
    layer = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.ellipse([cx - r * 2, cy - r * 2, cx + r * 2, cy + r * 2], fill=color + (110,))
    img.paste(Image.alpha_composite(img.convert("RGBA"),
              layer.filter(ImageFilter.GaussianBlur(blur))).convert("RGB"), (0, 0))
    ld2 = ImageDraw.Draw(img)
    ld2.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)

# center dashed line
for x in range(60, BASE - 40, 90):
    d.line([(x, BASE // 2), (x + 45, BASE // 2)], fill=(70, 110, 150), width=8)

glow_rect([312, 118, 712, 168], "#ff44aa", 25, 30)   # top paddle (magenta)
glow_rect([312, 856, 712, 906], "#00ffff", 25, 30)   # bottom paddle (cyan)
glow_ball(512, 470, 52, (255, 255, 255), 40)         # ball

# ball trail
for i, (ty, tr, ta) in enumerate([(580, 38, 90), (672, 28, 55), (748, 20, 30)]):
    layer = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse([512 - tr, ty - tr, 512 + tr, ty + tr],
                                  fill=(140, 240, 255, ta))
    img = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")

for size, name in [(1024, "icon-1024.png"), (512, "icon-512.png"),
                   (192, "icon-192.png"), (180, "icon-180.png")]:
    img.resize((size, size), Image.LANCZOS).save(name)
    print("wrote", name)
