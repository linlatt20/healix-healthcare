import { Router, type IRouter } from "express";
import { openai } from "../lib/openai";

const router: IRouter = Router();

router.post("/translate/doc", async (req, res) => {
  const { imageBase64, mimeType, targetLanguage, fileName } = req.body;

  if (!imageBase64 || !targetLanguage) {
    res.status(400).json({ error: "imageBase64 and targetLanguage are required" });
    return;
  }

  try {
    const dataUrl = `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a medical document translator. This is a medical document (${fileName || "document"}).
1. First, extract ALL text you can read from this document.
2. Then translate the extracted text to ${targetLanguage}.
3. List any important medical terms found.

Respond ONLY in this JSON format:
{
  "extractedText": "full original text you can read from the document",
  "translatedText": "complete translation in ${targetLanguage}",
  "documentType": "e.g. Prescription / Lab Results / Discharge Summary / etc.",
  "medicalTerms": [{"original": "...", "translation": "...", "explanation": "..."}]
}`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    res.json({
      extractedText: result.extractedText || "",
      translatedText: result.translatedText || "",
      documentType: result.documentType || "Medical Document",
      medicalTerms: result.medicalTerms || [],
    });
  } catch (err) {
    req.log.error({ err }, "Document extraction error");
    res.status(500).json({ error: "Document extraction failed" });
  }
});

router.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage, context } = req.body;

  if (!text || !targetLanguage) {
    res.status(400).json({ error: "text and targetLanguage are required" });
    return;
  }

  try {
    const prompt = `You are a medical translator specializing in Korean healthcare.
Translate the following medical text from ${sourceLanguage || "auto-detected language"} to ${targetLanguage}.
${context ? `Medical context: ${context}` : ""}

Respond in JSON format:
{
  "translatedText": "...",
  "sourceLanguage": "...",
  "medicalTerms": [
    { "original": "...", "translation": "...", "explanation": "..." }
  ]
}

Text to translate: "${text}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    res.json({
      translatedText: result.translatedText || "",
      sourceLanguage: result.sourceLanguage || sourceLanguage || "unknown",
      targetLanguage,
      medicalTerms: result.medicalTerms || [],
    });
  } catch (err) {
    req.log.error({ err }, "Translation error");
    res.status(500).json({ error: "Translation failed" });
  }
});

export default router;
