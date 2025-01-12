// nimViewer.js
// A standalone script to decode .nim data in the browser, then draw it to a <canvas>.
// Dependencies: pako.js (for zlib inflate).
//
// Usage example (HTML):
// <script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"></script>
// <script src="nimViewer.js"></script>
// <canvas id="myCanvas"></canvas>
// <script>
//   NIMViewer.loadNim('path/to/myimage.nim', document.getElementById('myCanvas'));
// </script>

// or 
// <img nim-src="path/to/myimage.nim" id="myNimImage" />

(function (global) {

  /**
   * decodeNim()
   * 
   * Takes an ArrayBuffer (the raw .nim bytes).
   * Returns { width, height, pixels (Uint8Array of RGBA) } if successful.
   * Throws Error otherwise.
   */
  function decodeNim(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    let offset = 0;

    // Magic check: "NIM\0"
    const magic = new Uint8Array(arrayBuffer.slice(offset, offset + 4));
    offset += 4;
    if (magic[0] !== 0x4E || magic[1] !== 0x49 || magic[2] !== 0x4D || magic[3] !== 0x00) {
      throw new Error("Invalid .nim magic bytes.");
    }

    // Version
    const version = dataView.getUint8(offset); 
    offset += 1;
    if (version !== 1) {
      throw new Error(`Unsupported .nim version: ${version}`);
    }

    // Width, Height (big-endian)
    const width = dataView.getUint32(offset, false);
    offset += 4;
    const height = dataView.getUint32(offset, false);
    offset += 4;

    // Channels
    const channels = dataView.getUint8(offset);
    offset += 1;
    if (channels !== 4) {
      throw new Error(`.nim only supports RGBA(4). This file has channels=${channels}.`);
    }

    // hasICC
    const hasICC = dataView.getUint8(offset);
    offset += 1;
    if (hasICC === 1) {
      // read ICC length
      const iccLen = dataView.getUint32(offset, false);
      offset += 4;
      offset += iccLen; 
      // (We skip it in the browser decode.)
    }

    // The remainder is zlib-compressed RGBA
    const compressed = new Uint8Array(arrayBuffer, offset);
    if (!compressed.length) {
      throw new Error("No compressed data found in .nim.");
    }

    let rgba;
    try {
      // pako.inflate returns a Uint8Array
      rgba = pako.inflate(compressed);
    } catch (err) {
      throw new Error(`Zlib inflation failed: ${err.message}`);
    }

    // Check length
    if (rgba.length !== width * height * 4) {
      throw new Error(`Mismatch in pixel data. Got ${rgba.length} bytes, expected ${width*height*4}.`);
    }

    return {
      width,
      height,
      pixels: rgba // RGBA
    };
  }

  /**
   * loadNim()
   * 
   * 1) Fetch .nim from a URL
   * 2) decodeNim
   * 3) Draw to a specified <canvas>
   */
  async function loadNim(url, canvasElem) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch .nim from: ${url}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    const decoded = decodeNim(arrayBuffer);
    // Create a 2D canvas
    canvasElem.width = decoded.width;
    canvasElem.height = decoded.height;

    const ctx = canvasElem.getContext("2d");
    // Build ImageData
    const imageData = new ImageData(
      new Uint8ClampedArray(decoded.pixels.buffer),
      decoded.width,
      decoded.height
    );
    ctx.putImageData(imageData, 0, 0);
  }


  /**
   * autoRenderAll()
   * 
   * If we want a custom <img nim-src="..."> approach:
   * - Find all <img nim-src="...">
   * - For each, create a <canvas> behind the scenes
   * - Load the .nim, decode, draw, then replace the <img> with the <canvas>
   */
  async function autoRenderAll() {
    const nimImages = document.querySelectorAll('img[nim-src]');
    for (let imgEl of nimImages) {
      try {
        const url = imgEl.getAttribute('nim-src');
        // Create a new canvas
        const canvas = document.createElement('canvas');
        // Optional: copy some attributes (like width/height if set)
        canvas.style.border = '1px solid #ccc';

        // Fetch + decode
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
        const arrayBuffer = await res.arrayBuffer();

        const decoded = decodeNim(arrayBuffer);
        canvas.width = decoded.width;
        canvas.height = decoded.height;

        const ctx = canvas.getContext("2d");
        const imageData = new ImageData(
          new Uint8ClampedArray(decoded.pixels.buffer),
          decoded.width,
          decoded.height
        );
        ctx.putImageData(imageData, 0, 0);

        // Replace the <img> with <canvas>
        imgEl.parentNode.replaceChild(canvas, imgEl);
      } catch (err) {
        console.error("autoRenderAll error: ", err);
      }
    }
  }

  // Expose these globally
  global.NIMViewer = {
    decodeNim,
    loadNim,
    autoRenderAll
  };

})(window);
