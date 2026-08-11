import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCuCWN1GQ2mAgXhlGXVN8yATPRYeyymu_I",
  authDomain: "journey-5ba21.firebaseapp.com",
  projectId: "journey-5ba21",
  storageBucket: "journey-5ba21.firebasestorage.app",
  messagingSenderId: "421182688936",
  appId: "1:421182688936:web:996d2d0812404570d3bc9d",
  measurementId: "G-YXKL4Z89SC",
  databaseURL: "https://journey-5ba21-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Hàm tự động đồng bộ thời gian thực từ Cloud về máy
export const subscribeToSyncData = (syncCode, onDataReceived) => {
  if (!syncCode) return () => {};
  const dataRef = ref(db, `journals/${syncCode}`);
  return onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) onDataReceived(data);
  });
};

// Hàm lưu dữ liệu vĩnh viễn lên Cloud
export const saveToFirebase = async (syncCode, journalData) => {
  if (!syncCode) return;
  try {
    const dataRef = ref(db, `journals/${syncCode}`);
    await set(dataRef, {
      ...journalData,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Lỗi đồng bộ Firebase:", error);
  }
};
