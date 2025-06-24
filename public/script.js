
const firebaseConfig = {
  apiKey: "AIzaSyBdx5jxaNIh70BcGlrSIfhm5OyrACIg7Ss",
  authDomain: "shared-gpt-brainstorm.firebaseapp.com",
  projectId: "shared-gpt-brainstorm",
  storageBucket: "shared-gpt-brainstorm.firebasestorage.app",
  messagingSenderId: "71732375553",
  appId: "1:71732375553:web:6f3cd50960e919f28c1000"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentRoom = "general";
let unsubscribe = null;

function changeRoom() {
  currentRoom = document.getElementById("roomSelector").value;
  loadMessages();
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

function loadMessages() {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "<h3>History for: " + currentRoom + "</h3>";
  if (unsubscribe) unsubscribe();
  let lastDate = "";
  unsubscribe = db.collection("rooms").doc(currentRoom).collection("messages").orderBy("timestamp")
    .onSnapshot(snapshot => {
      chatBox.innerHTML = "<h3>History for: " + currentRoom + "</h3>";
      snapshot.forEach(doc => {
        const msg = doc.data();
        const msgClass = msg.sender === "user" ? "user" : "gpt";
        const msgDate = formatDate(msg.timestamp);
        if (msgDate !== lastDate) {
          chatBox.innerHTML += `<div class='date-divider'>${msgDate}</div>`;
          lastDate = msgDate;
        }
        chatBox.innerHTML += `<div class="message ${msgClass}">
          <b>${msg.sender}</b>: ${msg.text}
          <span class="timestamp">${formatTimestamp(msg.timestamp)}</span>
        </div>`;
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    });
}

async function sendMessage() {
  const inputEl = document.getElementById("userInput");
  const input = inputEl.value;
  if (!input.trim()) return;
  inputEl.value = "";

  await db.collection("rooms").doc(currentRoom).collection("messages").add({
    text: input,
    sender: "user",
    timestamp: Date.now()
  });

  try {
    const response = await fetch("https://us-central1-shared-gpt-brainstorm.cloudfunctions.net/callGpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, room: currentRoom })
    });


    let data = {};
    let rawText = "";
    try {
      data = await response.clone().json();
    } catch (_) {
      rawText = await response.text();
    }

    if (!response.ok || data.error) {
      const errMsg = data.error || data.reply || rawText || response.statusText;
      const statusInfo = !response.ok && response.status
        ? ` (status ${response.status})`
        : "";
      throw new Error(errMsg + statusInfo);

 //8inb3z-codex/fix-openai-api-error-in-response
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data.error || response.statusText;
      throw new Error(errMsg);

    }

    await db
      .collection("rooms")
      .doc(currentRoom)
      .collection("messages")
      .add({
        text: data.reply,
        sender: "GPT",
        timestamp: Date.now()
      });
  } catch (error) {
    console.error("Error fetching GPT response:", error);
    await db
      .collection("rooms")
      .doc(currentRoom)
      .collection("messages")
      .add({
        text: `⚠️ ${error.message || 'GPT connection failed.'}`,
        sender: "System",
        timestamp: Date.now()
      });



    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error: ${errorText}`);
    }

    const data = await response.json();
    await db.collection("rooms").doc(currentRoom).collection("messages").add({
      text: data.reply,
      sender: "GPT",
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error fetching GPT response:", error);
    await db.collection("rooms").doc(currentRoom).collection("messages").add({
      text: "⚠️ GPT connection failed.",
      sender: "System",
      timestamp: Date.now()
    });
  }
}

async function clearRoom() {
  const messagesRef = db.collection("rooms").doc(currentRoom).collection("messages");
  const snapshot = await messagesRef.get();
  const batch = db.batch();
  snapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

function toggleTheme() {
  const body = document.body;
  if (body.classList.contains('dark')) {
    body.classList.remove('dark');
    body.classList.add('light');
    localStorage.setItem('theme', 'light');
  } else {
    body.classList.remove('light');
    body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}

function focusInput() {
  document.getElementById("userInput").focus();
}

window.onload = () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(savedTheme);
  loadMessages();
};
