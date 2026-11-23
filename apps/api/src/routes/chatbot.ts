import { Router, type IRouter } from "express";
import { openai } from "../lib/openai";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are Healix AI, a helpful medical assistant for foreign residents in Korea.
You help users understand their symptoms, suggest appropriate medical departments in Korean hospitals,
and provide guidance on navigating the Korean healthcare system.

IMPORTANT:
- Always recommend consulting a real doctor for diagnosis
- Identify urgency level: low (routine checkup), medium (see doctor this week), high (see doctor today), emergency (go to ER immediately)
- Suggest relevant hospital departments in Korea (내과/Internal Medicine, 외과/Surgery, 피부과/Dermatology, etc.)
- Be empathetic and clear
- Ask follow-up questions when needed to better assess symptoms

Respond in JSON format:
{
  "message": "...",
  "suggestedDepartments": ["Internal Medicine", "..."],
  "urgencyLevel": "low|medium|high|emergency",
  "followUpQuestions": ["..."]
}`;

router.post("/chatbot", async (req, res) => {
  const { message, conversationHistory = [], language } = req.body;

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT + (language ? `\nRespond in ${language} if possible.` : "") },
      ...conversationHistory.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    res.json({
      message: result.message || "I'm here to help. Could you tell me more about your symptoms?",
      suggestedDepartments: result.suggestedDepartments || [],
      urgencyLevel: result.urgencyLevel || "low",
      followUpQuestions: result.followUpQuestions || [],
    });
  } catch (err) {
    req.log.error({ err }, "Chatbot error");
    res.status(500).json({ error: "Chatbot failed" });
  }
});

export default router;
