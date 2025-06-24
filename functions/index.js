const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const { OpenAI } = require("openai");

admin.initializeApp();
const openaiApiKey =
  (functions.config().openai && functions.config().openai.key) ||
  process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error(
    "Missing OpenAI API key. Set via 'firebase functions:config:set openai.key=YOUR_API_KEY' or 'process.env.OPENAI_API_KEY'."
  );
}

const openai = new OpenAI({ apiKey: openaiApiKey || "" });

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

  if (!openaiApiKey) {
    return res.status(500).json({
      reply: "⚠️ OpenAI API key is not configured.",
    });
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
      const detailed =
        (error.response && error.response.data && error.response.data.error &&
          error.response.data.error.message) ||
        error.message ||
        error.toString();
      console.error("OpenAI Error:", detailed);
      // ✅ აქაც return აუცილებელია
      return res.status(500).json({
        reply: "⚠️ Something went wrong calling OpenAI.",
        error: detailed,
      });
    }
  });
});
