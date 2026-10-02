// Automatically detect environment (Localhost / Live Server / FastAPI / Production Render)
function getApiBaseUrl() {
    if (typeof window !== "undefined" && window.location) {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;

        // If accessed directly from local machine
        if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || protocol === "file:") {
            // If served directly through FastAPI on port 8000
            if (port === "8000") {
                return window.location.origin;
            }
            // If running via Live-Server (e.g. 5500) or file preview
            return `http://${hostname || 'localhost'}:8000`;
        }
        // If hosted on Render, Vercel, Netlify, or Custom Domain
        if (hostname.includes("onrender.com") || hostname.includes("vercel.app") || hostname.includes("netlify.app")) {
            return "https://find-my-ride.onrender.com";
        }
    }
    return "https://find-my-ride.onrender.com";
}

const API_URL = getApiBaseUrl();

function getWsUrl(path) {
    try {
        const url = new URL(path, API_URL);
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
        return url.href;
    } catch {
        const base = API_URL.replace(/^http/, 'ws');
        const cleanPath = path.startsWith('/') ? path : '/' + path;
        return `${base}${cleanPath}`;
    }
}