// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBdx5jxaNIh70BcGlrSIfhm5OyrACIg7Ss",
  authDomain: "shared-gpt-brainstorm.firebaseapp.com",
  projectId: "shared-gpt-brainstorm",
  storageBucket: "shared-gpt-brainstorm.appspot.com",
  messagingSenderId: "71732375553",
  appId: "1:71732375553:web:6f3cd50960e919f28c1000"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentRoom = "general";
let username = localStorage.getItem('username') || 'User';
let unsubscribe = null;

function changeRoom() {
  const newRoom = document.getElementById("roomSelector").value;
  currentRoom = newRoom;
  loadMessages();
}

function setUsername() {
  const input = document.getElementById('usernameInput').value.trim();
  if (input) {
    username = input;
    localStorage.setItem('username', username);
  }
}

function loadMessages() {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";

  if (unsubscribe) unsubscribe();

  unsubscribe = db.collection("rooms").doc(currentRoom).collection("messages").orderBy("timestamp")
    .onSnapshot(snapshot => {
      chatBox.innerHTML = "";
      snapshot.forEach(doc => {
        const msg = doc.data();
        chatBox.innerHTML += `<div><b>${msg.sender}:</b> ${msg.text}</div>`;
      });
    });
}

async function sendMessage() {
  const inputEl = document.getElementById("userInput");
  const input = inputEl.value.trim();
  if (!input) return;
  inputEl.value = "";

  await db.collection("rooms").doc(currentRoom).collection("messages").add({
    text: input,
    sender: username,
    timestamp: Date.now()
  });

  try {
    const response = await fetch("https://us-central1-shared-gpt-brainstorm.cloudfunctions.net/callGpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: input,
        room: currentRoom
      })
    });

    if (!response.ok) {
      const errorText = await response.text(); // წაიკითხე როგორც ტექსტი
      throw new Error(`Server Error: ${errorText}`);
    }

    const data = await response.json();
    console.log("GPT Response:", data);

    const reply = data.reply;
    await db.collection("rooms").doc(currentRoom).collection("messages").add({
      text: reply,
      sender: "Storm",
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

window.onload = () => {
  document.getElementById('usernameInput').value = username;
  loadMessages();
};
