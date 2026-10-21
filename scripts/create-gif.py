import os
import glob
from PIL import Image

def make_gif():
    frame_files = sorted(glob.glob("docs/showcase/frames/frame_*.png"))
    if not frame_files:
        print("No frames found!")
        return

    print(f"Loading {len(frame_files)} frames...")
    images = []
    for f in frame_files:
        img = Image.open(f)
        # Quantize to 128 colors for optimal GIF size and crisp pixel rendering
        img_quantized = img.convert("P", palette=Image.ADAPTIVE, colors=128)
        images.append(img_quantized)

    output_path = "docs/showcase/intro-tmec-showcase.gif"
    # 85ms per frame = ~12 fps
    images[0].save(
        output_path,
        save_all=True,
        append_images=images[1:],
        duration=85,
        loop=0,
        optimize=True
    )
    print(f"GIF successfully created: {output_path} (Size: {os.path.getsize(output_path) / 1024:.1f} KB)")

if __name__ == "__main__":
    make_gif()
