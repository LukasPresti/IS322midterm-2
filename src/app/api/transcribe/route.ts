import { getAuthSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getAuthSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as Blob;

  if (!file) {
    return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
  }

  const whisperForm = new FormData();
  whisperForm.append("file", file, "recording.webm");
  whisperForm.append("model", "whisper-1");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: whisperForm,
  });

  if (!whisperRes.ok) {
    if (whisperRes.status === 429 || whisperRes.status === 402) {
      return NextResponse.json({ error: "The OpenAI API key has run out of tokens (Insufficient Quota). Please top up your credits." }, { status: 429 });
    }
    const errorBody = await whisperRes.text();
    console.error("Whisper API Error:", whisperRes.status, errorBody);
    return NextResponse.json({ error: `Failed to transcribe: ${whisperRes.status} Error. Did you add OPENAI_API_KEY to Vercel?` }, { status: 500 });
  }

  const transcriptData = await whisperRes.json();
  return NextResponse.json({ text: transcriptData.text });
}
