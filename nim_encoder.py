"""
nim_encoder.py

A standalone Python module that converts standard images (PNG/JPG/etc.)
into our custom ".nim" format, which stores:

- Raw RGBA pixel data
- Optional ICC profile
- Minimal header (magic, version, width, height, channels=4, hasICC)
- zlib-compressed pixel data

Usage:
  from nim_encoder import encode_to_nim
  nim_data = encode_to_nim(image_bytes)
"""

import struct
import zlib
from io import BytesIO
from PIL import Image

def encode_to_nim(image_bytes):
    """
    Convert an input image to .nim format.

    Steps:
    1) Open image with Pillow -> convert to RGBA
    2) Extract optional ICC profile (has_icc)
    3) zlib-compress the RGBA data
    4) Build the .nim file header + optional ICC chunk + compressed data
    """

    # 1. Open the input bytes as a Pillow image
    img = Image.open(BytesIO(image_bytes))
    img = img.convert("RGBA")  # enforce RGBA
    width, height = img.size

    # 2. Extract raw RGBA + ICC if present
    rgba_data = img.tobytes()
    icc_profile = img.info.get("icc_profile", None)
    has_icc = 1 if (icc_profile and len(icc_profile) > 0) else 0

    # 3. Compress the RGBA with zlib
    compressed_pixels = zlib.compress(rgba_data, level=9)

    # 4. Build the .nim
    magic = b"NIM\0"       # 4 bytes
    version = struct.pack("B", 1)  # 1 byte
    w_bytes = struct.pack(">I", width)   # 4 bytes, big-endian
    h_bytes = struct.pack(">I", height)  # 4 bytes, big-endian
    channels_byte = struct.pack("B", 4)  # RGBA = 4 channels
    has_icc_byte = struct.pack("B", has_icc)

    header = magic + version + w_bytes + h_bytes + channels_byte + has_icc_byte

    # If has_icc == 1, store icc_len + icc_data
    icc_chunk = b""
    if has_icc == 1:
        icc_len = len(icc_profile)
        icc_chunk = struct.pack(">I", icc_len) + icc_profile

    nim_data = header + icc_chunk + compressed_pixels
    return nim_data


def main():
    """
    Example CLI usage:
      python nim_encoder.py input.png output.nim
    """
    import sys
    if len(sys.argv) < 3:
        print("Usage: python nim_encoder.py <input_image> <output.nim>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    with open(input_path, "rb") as f_in:
        image_bytes = f_in.read()

    nim_bytes = encode_to_nim(image_bytes)

    with open(output_path, "wb") as f_out:
        f_out.write(nim_bytes)

    print(f"Encoded {input_path} -> {output_path}")

if __name__ == "__main__":
    main()
