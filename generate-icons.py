"""
生成 Tauri 所需的全部图标格式
用法（在项目根目录）：python generate-icons.py
依赖：pip install Pillow
"""
from PIL import Image
import os, sys

SRC = os.path.join(os.path.dirname(__file__), "public", "images", "logo.png")
DST = os.path.join(os.path.dirname(__file__), "src-tauri", "icons")

if not os.path.exists(SRC):
    sys.exit(f"找不到源图片：{SRC}")

img = Image.open(SRC).convert("RGBA")
print(f"源图尺寸：{img.size[0]}×{img.size[1]}")

# ── PNG 尺寸 ────────────────────────────────────────────────────────
png_sizes = {
    "32x32.png":      (32,  32),
    "128x128.png":    (128, 128),
    "128x128@2x.png": (256, 256),
    "icon.png":       (512, 512),
}
for name, size in png_sizes.items():
    out = img.resize(size, Image.LANCZOS)
    out.save(os.path.join(DST, name), "PNG")
    print(f"  ✓ {name}")

# ── Windows .ico（多尺寸合并）────────────────────────────────────────
ico_sizes = [(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)]
ico_imgs  = [img.resize(s, Image.LANCZOS) for s in ico_sizes]
ico_path  = os.path.join(DST, "icon.ico")
ico_imgs[0].save(ico_path, format="ICO", sizes=ico_sizes,
                 append_images=ico_imgs[1:])
print(f"  ✓ icon.ico")

# ── macOS .icns（需要 icnsutil，仅 macOS 可用，跳过则无影响）────────
try:
    import subprocess, tempfile, shutil
    tmp = tempfile.mkdtemp(suffix=".iconset")
    icns_map = {
        "icon_16x16.png":      (16,  16),
        "icon_16x16@2x.png":   (32,  32),
        "icon_32x32.png":      (32,  32),
        "icon_32x32@2x.png":   (64,  64),
        "icon_128x128.png":    (128, 128),
        "icon_128x128@2x.png": (256, 256),
        "icon_256x256.png":    (256, 256),
        "icon_256x256@2x.png": (512, 512),
        "icon_512x512.png":    (512, 512),
        "icon_512x512@2x.png": (1024,1024),
    }
    for name, size in icns_map.items():
        img.resize(size, Image.LANCZOS).save(os.path.join(tmp, name), "PNG")
    icns_path = os.path.join(DST, "icon.icns")
    subprocess.run(["iconutil", "-c", "icns", tmp, "-o", icns_path], check=True)
    shutil.rmtree(tmp)
    print(f"  ✓ icon.icns")
except Exception:
    print(f"  - icon.icns 跳过（仅 macOS 支持，Windows 打包不受影响）")

print("\n完成！运行 npm run tauri:build 重新打包即可。")
