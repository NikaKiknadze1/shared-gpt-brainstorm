function appendMessage(text, sender = "user") {
  const chatBox = document.getElementById("chatBox");

  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.innerText = sender === "user" ? "🧑" : "🤖";

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

async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  input.value = "";

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

    clearInterval(dotInterval);
    typingWrapper.remove();
    appendMessage(data.reply || "⚠️ ცარიელი პასუხია", "gpt");

  } catch (err) {
    clearInterval(dotInterval);
    typingWrapper.remove();
    appendMessage("⚠️ GPT შეცდომა: " + err.message, "gpt");
  }
}
