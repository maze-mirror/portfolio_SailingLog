"""Sample the supplied second portrait into navy character data; keep original JPEG untouched."""
from pathlib import Path
from collections import deque
import json
import numpy as np
from PIL import Image

assets = Path(__file__).resolve().parents[1] / 'assets'
image = Image.open(assets / 'luffy-alternate-source.jpg').convert('RGB')
rgb = np.asarray(image)
h, w = rgb.shape[:2]
# Ignore only the edge-connected white page and black lower backdrop in sampled data.
# Enclosed white hair and the hand crossing the backdrop remain part of the portrait.
white = rgb.min(axis=2) > 242
black_backdrop = (rgb.max(axis=2) < 70) & (np.indices((h, w))[0] >= int(h * .79))
background = np.zeros((h, w), dtype=bool)
for candidate in (white, black_backdrop):
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()
    for x, y in [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]:
        if candidate[y, x] and not visited[y, x]:
            visited[y, x] = True
            queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= nx < w and 0 <= ny < h and candidate[ny,nx] and not visited[ny,nx]:
                visited[ny,nx] = True
                queue.append((nx,ny))
    background |= visited
    if candidate is black_backdrop:
        # Exclude the JPEG's three-pixel gray fringe above its black rectangular backdrop.
        background[:-3] |= visited[3:]
width = 640
height = round(width * h / w * .52)
scaled = np.asarray(image.resize((width,height),Image.Resampling.LANCZOS),dtype=float)
mask = np.asarray(Image.fromarray((~background).astype(np.uint8)*255).resize((width,height),Image.Resampling.NEAREST)) > 127
lum = scaled @ [.299,.587,.114]
levels = np.clip(np.rint(np.power(1-lum/255,.72)*14)+1,1,15).astype(int)
levels[~mask] = 0
# JPEG compression near blank edges should not leave a rectangular haze.
levels[(lum > 245) & ~mask] = 0
data = {'width':width,'height':height,'aspectRatio':w/h,
        'levels':''.join(format(n,'x') for n in levels.flat),'speechMask':'0'*(width*height)}
(assets/'portrait-alternate.json').write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
print(f'Sampled second portrait: {width}x{height}, foreground {mask.sum()} cells; original JPEG unchanged.')
