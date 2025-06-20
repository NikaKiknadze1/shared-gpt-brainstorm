const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); // credentials არაა საჭირო firebase hosting-სთვის
const { OpenAI } = require("openai");

// Firebase ინიციალიზაცია
admin.initializeApp();

// OpenAI ინიციალიზაცია Firebase Functions Config-დან
const openai = new OpenAI({
  apiKey: functions.config().openai.key, // დარწმუნდი რომ სეტინგი სწორადაა
});

exports.callGpt = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // მხოლოდ POST მეთოდი იყოს დაშვებული
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { message, room } = req.body;

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
