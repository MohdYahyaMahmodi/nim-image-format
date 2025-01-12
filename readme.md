# .nim Image Format

A lightweight, custom image format for storing RGBA pixel data with optional ICC profiles. The .nim (Nimble) format provides efficient storage through zlib compression while maintaining raw pixel fidelity.

## Features

- Raw RGBA pixel data storage
- zlib compression for efficient file size
- Optional ICC profile support
- Browser-based decoding with no server requirements
- Simple file format specification
- Flask-based web interface for conversion

## File Format Specification

The .nim format consists of:

1. **Header** (15 bytes):
   - Magic bytes (4 bytes): `4E 49 4D 00` ("NIM\0")
   - Version (1 byte): Current = 1
   - Width (4 bytes): Big-endian uint32
   - Height (4 bytes): Big-endian uint32
   - Channels (1 byte): Fixed at 4 (RGBA)
   - Has ICC (1 byte): 0 or 1

2. **ICC Profile** (optional):
   - ICC Length (4 bytes): Big-endian uint32
   - ICC Data (variable length)

3. **Pixel Data**:
   - zlib-compressed RGBA bytes
   - Raw size = width × height × 4 bytes

## Project Structure

```
nim-image-format/
├── static/
│   ├── nimview.js     # Browser-side .nim decoder
│   └── styles.css     # UI styling
├── templates/
│   └── index.html     # Web interface
├── app.py             # Flask server
├── nim_encoder.py     # .nim encoding logic
└── nimViewer.js       # Standalone .nim viewer
```

## Dependencies

- Python 3.x
- Flask
- Pillow (PIL)
- pako.js (client-side zlib)
- Font Awesome (UI icons)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MohdYahyaMahmodi/nim-image-format.git
   cd nim-image-format
   ```

2. Install Python dependencies:
   ```bash
   pip install flask pillow
   ```

## Usage

### Web Interface

1. Start the Flask server:
   ```bash
   python app.py
   ```

2. Visit `http://127.0.0.1:5000` in your browser
3. Use the web interface to:
   - Convert images to .nim format
   - Preview .nim files directly in the browser

### Command Line

Convert images using the encoder directly:

```bash
python nim_encoder.py input.png output.nim
```

### JavaScript Integration

#### Basic Canvas Rendering

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"></script>
<script src="nimViewer.js"></script>
<canvas id="myCanvas"></canvas>

<script>
  NIMViewer.loadNim('image.nim', document.getElementById('myCanvas'));
</script>
```

#### Custom Image Tag

```html
<img nim-src="image.nim" id="myNimImage" />

<script>
  // Auto-convert all nim-src images to canvas elements
  NIMViewer.autoRenderAll();
</script>
```

## API Reference

### Python: nim_encoder.py

```python
def encode_to_nim(image_bytes: bytes) -> bytes:
    """
    Convert an input image to .nim format.
    
    Args:
        image_bytes: Raw bytes of input image (PNG, JPG, etc.)
    
    Returns:
        Encoded .nim file as bytes
    """
```

### JavaScript: NIMViewer

```javascript
NIMViewer.decodeNim(arrayBuffer)
// Returns: { width, height, pixels: Uint8Array }

NIMViewer.loadNim(url, canvasElement)
// Loads and renders .nim to canvas

NIMViewer.autoRenderAll()
// Converts all <img nim-src="..."> to canvas
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement`)
3. Commit changes (`git commit -am 'Add enhancement'`)
4. Push to branch (`git push origin feature/enhancement`)
5. Create Pull Request

## License

This project is open source and available under the MIT License.

## Author

Mohd Yahya Mahmodi
- X (Twitter): [@mohdmahmodi](https://x.com/mohdmahmodi)
- GitHub: [@MohdYahyaMahmodi](https://github.com/MohdYahyaMahmodi)

## Acknowledgments

- pako.js for zlib compression
- Flask framework
- Pillow library for image processing