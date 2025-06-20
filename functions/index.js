const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { OpenAI } = require("openai");

admin.initializeApp();
const openai = new OpenAI({ apiKey: "AIzaSyBdx5jxaNIh70BcGlrSIfhm5OyrACIg7Ss" });

exports.callGpt = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    const { message, room } = req.body;
    try {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: message }]
      });

      res.json({ reply: chatCompletion.choices[0].message.content });
    } catch (error) {
      console.error("GPT error:", error);
      res.status(500).send("Something went wrong.");
    }
  });
});
