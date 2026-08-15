import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { firebaseConfig } from "./firebase-config.js";

function setupLocalStorageOnly() {
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
}

async function setupFirestoreStorage() {
  const { initializeApp } = await import("firebase/app");
  const { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } = await import(
    "firebase/firestore"
  );

  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp);

  let syncCode = localStorage.getItem("syncCode");
  if (!syncCode) {
    const entered = window.prompt(
      "Nhập mã đồng bộ (tự đặt, dùng CHUNG một mã ở mọi thiết bị để dữ liệu nối với nhau):"
    );
    syncCode = (entered || "mac-dinh").trim() || "mac-dinh";
    localStorage.setItem("syncCode", syncCode);
  }

  const fsDoc = (key) => doc(db, "journal", syncCode, "data", key);

  window.storage = {
    async get(key) {
      try {
        const snap = await getDoc(fsDoc(key));
        if (snap.exists()) {
          const value = snap.data().value;
          localStorage.setItem(key, value);
          return { key, value };
        }
        return null;
      } catch (e) {
        const v = localStorage.getItem(key);
        return v !== null ? { key, value: v } : null;
      }
    },
    async set(key, value) {
      try {
        await setDoc(fsDoc(key), { value });
        localStorage.setItem(key, value);
        return { key, value };
      } catch (e) {
        try {
          localStorage.setItem(key, value);
          return { key, value };
        } catch (e2) {
          return null;
        }
      }
    },
    async delete(key) {
      try {
        await deleteDoc(fsDoc(key));
        localStorage.removeItem(key);
        return { key, deleted: true };
      } catch (e) {
        return null;
      }
    },
    async list(prefix) {
      try {
        const snaps = await getDocs(collection(db, "journal", syncCode, "data"));
        const keys = [];
        snaps.forEach((d) => {
          if (!prefix || d.id.startsWith(prefix)) keys.push(d.id);
        });
        return { keys };
      } catch (e) {
        return null;
      }
    },
  };
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

async function init() {
  const isConfigured =
    firebaseConfig &&
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("DÁN_VÀO_ĐÂY") &&
    !firebaseConfig.apiKey.includes("PASTE");

  if (!isConfigured) {
    console.warn(
      "Chưa điền cấu hình Firebase trong firebase-config.js — đang dùng localStorage (không đồng bộ giữa các thiết bị) cho đến khi bạn điền."
    );
    setupLocalStorageOnly();
    renderApp();
    return;
  }

  try {
    await setupFirestoreStorage();
  } catch (e) {
    console.warn("Firebase chưa kết nối được, dùng localStorage tạm thời:", e);
    setupLocalStorageOnly();
  }
  renderApp();
}

init();
