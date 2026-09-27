const API_URL = "https://find-my-ride.onrender.com";

function getWsUrl(path) {
    const url = new URL(path, API_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.href;
}