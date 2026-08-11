import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Thay thế window.storage (chỉ có trong Claude) bằng localStorage của trình duyệt,
// để app hoạt động độc lập, không cần Claude nữa.
window.storage = {
  async get(key) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? { key, value: v } : null;
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return { key, value };
    } catch (e) {
      return null;
    }
  },
  async delete(key) {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true };
    } catch (e) {
      return null;
    }
  },
  async list(prefix) {
    try {
      const keys = Object.keys(localStorage).filter((k) => !prefix || k.startsWith(prefix));
      return { keys };
    } catch (e) {
      return null;
    }
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
