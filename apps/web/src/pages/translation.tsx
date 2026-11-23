import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, Button, Textarea, Select, Label, Badge } from "@/components/shared-ui";
import { Languages, ArrowRightLeft, BookOpen, Loader2 } from "lucide-react";
import { useTranslateMedical } from "@workspace/api-client-react";
import { TranslationResponse } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Translation() {
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Korean");
  const [text, setText] = useState("");
  const [result, setResult] = useState<TranslationResponse | null>(null);

  const translateMutation = useTranslateMedical();

  const handleTranslate = () => {
    if (!text.trim()) return;
    translateMutation.mutate({
      data: {
        text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      }
    }, {
      onSuccess: (data) => setResult(data)
    });
  };

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (result) {
      setText(result.translatedText);
      setResult(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Languages className="w-8 h-8" />
          </div>
          AI Medical Translator
        </h1>
        <p className="text-lg text-muted-foreground">
          Translate medical documents and symptoms accurately with built-in term explanations.
        </p>
      </div>

      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="flex-1 w-full">
            <Label className="mb-2 block">Translate from</Label>
            <Select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
              <option value="English">English</option>
              <option value="Korean">Korean</option>
              <option value="Spanish">Spanish</option>
              <option value="Chinese">Chinese</option>
              <option value="Vietnamese">Vietnamese</option>
            </Select>
          </div>
          
          <div className="pt-6 hidden md:block">
            <Button variant="ghost" onClick={handleSwap} className="rounded-full w-12 h-12 p-0 text-muted-foreground hover:bg-primary/10 hover:text-primary">
              <ArrowRightLeft className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 w-full">
            <Label className="mb-2 block">Translate to</Label>
            <Select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              <option value="Korean">Korean</option>
              <option value="English">English</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Textarea 
              placeholder="Enter symptoms, diagnosis, or medication instructions..."
              className="min-h-[200px] text-lg p-6 bg-muted/30 border-muted-foreground/20"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="relative">
            <div className={`w-full min-h-[200px] rounded-xl border-2 p-6 text-lg transition-colors ${result ? 'bg-primary/5 border-primary/20 text-foreground' : 'bg-muted/10 border-dashed border-border text-muted-foreground flex items-center justify-center'}`}>
              {translateMutation.isPending ? (
                <div className="flex flex-col items-center justify-center h-full text-primary">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <span className="font-medium animate-pulse">Translating medical context...</span>
                </div>
              ) : result ? (
                <p className="whitespace-pre-wrap">{result.translatedText}</p>
              ) : (
                <p className="text-center">Translation will appear here</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleTranslate} disabled={translateMutation.isPending || !text.trim()}>
            {translateMutation.isPending ? "Translating..." : "Translate Text"}
          </Button>
        </div>
      </Card>

      {/* Medical Terms Explanations */}
      {result?.medicalTerms && result.medicalTerms.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4 mt-10">
            <BookOpen className="w-5 h-5 text-primary" /> 
            Medical Terms Explained
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.medicalTerms.map((term, i) => (
              <Card key={i} className="p-5 border-l-4 border-l-accent flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{term.original}</span>
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground mx-2" />
                  <Badge variant="secondary" className="text-sm px-3">{term.translation}</Badge>
                </div>
                {term.explanation && (
                  <p className="text-muted-foreground mt-2 text-sm bg-muted/40 p-3 rounded-lg flex-1">
                    {term.explanation}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
