import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer } from "ws";
import multer from "multer";
import mammoth from "mammoth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up multer memory storage for file text extraction
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// File Text Extraction Endpoint
app.post("/api/extract-text", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const file = req.file;
    const extension = path.extname(file.originalname).toLowerCase();
    let text = "";

    if (extension === ".txt") {
      text = file.buffer.toString("utf-8");
    } else if (extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
    } else if (extension === ".pdf") {
      const data = await pdfParse(file.buffer);
      text = data.text;
    } else {
      return res.status(400).json({ error: `Unsupported file type: ${extension}. Only .pdf, .docx, and .txt files are supported.` });
    }

    res.json({
      text: text,
      fileName: file.originalname,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error("File extraction error:", error);
    res.status(500).json({ error: error.message || "Failed to extract text from file." });
  }
});

// Initialize Gemini SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Diagnose Endpoint
app.post("/api/diagnose", async (req, res) => {
  try {
    const {
      language = "English",
      inputMode = "standard",
      userMaterial = "",
      optionalContext = "",
      statedGoal = "",
      proposedSolution = "",
      stakeholdersInput = "",
      dataSourcesInput = "",
    } = req.body;

    if (!userMaterial && inputMode === "standard") {
      return res.status(400).json({ error: "User material is required for standard mode." });
    }

    if (inputMode === "guided" && !statedGoal && !proposedSolution) {
      return res.status(400).json({ error: "Stated goal or proposed solution is required for guided mode." });
    }

    // Build the user input content string
    let inputContent = "";
    if (inputMode === "standard") {
      inputContent = `=== USER MATERIAL ===\n${userMaterial}`;
    } else {
      inputContent = `=== GUIDED INPUT ===
Stated Goal: ${statedGoal}
Proposed Solution: ${proposedSolution}
Key Stakeholders & Feedback: ${stakeholdersInput}
Known Data Sources & Constraints: ${dataSourcesInput}
Additional context (if any): ${userMaterial}`;
    }

    if (optionalContext) {
      inputContent += `\n\n=== OPTIONAL CONTEXT ===\n${optionalContext}`;
    }

    const systemInstruction = `You are Workflow X-Ray, an organizational problem diagnostician — think of an embedded consultant or forward-deployed engineer who goes on-site to find what is REALLY wrong, not just what the team says is wrong.

Your task is to analyze the provided initiative, KPI, workflow, or AI/automation idea. Your job is NOT to help them execute faster. Your job is to:
1. Find the REAL problem behind the symptoms they describe.
2. Judge whether the direction itself is even right — before anyone argues about how to execute.
3. Locate which layer is actually broken (problem definition, value, ownership, data, decision rights, risk, process).
4. Map a staged path to change.

AI and automation are only ONE possible means, not the default answer. Recommend them only where they genuinely help, and be willing to conclude that a problem should not be solved with AI at all.

Core slogan: Find the real problem before you solve it.

LANGUAGE GUIDELINE:
You MUST write all human-readable text values, diagnoses, reasons, summaries, names, recommendations, and explanations in the output JSON in: ${language}.
Keep all JSON keys and specific enum values in English exactly as specified. Do not change keys or enums like "ready_to_pilot", "stop", "valid", "automate", etc.

Return ONLY valid JSON matching the schema structure. Do not wrap in markdown backticks or any conversation.

JSON SCHEMA STRUCTURE (ALL text values must be in ${language}):
{
  "mirror": {
    "keyQuote": "The single most revealing sentence from the user input that shows what they really believe (in ${language})",
    "perceivedProblem": "What the user thinks the problem is, in their own framing (in ${language})",
    "realProblem": "What the diagnosis suggests the actual underlying problem is — be specific and direct (in ${language})",
    "perceivedSolution": "What the user thinks the solution is (in ${language})",
    "whyItMightBeWrong": "Why that solution framing might be solving the wrong thing — grounded in evidence from the input (in ${language})"
  },
  "overview": {
    "overallVerdict": "A short punchy strategic summary (in ${language})",
    "directionScore": 0-100 number representing strategic validation of the problem,
    "executionScore": 0-100 number representing readiness to build/pilot,
    "matrixPosition": "ready_to_pilot" | "good_direction_poor_execution" | "efficiently_wrong" | "stop_and_rethink",
    "recommendedDecision": "stop" | "validate" | "change" | "pilot" | "build",
    "mainDiagnosis": "Direct diagnosis of the core blocker (in ${language})",
    "safeAIEntryPoint": "A highly conservative, safe entry point for AI or automation if any; otherwise, write why AI should not be used (in ${language})"
  },
  "inputClarity": {
    "clarityLevel": "clear" | "partially_clear" | "too_vague",
    "whatIsClear": ["list of clear things (in ${language})"],
    "whatIsMissing": ["list of missing details (in ${language})"],
    "clarifyingQuestions": ["critical questions to ask the team (in ${language})"]
  },
  "stakeholderAlignment": {
    "alignmentScore": 0-100 score,
    "sharedUnderstanding": ["areas of alignment (in ${language})"],
    "misalignment": ["areas of friction (in ${language})"],
    "conflictingViews": [
      { "stakeholder": "Name or role", "view": "Their position", "conflict": "Why it conflicts with others" }
    ],
    "missingPerspectives": ["who is missing from the discussion (in ${language})"],
    "diagnosis": "Analysis of the alignment dynamics (in ${language})",
    "recommendation": "What to do to align them (in ${language})"
  },
  "extractedFacts": {
    "statedGoal": "The stated goal of the project",
    "proposedSolution": "The proposed technical or process solution",
    "targetUsers": ["intended users of the solution"],
    "stakeholders": ["mentioned stakeholders"],
    "knownDataSources": ["databases, tools, sheets, or inputs mentioned"],
    "constraints": ["operational or technical boundaries"],
    "risksMentioned": ["risks explicitly highlighted by the team"]
  },
  "assumptionAudit": {
    "hiddenAssumptions": ["assumptions they don't realize they're making"],
    "validatedAssumptions": ["assumptions that have actual evidence"],
    "unvalidatedAssumptions": ["critical assumptions with zero proof yet"],
    "potentiallyWrongAssumptions": ["assumptions likely to fail under contact with reality"]
  },
  "directionDiagnosis": {
    "verdict": "valid" | "partially_valid" | "unclear" | "invalid",
    "summary": "Overall direction evaluation (in ${language})",
    "dimensions": [
      {
        "name": "Problem Realness",
        "score": 0-100,
        "diagnosis": "Diagnosis for Problem Realness (in ${language})",
        "evidence": ["direct evidence from input (in ${language})"],
        "recommendation": "action (in ${language})"
      },
      {
        "name": "User Clarity",
        "score": 0-100,
        "diagnosis": "Diagnosis for User Clarity (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      },
      {
        "name": "Value Potential",
        "score": 0-100,
        "diagnosis": "Diagnosis for Value Potential (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      },
      {
        "name": "Strategic Fit",
        "score": 0-100,
        "diagnosis": "Diagnosis for Strategic Fit (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      },
      {
        "name": "Differentiation",
        "score": 0-100,
        "diagnosis": "Diagnosis for Differentiation (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      },
      {
        "name": "Trend Fit",
        "score": 0-100,
        "diagnosis": "Diagnosis for Trend Fit (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      }
    ]
  },
  "executionDiagnosis": {
    "verdict": "ready" | "partially_ready" | "not_ready",
    "summary": "Overall execution evaluation (in ${language})",
    "blockers": [
      {
        "type": "Ownership Gap",
        "severity": "low" | "medium" | "high",
        "diagnosis": "Diagnosis of ownership (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      },
      {
        "type": "Decision Rights Gap",
        "severity": "low" | "medium" | "high",
        "diagnosis": "Diagnosis of decision rights (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      },
      {
        "type": "Workflow Gap",
        "severity": "low" | "medium" | "high",
        "diagnosis": "Diagnosis of workflow (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      },
      {
        "type": "Data Readiness Gap",
        "severity": "low" | "medium" | "high",
        "diagnosis": "Diagnosis of data quality and access (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      },
      {
        "type": "Risk Control Gap",
        "severity": "low" | "medium" | "high",
        "diagnosis": "Diagnosis of risks (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      },
      {
        "type": "Scope Gap",
        "severity": "low" | "medium" | "high",
        "diagnosis": "Diagnosis of scope creep or layout (in ${language})",
        "evidence": ["evidence (in ${language})"],
        "recommendation": "action (in ${language})"
      }
    ]
  },
  "changePath": {
    "problemType": "direction" | "execution" | "both",
    "rootCause": {
      "layer": "Select ROOT layer: 'Problem Definition' | 'Value Hypothesis' | 'Ownership' | 'Data Readiness' | 'Decision Rights' | 'Risk Control' | 'Process Stability'",
      "diagnosis": "Root cause explanation (in ${language})"
    },
    "primaryChangeNeeded": "The single most important transformation required (in ${language})",
    "reason": "Why this root layer causes the visible symptoms (in ${language})",
    "stages": [
      {
        "stage": "Stabilize",
        "goal": "Goal for stabilization (in ${language})",
        "actions": ["Action 1", "Action 2", "Action 3"]
      },
      {
        "stage": "Realign",
        "goal": "Goal for realignment (in ${language})",
        "actions": ["Action 1", "Action 2", "Action 3"]
      },
      {
        "stage": "Rebuild",
        "goal": "Goal for rebuilding (in ${language})",
        "actions": ["Action 1", "Action 2"]
      }
    ],
    "recommendedSequence": ["Step 1 description", "Step 2 description", "Step 3 description"],
    "doNotStartWith": ["Premature activities to strictly avoid starting with (in ${language})"]
  },
  "aiLandingMap": [
    {
      "step": 1,
      "businessStep": "Name of a key step in the workflow process (in ${language})",
      "currentAction": "What humans do now (in ${language})",
      "aiFit": "high" | "medium" | "low",
      "aiRole": "automate" | "assist" | "human_decide" | "do_not_automate",
      "humanJudgmentRequired": "Where critical human supervision is needed (in ${language})",
      "risk": "Friction, hallucination or security risk (in ${language})",
      "recommendation": "Tactical recommendation (in ${language})"
    }
  ],
  "decisionBrief": {
    "recommendedDecision": "The decision from stop/validate/change/pilot/build with rationale",
    "why": "Detailed reasoning behind the recommendation (in ${language})",
    "nextActions": ["Action 1", "Action 2", "Action 3"],
    "meetingQuestions": ["Questions to ask at the next team meeting to spark truth"],
    "mvpScope": ["If piloted/built, the absolute minimal subset to test"],
    "doNotBuildYet": ["Features that must be deferred or ignored entirely"],
    "markdownReport": "A beautifully styled, robust Markdown executive report summarizing the whole diagnosis, recommendations, and next steps in ${language}."
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: inputContent }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    // Try parsing the response
    const data = JSON.parse(responseText.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Diagnosis error:", error);
    res.status(500).json({ error: error.message || "Failed to generate diagnosis." });
  }
});

// Serve frontend with Vite middleware in development
async function startServer() {
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Set up WebSocket server on `/api/live-interview`
  const wss = new WebSocketServer({ server, path: "/api/live-interview" });

  wss.on("connection", async (clientWs, req) => {
    console.log("WebSocket client connected to live interview");
    
    const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const role = url.searchParams.get("role") || "Project Owner";
    const userLanguage = url.searchParams.get("language") || "English";

    let session: any = null;

    try {
      // Connect to Gemini 3.1 Flash Live preview
      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are Workflow X-Ray's AI Diagnostic Interviewer. You are conducting a high-stakes corporate diagnostic interview with a stakeholder in the role of: "${role}".
The target language is: ${userLanguage}. Please speak and ask questions in ${userLanguage} only.

Your goal is to conduct a professional, critical, and empathetic scoping audit. Please:
1. Introduce yourself briefly as the Workflow X-Ray diagnostic auditor, welcome the user in their role (${role}), and immediately ask the first critical, probing question about their initiative or workflow.
2. Ask deep, analytical questions about their project's stated goal, underlying motives, workflow friction, data sources, known constraints, and stakeholder disagreements.
3. ASK ONLY ONE QUESTION AT A TIME. Keep your questions and responses extremely short, concise, and conversational (1 to 2 sentences max) because this is a spoken voice-only conversation.
4. Listen carefully to the user's answers and ask natural, probing follow-up questions instead of repeating standard scripts.
5. Challenge assumptions constructively (e.g., "Why is AI specifically the answer?" or "Who is actually responsible for updating that spreadsheet?").
6. Keep the interview to about 4 to 6 total questions, then thank them and instruct them to click "Stop & Fold Transcript" to view the analytical results.

Let's begin! Speak your introduction and ask your first question now in ${userLanguage}!`,
          generationConfig: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
            },
          } as any,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        } as any,
        callbacks: {
          onmessage: (message: any) => {
            const sc = message.serverContent;

            // Model audio — native-audio output lives in modelTurn parts inlineData.
            // Iterate all parts (there can be more than one chunk per message).
            const parts = sc?.modelTurn?.parts || [];
            for (const part of parts) {
              const audio = part?.inlineData?.data;
              if (audio) {
                clientWs.send(JSON.stringify({ type: "audio", audio }));
              }
            }

            // Transcriptions live in DEDICATED fields, not in parts.text.
            // This is the fix: outputTranscription = what the AI says,
            // inputTranscription = what the user says.
            const modelText = sc?.outputTranscription?.text;
            if (modelText) {
              clientWs.send(JSON.stringify({ type: "model-transcript", text: modelText }));
            }

            const userText = sc?.inputTranscription?.text;
            if (userText) {
              clientWs.send(JSON.stringify({ type: "user-transcript", text: userText }));
            }

            // Interruption
            if (sc?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }
          },
          onclose: () => {
            console.log("Gemini Live session closed");
            clientWs.close();
          },
          onerror: (err: any) => {
            console.error("Gemini Live session error:", err);
            clientWs.send(JSON.stringify({ type: "error", error: err.message }));
          }
        }
      });

      // Kick off the interview. Gemini Live waits for input by default and will
      // NOT speak first unless we send an explicit trigger. This is the fix for
      // "the auditor never actually talks".
      try {
        session.sendClientContent({
          turns: "Please begin the interview now. Introduce yourself in one sentence and ask your first question out loud.",
          turnComplete: true,
        });
      } catch (e) {
        console.error("Failed to send initial interview trigger:", e);
      }

      clientWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.audio && session) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e: any) {
          console.error("Error parsing client message:", e);
        }
      });

      clientWs.on("close", () => {
        console.log("WebSocket client disconnected");
        if (session) {
          try {
            session.close();
          } catch (e) {
            // ignore
          }
        }
      });

    } catch (err: any) {
      console.error("Error starting Gemini Live session:", err);
      clientWs.send(JSON.stringify({ type: "error", error: err.message || "Failed to initialize Gemini Live session." }));
      clientWs.close();
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Workflow X-Ray Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
