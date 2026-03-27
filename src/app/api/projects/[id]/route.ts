import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingProject = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!existingProject) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // Allow access if the user owns it (Iterative Editing) OR if it is public (Forking)
  if (existingProject.userId !== session.user.id && !existingProject.isPublic) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(existingProject);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { isPublic } = await req.json();

  // Ensure the user actually owns the project before updating
  const existingProject = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!existingProject || existingProject.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updatedProject = await prisma.project.update({
    where: { id: params.id },
    data: { isPublic },
  });

  return NextResponse.json(updatedProject);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingProject = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!existingProject || existingProject.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
