const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const { OpenAI } = require("openai");

admin.initializeApp();
const openai = new OpenAI({ apiKey: functions.config().openai.key });

const corsHandler = cors({ origin: true });

exports.callGpt = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).send("Invalid message");
    }

    try {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: message }],
      });

      const reply = chatCompletion.choices?.[0]?.message?.content;

      if (!reply) {
        return res.status(500).json({
          reply: "⚠️ OpenAI did not return a response.",
        });
      }

      // ✅ ამ ხაზზე return-ი აუცილებელია
      return res.status(200).json({ reply });
    } catch (error) {
      console.error("OpenAI Error:", error.message || error);
      // ✅ აქაც return აუცილებელია
      return res.status(500).json({
        reply: "⚠️ Something went wrong calling OpenAI.",
        error: error.message || error.toString(),
      });
    }
  });
});
