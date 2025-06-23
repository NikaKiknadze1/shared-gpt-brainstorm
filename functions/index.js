const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { OpenAI } = require("openai");

admin.initializeApp();

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

exports.callGpt = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // ✅ ეს მთლიანად შიგნით უნდა იყოს
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

      res.status(200).json({
        reply: chatCompletion.choices[0].message.content,
      });
    } catch (error) {
      console.error("OpenAI Error:", error);
      res.status(500).send("Something went wrong calling OpenAI.");
    }
  });
});
