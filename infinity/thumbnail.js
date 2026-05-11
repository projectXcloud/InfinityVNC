/*
 * Infinity addition: postMessage thumbnail bridge.
 *
 * The parent page (InfinityOS) embeds this app via an iframe but cannot read
 * the canvas directly due to cross-origin policies. To support a "live pod
 * preview" UI without spawning a duplicate VNC session, the parent sends:
 *
 *   { type: "infinity:request-thumbnail", id?: any, quality?: 0..1, maxWidth?: px }
 *
 * and this handler replies (to e.source, targeted to e.origin) with:
 *
 *   { type: "infinity:thumbnail", id?: any, dataUrl: string|null, error?: string }
 *
 * `dataUrl` is null when the framebuffer hasn't been drawn yet (not connected,
 * or canvas-tainted by some unexpected cross-origin draw). Parent should retry.
 *
 * No behavioural change to noVNC itself — purely a read-only observer of the
 * already-rendered canvas.
 */

const DEFAULT_QUALITY = 0.5;
const DEFAULT_MAX_WIDTH = 480; // Picker cards are small; oversized payloads are wasteful.

function findCanvas() {
    const container = document.getElementById('noVNC_container');
    if (!container) return null;
    return container.querySelector('canvas');
}

function captureThumbnail({ quality = DEFAULT_QUALITY, maxWidth = DEFAULT_MAX_WIDTH } = {}) {
    const canvas = findCanvas();
    if (!canvas) return { dataUrl: null, error: 'no-canvas' };
    if (canvas.width === 0 || canvas.height === 0) {
        return { dataUrl: null, error: 'empty-framebuffer' };
    }

    let source = canvas;
    // Downscale to maxWidth via an intermediate canvas so we don't ship a
    // multi-MB JPEG over postMessage on every poll.
    if (maxWidth && canvas.width > maxWidth) {
        const ratio = maxWidth / canvas.width;
        const scaled = document.createElement('canvas');
        scaled.width = Math.max(1, Math.round(canvas.width * ratio));
        scaled.height = Math.max(1, Math.round(canvas.height * ratio));
        const ctx = scaled.getContext('2d');
        if (!ctx) return { dataUrl: null, error: 'no-2d-context' };
        ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
        source = scaled;
    }

    try {
        const dataUrl = source.toDataURL('image/jpeg', quality);
        return { dataUrl };
    } catch (err) {
        return { dataUrl: null, error: `toDataURL: ${err && err.message ? err.message : err}` };
    }
}

window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type !== 'infinity:request-thumbnail') return;

    const result = captureThumbnail({
        quality: typeof msg.quality === 'number' ? msg.quality : undefined,
        maxWidth: typeof msg.maxWidth === 'number' ? msg.maxWidth : undefined,
    });

    const reply = {
        type: 'infinity:thumbnail',
        id: msg.id,
        dataUrl: result.dataUrl,
        ...(result.error ? { error: result.error } : {}),
    };

    // Targeted reply — only the parent that asked gets it.
    if (event.source && typeof event.source.postMessage === 'function') {
        try {
            event.source.postMessage(reply, event.origin || '*');
        } catch {
            // Window may have closed between request and reply — ignore.
        }
    }
});
