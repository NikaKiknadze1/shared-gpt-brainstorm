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

// ✅ დროებითი მომხმარებლის აიდი (უნიკალური თითო session-ზე)
const currentUserId = "user-" + Math.floor(Math.random() * 10000);

// ✅ ჩატში არსებული შეტყობინებების რეალურ დროში ჩატვირთვა
const messagesRef = ref(db, `rooms/${currentRoomId}/messages`);
onChildAdded(messagesRef, (snapshot) => {
  const message = snapshot.val();
  appendMessage(message.text, message.role);
});

// ✅ შეტყობინების გაგზავნა სერვერზე და Firebase-ში შენახვა
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  saveMessageToRoom(message, "user");

  showTyping();

  try {
    const res = await fetch("https://us-central1-shared-gpt-brainstorm.cloudfunctions.net/callGpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    const reply =
      data?.reply ||
      data?.choices?.[0]?.message?.content ||
      data?.text ||
      "⚠️ GPT პასუხი ვერ მოიძებნა";

    hideTyping();
    saveMessageToRoom(reply, "gpt");

  } catch (err) {
    hideTyping();
    console.error("❌ Fetch error:", err);
    saveMessageToRoom("⚠️ GPT შეცდომა: " + err.message, "gpt");
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

// ✅ ტაიპინგის ანიმაციის ჩვენება
function showTyping() {
  const chatBox = document.getElementById("chatBox");
  const typingWrapper = document.createElement("div");
  typingWrapper.className = "message-wrapper gpt";
  typingWrapper.id = "typing-indicator";

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
  typingDiv._interval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    typingDiv.innerText = "GPT წერს" + ".".repeat(dotCount);
  }, 400);
}

// ✅ ტაიპინგის ანიმაციის დამალვა
function hideTyping() {
  const typingWrapper = document.getElementById("typing-indicator");
  if (typingWrapper) {
    const typingDiv = typingWrapper.querySelector(".typing");
    if (typingDiv && typingDiv._interval) {
      clearInterval(typingDiv._interval);
    }
    typingWrapper.remove();
  }
}

// ✅ Event listeners for sending messages
const sendBtn = document.getElementById("sendButton");
const inputEl = document.getElementById("userInput");
if (sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
}
if (inputEl) {
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}
