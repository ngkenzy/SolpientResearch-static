"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { KnowledgeItem } from "@/lib/ask-knowledge";

/* Ask SOLPIENT: a floating assistant. Search over the published research always works. A small local model
   (WebLLM, runs in this browser on WebGPU) can phrase answers when the visitor loads it. No question leaves the device. */

const WEBLLM_URL = "https://esm.run/@mlc-ai/web-llm@0.2.82";
const PREFERRED_MODELS = [
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  "Qwen2-0.5B-Instruct-q4f16_1-MLC",
  "Llama-3.2-1B-Instruct-q4f16_1-MLC",
];
const SUGGESTIONS = [
  "Which stocks are on the top picks list?",
  "Why is Harmony Biosciences not classified?",
  "What is the Genpact classification?",
  "How does the screen rank stocks?",
];
const REFUSAL = "That is not in the published research.";

type Source = { source: string; url: string };
type Msg = { role: "user" | "assistant"; text: string; sources?: Source[] };

const STOP = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "do", "does", "for", "how", "i", "in", "is", "it", "me", "of", "on", "or", "the", "to", "what", "which", "why", "with", "is", "this", "that", "was"]);

function tokenize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9&.+#-]+/g, " ").split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
}

function retrieve(query: string, knowledge: KnowledgeItem[], count = 3) {
  const q = tokenize(query);
  const lower = query.toLowerCase();
  const scored = knowledge.map((item) => {
    let score = 0;
    const title = item.title.toLowerCase();
    const tags = item.tags.join(" ");
    const body = item.text.toLowerCase();
    for (const t of q) {
      if (title.includes(t)) score += 6;
      if (tags.includes(t)) score += 5;
      if (body.includes(t)) score += 2;
    }
    for (const tag of item.tags) if (tag.length > 2 && lower.includes(tag)) score += 9;
    return { item, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const positive = scored.filter((s) => s.score > 0);
  return (positive.length ? positive : []).slice(0, count).map((s) => s.item);
}

type Engine = {
  chat: {
    completions: {
      create: (args: unknown) => Promise<AsyncIterable<{ choices: { delta?: { content?: string } }[] }>>;
    };
  };
};

export function AskPanel({ knowledge }: { knowledge: KnowledgeItem[] }) {
  const [open, setOpen] = useState(false);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchOnly, setSearchOnly] = useState(false);
  const [status, setStatus] = useState("Search mode");
  const [progress, setProgress] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text: "I answer from the published SOLPIENT research: memos, research files, and the screen ranking. Ask a question, or load the local model to get fuller answers.",
    },
  ]);
  const logRef = useRef<HTMLDivElement>(null);
  const hasGpu = typeof navigator !== "undefined" && Boolean((navigator as Navigator & { gpu?: unknown }).gpu);

  useEffect(() => {
    const sync = () => setOpen(window.location.hash === "#ask");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs]);

  function close() {
    setOpen(false);
    if (window.location.hash === "#ask") history.replaceState(null, "", window.location.pathname);
  }

  async function loadModel() {
    if (loading || engine) return;
    if (!hasGpu) {
      setSearchOnly(true);
      setStatus("Search mode");
      setMsgs((m) => [...m, { role: "assistant", text: "This browser has no WebGPU support, so the local model cannot run. Search still works." }]);
      return;
    }
    setLoading(true);
    setStatus("Loading local AI");
    try {
      const specifier: string = WEBLLM_URL;
      const webllm: any = await import(/* webpackIgnore: true */ specifier);
      const available: string[] = webllm.prebuiltAppConfig.model_list.map((m: { model_id: string }) => m.model_id);
      const model =
        PREFERRED_MODELS.find((id) => available.includes(id)) ??
        available.find((id) => /0\.5B.*Instruct.*q4f16/i.test(id));
      if (!model) throw new Error("No compact model available.");
      const eng: Engine = await webllm.CreateMLCEngine(model, {
        initProgressCallback: (r: { progress?: number; text?: string }) => {
          setProgress(Math.round((r.progress ?? 0) * 100));
          setStatus(`Loading local AI ${Math.round((r.progress ?? 0) * 100)}%`);
        },
        logLevel: "WARN",
      });
      setEngine(eng);
      setStatus("Local AI ready");
      setMsgs((m) => [...m, { role: "assistant", text: "Local AI is ready. Ask about the research." }]);
    } catch {
      setSearchOnly(true);
      setStatus("Search mode");
      setMsgs((m) => [...m, { role: "assistant", text: "The local model could not load on this device. Search is ready instead." }]);
    } finally {
      setLoading(false);
    }
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", text: question }]);

    const results = retrieve(question, knowledge, 3);
    const sources = results.map((r) => ({ source: r.source, url: r.url }));
    const top = results[0]?.text ?? REFUSAL;

    if (!engine || searchOnly) {
      setMsgs((m) => [...m, { role: "assistant", text: results.length ? top : REFUSAL, sources }]);
      setBusy(false);
      return;
    }

    setMsgs((m) => [...m, { role: "assistant", text: "Thinking locally…" }]);
    try {
      const context = results.map((r, i) => `[Source ${i + 1}: ${r.source}]\n${r.text}`).join("\n\n") || "(no matching records)";
      const chunks = await engine.chat.completions.create({
        temperature: 0.15,
        top_p: 0.85,
        max_tokens: 200,
        stream: true,
        messages: [
          {
            role: "system",
            content:
              "You are a research assistant on the SOLPIENT Research site. Answer ONLY from the supplied context. " +
              `If the context does not support the answer, reply exactly: ${REFUSAL} ` +
              "Use 1 to 4 short sentences. Do not invent numbers, dates, or recommendations. Do not give personalized buy or sell instructions.",
          },
          { role: "user", content: `CONTEXT:\n${context}\n\nQUESTION:\n${question}` },
        ],
      });
      let answer = "";
      for await (const chunk of chunks) {
        answer += chunk.choices[0]?.delta?.content ?? "";
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", text: answer.trimStart() }]);
      }
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", text: answer.trim() || top, sources }]);
    } catch {
      setMsgs((m) => [
        ...m.slice(0, -1),
        { role: "assistant", text: top, sources },
        { role: "assistant", text: "Local generation failed, so this answer comes from search." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <a className="ask-launch" href="#ask" aria-expanded={open} aria-controls="ask-panel">
        Ask SOLPIENT
      </a>
      <section id="ask-panel" className={`ask-panel${open ? " is-open" : ""}`} aria-label="Ask SOLPIENT" aria-hidden={!open}>
        <header className="ask-head">
          <div>
            <strong>Ask SOLPIENT</strong>
            <span className={`ask-status${engine ? " is-ready" : searchOnly ? " is-search" : ""}`}>{status}</span>
          </div>
          <button type="button" className="ask-close" onClick={close} aria-label="Close">×</button>
        </header>

        {!engine && !searchOnly && (
          <div className="ask-load">
            <button type="button" className="btn" onClick={loadModel} disabled={loading}>
              {loading ? `Loading ${progress}%` : "Load local AI"}
            </button>
            <p className="note" style={{ margin: "8px 0 0" }}>
              About 300 MB, cached in this browser after the first load. Runs on your device. Questions stay here.
            </p>
            {loading && (
              <div className="ask-progress" aria-hidden="true"><span style={{ width: `${Math.max(2, progress)}%` }} /></div>
            )}
          </div>
        )}

        <div className="ask-log" ref={logRef} aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={`ask-msg ${m.role}`}>
              <div className="ask-bubble">
                <div>{m.text}</div>
                {m.sources && m.sources.length > 0 && (
                  <div className="ask-sources">
                    {m.sources.map((s) => (
                      <a key={s.url + s.source} href={s.url}>{s.source}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="ask-suggest">
          {SUGGESTIONS.map((s) => (
            <button type="button" key={s} onClick={() => setInput(s)}>{s}</button>
          ))}
        </div>

        <form className="ask-form" onSubmit={ask}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a company, a memo, or the ranking"
            aria-label="Question"
            disabled={busy}
          />
          <button className="btn" type="submit" disabled={busy || !input.trim()}>Send</button>
        </form>
      </section>
    </>
  );
}
