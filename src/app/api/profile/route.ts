import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getAuthSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id }
  });

  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { githubPat, githubRepo, githubOwner } = await req.json();

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: {
      githubPat,
      githubRepo,
      githubOwner,
    },
    create: {
      userId: session.user.id,
      githubPat,
      githubRepo,
      githubOwner,
    }
  });

  return NextResponse.json({ profile });
}
