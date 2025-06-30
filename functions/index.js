const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); // credentials არაა საჭირო firebase hosting-სთვის
const { OpenAI } = require("openai");

admin.initializeApp();

// OpenAI ინიციალიზაცია Firebase Functions Config-დან
const openai = new OpenAI({
  apiKey: functions.config().openai.key, // დარწმუნდი რომ სეტინგი სწორადაა
});

exports.callGpt = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // მხოლოდ POST მეთოდი იყოს დაშვებული
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { message, room } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
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
        return res.status(500).json({ error: "OpenAI returned an empty response" });
      }

      return res.status(200).json({ reply });
    } catch (error) {
      const detailed =
        (error.response &&
          error.response.data &&
          error.response.data.error &&
          error.response.data.error.message) ||
        error.message ||
        error.toString();

      console.error("OpenAI Error:", detailed);

      const statusCode = (error.response && error.response.status) || 500;

      return res.status(statusCode).json({
        reply: "⚠️ Something went wrong calling OpenAI.",
        error: detailed,
      });
    }
  });
});
