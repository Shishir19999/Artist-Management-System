"use client";

/**
 * Reads an image file, scales it down (cover-crop to a square, or fit for non-square when `square` is false)
 * and returns a compact JPEG data URL, so uploads stay small enough for the API and for localStorage.
 */
export async function fileToResizedDataUrl(file: File, max = 256, square = true): Promise<string> {
    if (!file.type.startsWith("image/")) throw new Error("Choose an image file (PNG, JPEG, WebP or GIF).");
    if (file.size > 8 * 1024 * 1024) throw new Error("That image is larger than 8 MB.");

    const bitmapUrl = URL.createObjectURL(file);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error("That file could not be read as an image."));
            el.src = bitmapUrl;
        });
        const side = square ? Math.min(img.width, img.height) : Math.max(img.width, img.height);
        const scale = Math.min(1, max / side);
        const w = square ? Math.round(Math.min(img.width, img.height) * scale) : Math.round(img.width * scale);
        const h = square ? w : Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, square ? Math.min(max, side) : w);
        canvas.height = Math.max(1, square ? canvas.width : h);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Image processing is not available in this browser.");
        if (square) {
            const sx = (img.width - side) / 2;
            const sy = (img.height - side) / 2;
            ctx.drawImage(img, sx, sy, side, side, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        let quality = 0.82;
        let out = canvas.toDataURL("image/jpeg", quality);
        while (out.length > 140_000 && quality > 0.35) {
            quality -= 0.12;
            out = canvas.toDataURL("image/jpeg", quality);
        }
        if (out.length > 140_000) throw new Error("That image is still too large after resizing. Try a smaller one.");
        return out;
    } finally {
        URL.revokeObjectURL(bitmapUrl);
    }
}
