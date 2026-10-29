"""Sample the user's existing alpha cutout into character levels; never redraw it.

Optional authoring dependencies: numpy, Pillow. These are not website dependencies.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

assets = Path(__file__).resolve().parents[1] / 'assets'
width, height = 640, 326
image = Image.open(assets / 'luffy-source.png').convert('RGBA')
original = np.asarray(image)
white = ((original[:, :, :3].mean(axis=2) > 170) & (original[:, :, 3] > 200)).astype(np.uint8)
speech = Image.new('L', image.size, 0)
for seed in [(900, 60), (170, 740)]:
    component_image = Image.fromarray(white.copy()).copy()
    assert component_image.getpixel(seed) == 1, 'Speech balloon seed must be in its white interior'
    ImageDraw.floodfill(component_image, seed, 255)
    component = np.asarray(component_image) == 255
    holes = Image.fromarray((~component).astype(np.uint8) * 255).copy()
    edges = [(x, y) for x in range(image.width) for y in (0, image.height - 1)]
    edges += [(x, y) for y in range(image.height) for x in (0, image.width - 1)]
    for edge in edges:
        if holes.getpixel(edge) == 255:
            ImageDraw.floodfill(holes, edge, 128)
    filled = component | (np.asarray(holes) == 255)
    region = Image.fromarray(filled.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))
    box = region.getbbox()
    assert box and box[2] - box[0] < image.width * .5 and box[3] - box[1] < image.height * .5, 'Speech mask leaked outside balloon'
    speech = Image.fromarray(np.maximum(np.asarray(speech), np.asarray(region)))
rgba = np.asarray(image.resize((width, height), Image.Resampling.LANCZOS), dtype=float)
lum = rgba[:, :, :3] @ [.299, .587, .114]
levels = np.clip(np.rint(np.power(1 - lum / 255, .72) * 14) + 1, 1, 15).astype(int)
levels[rgba[:, :, 3] < 24] = 0
levels[(rgba[:, :, 3] < 150) & (levels < 3)] = 0
mask = np.asarray(speech.resize((width, height), Image.Resampling.NEAREST)) > 127
data = {'width': width, 'height': height, 'levels': ''.join(format(n, 'x') for n in levels.flat),
        'speechMask': ''.join('1' if value else '0' for value in mask.flat)}
(assets / 'portrait.json').write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8')
print(f'Sampled {width * height} character cells; {mask.sum()} speech cells; source image unchanged.')
