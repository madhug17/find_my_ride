const API_URL = (window.location.origin && window.location.origin.startsWith("http")) 
    ? window.location.origin 
    : "http://localhost:8000";

function getWsUrl(path) {
    const url = new URL(path, API_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.href;
}