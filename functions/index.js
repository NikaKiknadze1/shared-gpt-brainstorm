const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { OpenAI } = require("openai");

admin.initializeApp();

const openaiApiKey = functions.config().openai?.key;

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

exports.callGpt = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (!openaiApiKey) {
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "No message provided" });
    }

    try {
      const chat = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
      });

      res.status(200).json({ reply: chat.choices[0].message.content });
    } catch (err) {
      console.error("OpenAI Error:", err);
      res.status(500).json({ error: err.message });
    }
  });
});