// ✅ IMPORT FIREBASE CONFIG & DATABASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onChildAdded,
  push,
  set,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ✅ Firebase Config — რეალური პარამეტრები შენი აპიდან
const firebaseConfig = {
  apiKey: "AIzaSyBdx5jxaNIh70BcGlrSIfhm50yrACIg7Ss",
  authDomain: "shared-gpt-brainstorm.firebaseapp.com",
  databaseURL: "https://shared-gpt-brainstorm-default-rtdb.firebaseio.com",
  projectId: "shared-gpt-brainstorm",
  storageBucket: "shared-gpt-brainstorm.appspot.com",
  messagingSenderId: "71732375553",
  appId: "1:71732375553:web:6f3cd50960e919f28c1000"
};

// ✅ Firebase Init
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ მოიპოვე ოთახის აიდი URL-დან ან დააყენე default "room-1"
const urlParams = new URLSearchParams(window.location.search);
const currentRoomId = urlParams.get("room") || "room-1";
document.getElementById("roomLabel").textContent = currentRoomId;

// ✅ დროებითი მომხმარებლის აიდი (უნიკალური თითო session-ზე)
const currentUserId = "user-" + Math.floor(Math.random() * 10000);

// ✅ ჩატში არსებული შეტყობინებების რეალურ დროში ჩატვირთვა
const messagesRef = ref(db, `rooms/${currentRoomId}/messages`);
onChildAdded(messagesRef, (snapshot) => {
  const message = snapshot.val();
  appendMessage(message.text, message.role);
});

// ✅ გაგზავნის ღილაკზე დაჭერა
const sendButton = document.getElementById("sendButton");
sendButton.addEventListener("click", sendMessage);

// ✅ შეტყობინების გაგზავნა სერვერზე და Firebase-ში შენახვა
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  saveMessageToRoom(message, "user");
  input.value = "";

  const chatBox = document.getElementById("chatBox");
  const typingWrapper = document.createElement("div");
  typingWrapper.className = "message-wrapper gpt";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.innerText = "🧠";

  const typingDiv = document.createElement("div");
  typingDiv.className = "message gpt typing";
  typingDiv.innerText = "GPT წერს";

  typingWrapper.appendChild(avatar);
  typingWrapper.appendChild(typingDiv);
  chatBox.appendChild(typingWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  let dotCount = 0;
  const dotInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    typingDiv.innerText = "GPT წერს" + ".".repeat(dotCount);
  }, 400);

  try {
    const res = await fetch("https://us-central1-shared-gpt-brainstorm.cloudfunctions.net/callGpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    console.log("🔍 GPT raw response:", data);

    clearInterval(dotInterval);
    typingWrapper.remove();

    const reply =
      data?.reply ||
      data?.choices?.[0]?.message?.content ||
      data?.text ||
      "⚠️ GPT პასუხი ვერ მოიძებნა";

    appendMessage(reply, "gpt");
    saveMessageToRoom(reply, "gpt");

  } catch (err) {
    clearInterval(dotInterval);
    typingWrapper.remove();
    console.error("❌ Fetch error:", err);
    appendMessage("⚠️ GPT შეცდომა: " + err.message, "gpt");
  }
}

// ✅ შეტყობინების შენახვა Firebase-ში
function saveMessageToRoom(text, role = "user") {
  const newMessageRef = push(ref(db, `rooms/${currentRoomId}/messages`));
  set(newMessageRef, {
    sender: role === "user" ? currentUserId : "gpt",
    text,
    role,
    timestamp: serverTimestamp()
  });
}

// ✅ შეტყობინების ჩვენება ჩატში
function appendMessage(text, sender = "user") {
  const chatBox = document.getElementById("chatBox");

  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.innerText = sender === "user" ? "🧑" : "🧠";

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;
  msgDiv.innerText = text;

  if (sender === "user") {
    wrapper.appendChild(msgDiv);
    wrapper.appendChild(avatar);
  } else {
    wrapper.appendChild(avatar);
    wrapper.appendChild(msgDiv);
  }

  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}
