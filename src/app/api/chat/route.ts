// @ts-nocheck
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await getAuthSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id }
  });

  if (!profile?.githubPat || !profile?.githubRepo || !profile?.githubOwner) {
    return NextResponse.json({ error: "GitHub configuration missing. Please update your profile." }, { status: 400 });
  }

  const { messages } = await req.json();

  const systemPrompt = `You are an Expert Full-Stack Web Developer. 
Your objective is to take the user's spoken instructions and build a complete, fully functional, beautifully styled web environment.

Requirements for your output:
1. You can generate multiple files for modularity (e.g., \`index.html\`, \`styles.css\`, \`app.js\`), or additional HTML pages like \`about.html\`.
2. Ensure at least one file is exactly named \`index.html\` to serve as the entry point.
3. It MUST be extremely modern, sleek, and premium. Use responsive flexbox/grid layouts, hover states, and dynamic components.
4. IMPORTANT: When a user asks you to ITERATIVELY EDIT or modify a previously built site, you MUST reuse the EXACT SAME \`projectName\` and \`filepath\`es. By maintaining identical paths, the deployment pipeline will seamlessly overwrite the live code instead of creating duplicates.

Once you have generated the full source code for the pages requested, you MUST autonomously call the \`deployToGitHub\` tool to publish it. Do not ask for permission, just deploy it instantly.
`;

  const result = await streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages,
    tools: {
      deployToGitHub: tool({
        description: 'Autonomously deploy an entire folder structure of generated web files to the user\'s GitHub repository.',
        parameters: z.object({
          projectName: z.string().describe('A single uniform folder name for this application (e.g. coffee-shop-app). Use the exact same name if iterativly editing an existing project.'),
          files: z.array(z.object({
            filepath: z.string().describe('The internal filename/path, e.g. index.html or css/styles.css'),
            content: z.string().describe('The exact and complete raw code for this specific file.')
          }))
        }),
        execute: async ({ projectName, files }) => {
          try {
            let latestLiveUrl = `https://${profile.githubOwner}.github.io/${profile.githubRepo}/projects/${projectName}/index.html`;
            let successCount = 0;

            for (const file of files) {
              const apiUrl = `https://api.github.com/repos/${profile.githubOwner}/${profile.githubRepo}/contents/projects/${projectName}/${file.filepath}`;
              const encodedContent = Buffer.from(file.content, 'utf-8').toString('base64');
              
              // 1. Fetch file to get SHA (required by GitHub API to update existing files)
              let fileSha = undefined;
              try {
                const getRes = await fetch(apiUrl, {
                  headers: { "Authorization": `token ${profile.githubPat}`, "Accept": "application/vnd.github.v3+json" },
                  cache: "no-store"
                });
                if (getRes.ok) {
                    const getData = await getRes.json();
                    fileSha = getData.sha;
                }
              } catch(e) { }

              // 2. PUT the file code
              const body: any = { message: `feat: autonomous AI deployment of ${file.filepath}`, content: encodedContent };
              if (fileSha) body.sha = fileSha;

              const res = await fetch(apiUrl, {
                method: "PUT",
                headers: {
                  "Authorization": `token ${profile.githubPat}`,
                  "Content-Type": "application/json",
                  "Accept": "application/vnd.github.v3+json"
                },
                body: JSON.stringify(body)
              });

              if (res.ok) {
                successCount++;
              }
            }

            if (successCount === 0 && files.length > 0) {
                return { success: false, error: "Failed to upload any files to GitHub API." };
            }
            
            // Save exactly what the user prompted and the full JSON array of codebase files
            const promptText = messages.length > 0 ? messages[messages.length - 1].content : "No prompt provided";
            const serializedFiles = JSON.stringify(files);

            // If we are iteratively editing an existing site, update the original DB entry instead of creating duplicates
            const existingProject = await prisma.project.findFirst({
                where: { userId: session.user.id, title: projectName }
            });

            if (existingProject) {
                await prisma.project.update({
                    where: { id: existingProject.id },
                    data: {
                        prompt: promptText as string,
                        htmlContent: serializedFiles,
                        updatedAt: new Date()
                    }
                });
            } else {
                await prisma.project.create({
                  data: {
                    userId: session.user.id,
                    title: projectName,
                    prompt: promptText as string,
                    htmlContent: serializedFiles,
                    githubUrl: latestLiveUrl,
                    isPublic: false,
                  }
                });
            }

            return { success: true, url: latestLiveUrl, message: `Successfully deployed ${successCount} files.` };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
      }),
    },
    maxSteps: 2,
  });

  return result.toDataStreamResponse();
}
