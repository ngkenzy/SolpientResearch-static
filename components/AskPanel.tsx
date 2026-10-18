"use client";

import { FormEvent, useEffect, useState } from "react";

/* Local AI: the model runs in this browser through WebGPU (WebLLM). Nothing typed here is sent to a server. */

const MODEL_ID = "Qwen2.5-3B-Instruct-q4f16_1-MLC";
const WEBLLM_URL = "https://esm.run/@mlc-ai/web-llm@0.2.82";

const EXAMPLES = [
  "Which stocks pass the most checks, and what flags should I look at first?",
  "What is the weakest part of the Genpact thesis?",
  "Why is Harmony Biosciences not classified?",
  "Explain the Intuit valuation range and its assumptions.",
];

type Engine = {
  chat: {
    completions: {
      create: (args: {
        messages: { role: "system" | "user"; content: string }[];
        temperature?: number;
      }) => Promise<{ choices: { message: { content: string } }[] }>;
    };
  };
};

export function AskPanel({ pack }: { pack: string }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [question, setQuestion] = useState(EXAMPLES[0]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSupported(Boolean((navigator as Navigator & { gpu?: unknown }).gpu));
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const specifier: string = WEBLLM_URL;
      const webllm: any = await import(/* webpackIgnore: true */ specifier);
      const eng: Engine = await webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (r: { progress?: number; text?: string }) =>
          setProgress(`${Math.round((r.progress ?? 0) * 100)}% ${r.text ?? ""}`.trim()),
      });
      setEngine(eng);
      setProgress("Ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the local model.");
    } finally {
      setLoading(false);
    }
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!engine || !question.trim() || busy) return;
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      const result = await engine.chat.completions.create({
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a research explanation assistant running locally in the user's browser. Use only the research pack below. " +
              "If the pack does not support an answer, say the evidence is not in the pack. Do not invent numbers. " +
              "Do not give personalized buy or sell instructions; explain the evidence and trade-offs instead.\n\nRESEARCH PACK:\n" +
              pack,
          },
          { role: "user", content: question.trim() },
        ],
      });
      setAnswer(result.choices[0]?.message?.content ?? "No answer returned.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The model could not answer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      {supported === false && (
        <div className="callout warn">
          <p style={{ margin: 0 }}>
            This browser has no WebGPU support, so the local model cannot run here. Try a recent desktop version of
            Chrome or Edge.
          </p>
        </div>
      )}

      {supported !== false && !engine && (
        <>
          <p>
            Loading the model downloads about 2 GB the first time, then it is cached in this browser. It runs on your
            device, and your questions do not leave it.
          </p>
          <button type="button" className="btn" onClick={load} disabled={loading || supported === null}>
            {loading ? "Loading model…" : "Load local AI"}
          </button>
          {progress && <p className="note" style={{ marginTop: 10 }}>{progress}</p>}
        </>
      )}

      {engine && (
        <form onSubmit={ask}>
          <label htmlFor="q" className="kicker">Question</label>
          <textarea
            id="q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="input"
            style={{ width: "100%", flex: "none", resize: "vertical" }}
          />
          <div className="toolbar" style={{ margin: "10px 0" }}>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Thinking…" : "Ask"}
            </button>
            {EXAMPLES.map((ex) => (
              <button type="button" key={ex} className="btn ghost" onClick={() => setQuestion(ex)} style={{ fontSize: 12 }}>
                {ex.length > 46 ? `${ex.slice(0, 46)}…` : ex}
              </button>
            ))}
          </div>
          <div className="ask-log" aria-live="polite">{answer}</div>
        </form>
      )}

      {error && <p className="neg" style={{ marginTop: 10 }}>{error}</p>}
    </div>
  );
}
