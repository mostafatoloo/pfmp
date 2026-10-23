import { getPrisma, AssistantContextService } from "@pfmp/database";
import { createAiGateway } from "@pfmp/ai-gateway";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (request, ctx) => {
  const body = await readJson(request, z.object({ message: z.string().min(1).max(4000) }));

  const user = await getPrisma().user.findUnique({ where: { id: ctx.userId } });
  if (user && user.aiAssistantEnabled === false) {
    throw new AppError("VALIDATION_ERROR", "AI assistant is disabled in your preferences", 403);
  }

  const snap = await new AssistantContextService(getPrisma()).gatherSummary(
    ctx.workspace.id,
    ctx.userId,
  );

  const gateway = createAiGateway(process.env);
  if (!gateway.isEnabled()) {
    const reply = [
      `AI is off — verified summary of your ${ctx.workspace.kind} workspace:`,
      `• Active tasks: ${snap.totalActiveTasks}`,
      `• Overdue: ${snap.tasksOverdue}`,
      `• Due today: ${snap.tasksDueToday}`,
      `• Completed (7d): ${snap.tasksCompleted7d}`,
      snap.overdueTasks.length
        ? `• Overdue titles: ${snap.overdueTasks.map((t) => t.title).join("; ")}`
        : "• No overdue tasks",
      "",
      `You asked: “${body.message}”`,
      "Enable AI_ENABLED for model-assisted suggestions (always previewed before changes).",
    ].join("\n");

    const conversation = await getPrisma().aiConversation.create({
      data: {
        workspaceId: ctx.workspace.id,
        userId: ctx.userId,
        title: body.message.slice(0, 80),
        messages: {
          create: [
            { role: "user", content: body.message },
            { role: "assistant", content: reply, metadataJson: JSON.stringify({ kind: "verified" }) },
          ],
        },
      },
    });

    return NextResponse.json({
      data: { reply, kind: "verified", conversationId: conversation.id },
    });
  }

  const draft = await gateway.chat({
    message: body.message,
    context: {
      openTaskCount: snap.totalActiveTasks,
      overdueTasks: snap.overdueTasks.map((t) => ({ title: t.title })),
      dueSoonTasks: snap.upcomingTasks.map((t) => ({ title: t.title })),
      note: "Verified application data only.",
    },
  });

  const conversation = await getPrisma().aiConversation.create({
    data: {
      workspaceId: ctx.workspace.id,
      userId: ctx.userId,
      title: body.message.slice(0, 80),
      messages: {
        create: [
          { role: "user", content: body.message },
          {
            role: "assistant",
            content: draft.reply,
            metadataJson: JSON.stringify({ kind: draft.kind, proposal: draft.proposal ?? null }),
          },
        ],
      },
    },
  });

  return NextResponse.json({
    data: {
      reply: draft.reply,
      kind: draft.kind,
      conversationId: conversation.id,
      proposal: draft.proposal,
    },
  });
});
