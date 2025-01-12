/* nimview.js
 *
 * A standalone script to decode .nim image format in the browser:
 *   - No server calls required for decoding.
 *   - Uses pako.js for zlib inflation.
 *   - Renders raw RGBA onto a <canvas>.
 *
 * Dependencies:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"></script>
 *
 * In index.html, we attach a form (#previewForm) and canvas (#nimCanvas).
 */

(function(){
  // Utility function: decode .nim from ArrayBuffer
  function decodeNim(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    let offset = 0;

    // 1. Check magic "NIM\0"
    const magic = new Uint8Array(arrayBuffer.slice(offset, offset+4));
    offset += 4;
    if (magic[0] !== 0x4E || magic[1] !== 0x49 || magic[2] !== 0x4D || magic[3] !== 0x00) {
      throw new Error("Invalid magic bytes (not a .nim).");
    }

    // 2. version
    const version = dataView.getUint8(offset);
    offset += 1;
    if (version !== 1) {
      throw new Error(`Unsupported .nim version: ${version}`);
    }

    // 3. width, height (big-endian)
    const width = dataView.getUint32(offset, false);
    offset += 4;
    const height = dataView.getUint32(offset, false);
    offset += 4;

    // 4. channels (expect 4 = RGBA)
    const channels = dataView.getUint8(offset);
    offset += 1;
    if (channels !== 4) {
      throw new Error(`.nim channels = ${channels}, but we only handle RGBA(4).`);
    }

    // 5. hasICC
    const hasICC = dataView.getUint8(offset);
    offset += 1;
    if (hasICC === 1) {
      // read iccLen
      const iccLen = dataView.getUint32(offset, false);
      offset += 4;
      // skip ICC data
      offset += iccLen;
    }

    // 6. The rest = zlib-compressed RGBA
    const compressed = new Uint8Array(arrayBuffer, offset);
    if (!compressed.length) {
      throw new Error("No pixel data found in .nim.");
    }

    // 7. Decompress with pako
    let rgba;
    try {
      rgba = pako.inflate(compressed); // returns a Uint8Array
    } catch (err) {
      throw new Error("zlib inflate failed: " + err.message);
    }

    const expectedLen = width * height * 4;
    if (rgba.length !== expectedLen) {
      throw new Error(`Decompressed pixel mismatch. Got ${rgba.length}, expected ${expectedLen}.`);
    }

    return { width, height, pixels: rgba };
  }


  // Attach event listener for #previewForm to decode .nim client-side
  document.addEventListener("DOMContentLoaded", () => {
    const previewForm = document.getElementById("previewForm");
    const previewBtn = document.getElementById("previewBtn");
    const previewError = document.getElementById("previewError");
    const previewContainer = document.getElementById("previewContainer");
    const nimCanvas = document.getElementById("nimCanvas");

    if (!previewForm) return; // in case there's no form

    previewForm.addEventListener("submit", async (evt) => {
      evt.preventDefault();

      // Hide old error/preview
      previewError.classList.add("hidden");
      previewContainer.classList.add("hidden");

      const fileInput = document.getElementById("nimPreviewFile");
      if (!fileInput.files.length) {
        previewError.textContent = "Please select a .nim file first.";
        previewError.classList.remove("hidden");
        return;
      }

      // Feedback
      const originalText = previewBtn.textContent;
      previewBtn.disabled = true;
      previewBtn.textContent = "Decoding...";

      try {
        // 1) Read file as ArrayBuffer
        const arrayBuffer = await fileInput.files[0].arrayBuffer();

        // 2) decode .nim
        const { width, height, pixels } = decodeNim(arrayBuffer);

        // 3) Draw to canvas
        nimCanvas.width = width;
        nimCanvas.height = height;
        const ctx = nimCanvas.getContext("2d");

        // Convert Uint8Array -> Uint8ClampedArray -> ImageData
        const imageData = new ImageData(new Uint8ClampedArray(pixels.buffer), width, height);
        ctx.putImageData(imageData, 0, 0);

        // Show canvas
        previewContainer.classList.remove("hidden");

      } catch (err) {
        previewError.textContent = `Error: ${err.message}`;
        previewError.classList.remove("hidden");
      } finally {
        previewBtn.disabled = false;
        previewBtn.textContent = originalText;
      }
    });
  });

})();
