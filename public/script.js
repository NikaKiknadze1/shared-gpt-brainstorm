// Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyBdx5jxaNIh70BcGlrSIfhm5OyrACIg7Ss",
  authDomain: "shared-gpt-brainstorm.firebaseapp.com",
  projectId: "shared-gpt-brainstorm",
  storageBucket: "shared-gpt-brainstorm.firebasestorage.app",
  messagingSenderId: "71732375553",
  appId: "1:71732375553:web:6f3cd50960e919f28c1000",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let username = localStorage.getItem("username") || "User";
let unsubscribe = null;

function setUsername() {
  const input = document.getElementById("usernameInput").value.trim();
  if (input) {
    username = input;
    localStorage.setItem("username", username);
  }
}


function loadMessages() {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";
  if (unsubscribe) unsubscribe();

  unsubscribe = db
    .collection("rooms")
    .doc("general")
    .collection("messages")
    .orderBy("timestamp")
    .onSnapshot((snapshot) => {
      chatBox.innerHTML = "";
      snapshot.forEach((doc) => {
        const msg = doc.data();
        const senderType = msg.sender === username ? "user" : "gpt";
        appendMessage(msg.text, senderType, msg.sender);
      });
    });
}

function appendMessage(text, sender = "user", name = "") {
  const chatBox = document.getElementById("chatBox");

  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.innerText = sender === "user" ? "🧑" : "🤖";

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;
  msgDiv.innerHTML = name ? `<b>${name}:</b> ${text}` : text;

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

async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  input.value = "";

  await db.collection("rooms").doc("general").collection("messages").add({
    text: message,
    sender: username,
    timestamp: Date.now(),
  });

  const chatBox = document.getElementById("chatBox");
  const typingWrapper = document.createElement("div");
  typingWrapper.className = "message-wrapper gpt";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.innerText = "🤖";

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

    await db.collection("rooms").doc("general").collection("messages").add({
      text: reply,
      sender: "GPT",
      timestamp: Date.now(),
    });

  } catch (err) {
    clearInterval(dotInterval);
    typingWrapper.remove();
    console.error("❌ Fetch error:", err);
    await db.collection("rooms")
      .doc("general")
      .collection("messages")
      .add({
        text: "⚠️ GPT connection failed.",
        sender: "System",
        timestamp: Date.now(),
      });
  }
}

window.onload = () => {
  document.getElementById("usernameInput").value = username;
  loadMessages();
};
