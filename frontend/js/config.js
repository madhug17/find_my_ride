const API_URL = "http://127.0.0.1:8000";

function getWsUrl(path) {
    const url = new URL(path, API_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.href;
}