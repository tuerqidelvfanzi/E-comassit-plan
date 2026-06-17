"""Generate extension/icons/icon{16,48,128}.png — requires Pillow."""
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit('pip install pillow')

out = Path(__file__).resolve().parent.parent / 'extension' / 'icons'
out.mkdir(parents=True, exist_ok=True)
color = (37, 99, 235)
for size in (16, 48, 128):
    Image.new('RGB', (size, size), color).save(out / f'icon{size}.png')
print('Wrote', out)
