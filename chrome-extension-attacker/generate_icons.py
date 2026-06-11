"""Generate PNG icons for the Chrome extension at 16x48x128px sizes."""
import struct
import zlib
from pathlib import Path


def make_png(size: int) -> bytes:
    """Create a minimal PNG: dark navy background with a gold sword glyph."""
    bg = (22, 33, 62)      # #16213e
    gold = (240, 192, 64)  # #f0c040

    pixels = []
    cx, cy = size // 2, size // 2
    sw = max(1, size // 10)  # sword width
    sh = int(size * 0.55)    # sword height (blade)

    for y in range(size):
        for x in range(size):
            dx, dy = x - cx, y - cy
            # Blade: vertical bar from top
            on_blade = abs(dx) <= sw and -sh // 2 <= dy <= sh // 2
            # Guard: horizontal bar across center
            on_guard = abs(dy) <= sw and abs(dx) <= size // 3
            # Handle: short bar below guard
            on_handle = abs(dx) <= sw and sh // 2 < dy <= sh // 2 + size // 5
            if on_blade or on_guard or on_handle:
                pixels.append(gold)
            else:
                pixels.append(bg)

    def pack_chunk(chunk_type: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(chunk_type + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + chunk_type + data + struct.pack(">I", crc)

    # PNG signature
    sig = b"\x89PNG\r\n\x1a\n"

    # IHDR
    ihdr_data = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    ihdr = pack_chunk(b"IHDR", ihdr_data)

    # IDAT — raw image data, one filter byte (0) per row
    raw_rows = []
    for row_idx in range(size):
        row_pixels = pixels[row_idx * size : (row_idx + 1) * size]
        row_bytes = b"\x00" + b"".join(bytes(p) for p in row_pixels)
        raw_rows.append(row_bytes)
    compressed = zlib.compress(b"".join(raw_rows), 9)
    idat = pack_chunk(b"IDAT", compressed)

    # IEND
    iend = pack_chunk(b"IEND", b"")

    return sig + ihdr + idat + iend


if __name__ == "__main__":
    icons_dir = Path(__file__).parent / "icons"
    icons_dir.mkdir(exist_ok=True)
    for size in (16, 48, 128):
        path = icons_dir / f"icon{size}.png"
        path.write_bytes(make_png(size))
        print(f"  Created {path} ({size}x{size})")
    print("Icons generated.")
