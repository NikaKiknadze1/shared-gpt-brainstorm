const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: functions.config().openai.key
});

exports.callGpt = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const userMessage = req.body.message;

      if (!userMessage) {
        return res.status(400).json({ error: "No message provided" });
      }

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
