import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clinicsTable } from "@workspace/db/schema";
import { openai } from "../lib/openai";
import { ilike, or, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/clinics", async (req, res) => {
  const { query, department, district, language } = req.query as Record<string, string>;

  try {
    let results = await db.select().from(clinicsTable);

    if (query) {
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.nameKorean || "").toLowerCase().includes(query.toLowerCase()) ||
          (c.description || "").toLowerCase().includes(query.toLowerCase())
      );
    }

    if (department) {
      results = results.filter((c) =>
        c.departments.some((d) => d.toLowerCase().includes(department.toLowerCase()))
      );
    }

    if (district) {
      results = results.filter((c) =>
        c.district.toLowerCase().includes(district.toLowerCase())
      );
    }

    if (language) {
      results = results.filter((c) =>
        (c.languages || []).some((l) => l.toLowerCase().includes(language.toLowerCase()))
      );
    }

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Clinic search error");
    res.status(500).json({ error: "Failed to fetch clinics" });
  }
});

router.post("/clinics/recommend", async (req, res) => {
  const { symptoms, language } = req.body;

  if (!symptoms) {
    res.status(400).json({ error: "symptoms required" });
    return;
  }

  try {
    const prompt = `You are a Korean medical assistant. Based on these symptoms, recommend appropriate hospital departments and provide advice.

Symptoms: "${symptoms}"

Respond in JSON format:
{
  "recommendedDepartments": [
    { "department": "English name", "departmentKorean": "Korean name", "reason": "why", "confidence": 0.9 }
  ],
  "urgencyLevel": "routine|soon|urgent|emergency",
  "advice": "Brief medical advice"
}`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(aiResponse.choices[0].message.content || "{}");

    const allClinics = await db.select().from(clinicsTable);
    const recommendedDepts = (result.recommendedDepartments || []).map((d: { department: string }) => d.department.toLowerCase());
    const suggestedClinics = allClinics.filter((c) =>
      c.departments.some((d) => recommendedDepts.some((rd: string) => d.toLowerCase().includes(rd)))
    ).slice(0, 5);

    res.json({
      recommendedDepartments: result.recommendedDepartments || [],
      urgencyLevel: result.urgencyLevel || "routine",
      advice: result.advice || "",
      suggestedClinics,
    });
  } catch (err) {
    req.log.error({ err }, "Clinic recommendation error");
    res.status(500).json({ error: "Recommendation failed" });
  }
});

export default router;
