#!/usr/bin/env python3
from pathlib import Path
import re
import shutil
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from rembg import remove, new_session

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_JS = ROOT / "products.js"
PRODUCT_ROOT = ROOT / "images" / "products"
OUT_ROOT = PRODUCT_ROOT / "standardized"

TARGET_SIZE = 1200
TARGET_PRODUCT_RATIO = 0.78

def product_images_from_products_js():
    text = PRODUCTS_JS.read_text(encoding="utf-8")
    blocks = re.findall(
        r'^\s*"[^"]+"\s*:\s*\{([\s\S]*?)(?=^\s*"[^"]+"\s*:\s*\{|^\};)',
        text,
        flags=re.MULTILINE,
    )
    paths = []
    for block in blocks:
        if re.search(r'category\s*:\s*"SCARPE"', block):
            m = re.search(r'image\s*:\s*"([^"]+)"', block)
            if m:
                paths.append(m.group(1))
    return list(dict.fromkeys(paths))

def make_background():
    w = h = TARGET_SIZE
    img = Image.new("RGBA", (w, h))
    px = img.load()

    for y in range(h):
        t = y / (h - 1)
        r = int(5 + 13 * t)
        g = int(5 + 9 * t)
        b = int(5 + 6 * t)
        for x in range(w):
            px[x, y] = (r, g, b, 255)

    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for radius in range(500, 20, -10):
        strength = (1 - radius / 500) ** 1.8
        alpha = int(78 * strength)
        gd.ellipse(
            (600 - radius, 735 - radius * 0.42,
             600 + radius, 735 + radius * 0.42),
            fill=(235, 78, 0, alpha),
        )
    glow = glow.filter(ImageFilter.GaussianBlur(42))
    img = Image.alpha_composite(img, glow)

    floor = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(floor)
    fd.ellipse((75, 745, 1125, 1250), fill=(17, 17, 17, 230))
    floor = floor.filter(ImageFilter.GaussianBlur(24))
    img = Image.alpha_composite(img, floor)

    # Subtle warm horizon band.
    band = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    bd.rectangle((0, 700, w, 790), fill=(180, 55, 0, 16))
    band = band.filter(ImageFilter.GaussianBlur(45))
    img = Image.alpha_composite(img, band)

    return img

def fit_product(cutout):
    bbox = cutout.getbbox()
    if not bbox:
        return None
    crop = cutout.crop(bbox)
    max_w = int(TARGET_SIZE * TARGET_PRODUCT_RATIO)
    max_h = int(TARGET_SIZE * 0.72)
    scale = min(max_w / crop.width, max_h / crop.height)
    nw = max(1, int(crop.width * scale))
    nh = max(1, int(crop.height * scale))
    return crop.resize((nw, nh), Image.Resampling.LANCZOS)

def process_one(source_path, session):
    rel = source_path.relative_to(ROOT)
    rel_from_products = source_path.relative_to(PRODUCT_ROOT)
    out_path = OUT_ROOT / rel_from_products
    out_path = out_path.with_suffix(".webp")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as src:
        src = ImageOps.exif_transpose(src).convert("RGBA")
        cutout = remove(src, session=session, alpha_matting=True)
        if not isinstance(cutout, Image.Image):
            cutout = Image.open(cutout).convert("RGBA")
        else:
            cutout = cutout.convert("RGBA")

    fitted = fit_product(cutout)
    if fitted is None:
        raise RuntimeError(f"Could not isolate product: {source_path}")

    canvas = make_background()

    # Ground shadow under the product, without changing the product itself.
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    cx = TARGET_SIZE // 2
    y = 760 + int(fitted.height * 0.34)
    sw = max(180, int(fitted.width * 0.38))
    sh = max(28, int(fitted.height * 0.10))
    sd.ellipse((cx - sw, y - sh, cx + sw, y + sh), fill=(0, 0, 0, 125))
    shadow = shadow.filter(ImageFilter.GaussianBlur(32))
    canvas = Image.alpha_composite(canvas, shadow)

    x = (TARGET_SIZE - fitted.width) // 2
    y = 690 - fitted.height // 2
    canvas.alpha_composite(fitted, (x, y))

    # Gentle vignette.
    vignette = Image.new("L", canvas.size, 0)
    vd = ImageDraw.Draw(vignette)
    vd.rectangle((0, 0, TARGET_SIZE, TARGET_SIZE), fill=120)
    vignette = vignette.filter(ImageFilter.GaussianBlur(170))
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    overlay.putalpha(vignette)
    canvas = Image.alpha_composite(canvas, overlay)

    canvas.convert("RGB").save(out_path, "WEBP", quality=94, method=6)
    return rel.as_posix(), out_path.relative_to(ROOT).as_posix()

def main():
    paths = product_images_from_products_js()
    if not paths:
        raise SystemExit("No SCARPE product images found in products.js")

    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    session = new_session("u2net")

    replacements = {}
    processed = 0
    for rel in paths:
        source = ROOT / rel
        if not source.exists():
            print(f"SKIP missing: {rel}")
            continue
        old_rel = Path(rel)
        new_rel = Path("images/products/standardized") / old_rel.relative_to("images/products")
        # process_one writes using the source-relative path below standardized/
        _, generated = process_one(source, session)
        replacements[rel] = generated
        processed += 1
        print(f"OK {rel} -> {generated}")

    # Point only the SCARPE products to the generated assets.
    text = PRODUCTS_JS.read_text(encoding="utf-8")
    for old, new in replacements.items():
        text = text.replace(f'image: "{old}"', f'image: "{new}"')
    PRODUCTS_JS.write_text(text, encoding="utf-8")

    print(f"Processed {processed}/{len(paths)} shoe images.")

if __name__ == "__main__":
    main()
