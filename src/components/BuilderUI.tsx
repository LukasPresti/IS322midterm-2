"use client";

import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
// @ts-nocheck
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from 'ai/react';

export default function BuilderUI() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const forkId = searchParams.get("forkId");
  const editId = searchParams.get("edit"); // legacy edit support

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/profile");
    }
  }, [status, router]);

  const [isRecording, setIsRecording] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [logs, setLogs] = useState<string>("System ready. Waiting for instructions...\n");
  const logRef = useRef<HTMLTextAreaElement>(null);

  const [previewContent, setPreviewContent] = useState("");

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => prev + `[${timestamp}] ${msg}\n`);
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  };

  const { append, messages, setMessages, isLoading } = useChat({
    onError: (error) => {
      if (error.message.includes("429") || error.message.includes("402") || error.message.includes("Insufficient Quota")) {
        addLog("AI Error: The OpenAI API key has run out of tokens (Insufficient Quota). Please top up your credits.");
      } else {
        addLog(`AI Error: ${error.message}`);
      }
    },
    onResponse: () => {
      addLog("AI Architect has started building your website...");
    },
    onFinish: (message: any) => {
      addLog("Build complete!");
      const toolCall = message.toolInvocations?.find((t: any) => t.toolName === "deployToGitHub");
      if (toolCall && toolCall.state === "result") {
        if (toolCall.result.success) {
          setSuccessUrl(toolCall.result.url);
          addLog("Deployment complete! " + toolCall.result.url);
        } else {
          addLog("Deployment failed: " + toolCall.result.error);
        }
      }
    }
  });

  // Handle Fork / Edit Hydration
  useEffect(() => {
    const idToHydrate = forkId || editId;
    if (idToHydrate) {
      addLog(`Fetching project codebase for iteration...`);
      fetch(`/api/projects/${idToHydrate}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.htmlContent) {
            let parsedFiles = [];
            try {
              parsedFiles = JSON.parse(data.htmlContent);
              if (!Array.isArray(parsedFiles)) throw new Error("Not array");
            } catch (e) {
              // Backward compatibility for single strings
              parsedFiles = [{ filepath: "index.html", content: data.htmlContent }];
            }

            setMessages([
              { id: '1', role: 'user', content: data.prompt || "Build a website" },
              { id: '2', role: 'assistant', content: '', toolInvocations: [{
                toolCallId: 'init-0',
                toolName: 'deployToGitHub',
                args: { projectName: data.title, files: parsedFiles },
                result: { success: true }
              } as any]}
            ]);
            addLog(`Project codebase loaded successfully! Press Start Recording to iteratively edit this code.`);
            
            // Render the cached file instantly
            const indexFile = parsedFiles.find(f => f.filepath === 'index.html' || f.filepath.endsWith('.html'));
            if (indexFile) setPreviewContent(indexFile.content);
          }
        })
        .catch(e => addLog("Failed to fetch project for editing."));
    }
  }, [forkId, editId, setMessages]);

  // Watch messages to update preview frame dynamically
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.toolInvocations) {
      const deployTool = lastMessage.toolInvocations.find((t: any) => t.toolName === "deployToGitHub");
      if (deployTool && deployTool.args && Array.isArray(deployTool.args.files)) {
        const indexFile = deployTool.args.files.find((f: any) => f.filepath === 'index.html' || f.filepath.endsWith('.html'));
        if (indexFile) {
          setPreviewContent(indexFile.content);
        }
      }
    }
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsRecording(false);
        addLog("Recording received. Transcribing audio...");
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setSuccessUrl(null);
      addLog("Listening to your instructions...");
    } catch (err) {
      addLog(`Error: Microphone access denied.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      addLog("Sending audio to Whisper...");
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Server error transcribing audio");
      }

      const data = await response.json();
      addLog(`Heard: "${data.text}"`);
      addLog(`Sending instructions to the AI Architect...`);

      // Trigger the chat stream. It retains previous history automatically!
      append({
        role: "user",
        content: data.text,
      });

    } catch (error: any) {
      addLog(`Pipeline Failed: ${error.message}`);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="builder-body">
      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); width: 50%; }
          100% { transform: translateX(200%); width: 50%; }
        }
      `}</style>

      <div className="background-effects">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <nav className="navbar solid-nav">
        <Link href="/" className="back-link">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Portfolio
        </Link>
        <div className="logo cursor-pointer" onClick={() => router.push("/profile")}>
          <span style={{ fontSize: "1rem", fontWeight: "normal", marginRight: "1rem" }}>{session?.user?.email}</span>
          Settings<span className="highlight">.</span>
        </div>
      </nav>

      <main className="builder-main fade-in visible">
        <div className="builder-container glass-panel">
          <header className="builder-header">
            <h1>AI Website Architect</h1>
            <p>Describe the website you want to build or iterate upon. The AI will code it and push it live.</p>

            <div className="usage-guide glass-panel mt-4" style={{ textAlign: "left", padding: "1.5rem", borderLeft: "4px solid var(--accent-primary)" }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "600", color: "#fff" }}>How to use properly:</h3>
              <ol style={{ color: "var(--text-muted)", paddingLeft: "1.2rem", fontSize: "0.95rem", lineHeight: "1.6" }}>
                <li style={{ marginBottom: "0.5rem" }}>Click <strong>Start Recording</strong> and clearly describe your site.</li>
                <li style={{ marginBottom: "0.5rem" }}>Click <strong>Stop & Build</strong> to send the audio to the server.</li>
                <li style={{ marginBottom: "0.5rem" }}>The AI will structure the files, compile the code, and push it live securely via your GitHub.</li>
                <li><strong>Iterative Mode:</strong> If you don't like the result, just press Record again and say <em>&quot;Make the background blue&quot;</em> to update the live site!</li>
              </ol>
            </div>
          </header>

          <div className="controls-panel">
            {isRecording && (
              <div className="recording-indicator" id="recording-pulse">
                <div className="pulse-ring"></div>
                <span>Listening...</span>
              </div>
            )}

            <div className="controls">
              <button onClick={startRecording} disabled={isRecording || isLoading} className="btn action-btn record">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                Start Recording
              </button>
              <button onClick={stopRecording} disabled={!isRecording} className="btn action-btn stop">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
                Stop & Build
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="progress-container glass-panel mt-4" style={{ padding: "1.5rem", borderLeft: "4px solid var(--accent-primary)" }}>
              <label style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--accent-primary)", marginBottom: "0.8rem", display: "block" }}>
                AI Architect is structuring and coding the application...
              </label>
              <div className="progress-bar" style={{ width: "100%", height: "12px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "6px", overflow: "hidden" }}>
                <div style={{ width: "50%", height: "100%", backgroundColor: "var(--accent-primary)", borderRadius: "6px", animation: "indeterminate 1.5s infinite ease-in-out" }}></div>
              </div>
            </div>
          )}

          {successUrl && (
            <div className="success-banner">
              <h3>✅ Deployment Complete</h3>
              <p>Your website is currently building on GitHub Pages.</p>
              <a href={successUrl} target="_blank" className="btn primary-btn mt-4" style={{ width: "100%" }}>
                Open Live Website
              </a>
            </div>
          )}

          <div className="status-container" style={{ marginTop: "1rem" }}>
            <label>Build Logs</label>
            <textarea ref={logRef} value={logs} readOnly placeholder="Awaiting voice instructions..." style={{ height: "180px" }} />
          </div>
        </div>

        <div className="preview-container glass-panel">
          <label>Live HTML Preview</label>
          <div className="browser-chrome">
            <div className="browser-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
          <iframe id="preview-frame" sandbox="allow-scripts allow-same-origin" srcDoc={previewContent}></iframe>
        </div>
      </main>
    </div>
  );
}
