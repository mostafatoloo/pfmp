import { getPrisma, TelegramService, TaskService } from "@pfmp/database";
import { NextResponse } from "next/server";

/**
 * Telegram Bot API webhook. Secured by TELEGRAM_WEBHOOK_SECRET header when set.
 * Never exposes application passwords; linking uses short-lived tokens only.
 */
export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const got = request.headers.get("x-telegram-bot-api-secret-token");
    if (got !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const body = (await request.json().catch(() => null)) as {
    message?: { text?: string; chat?: { id?: number }; from?: { id?: number } };
  } | null;

  const text = body?.message?.text?.trim() ?? "";
  const chatId = body?.message?.chat?.id;
  const fromId = body?.message?.from?.id;
  if (!text || chatId == null || fromId == null) {
    return NextResponse.json({ ok: true });
  }

  const telegram = new TelegramService(getPrisma());

  if (text.startsWith("/start")) {
    const token = text.split(/\s+/)[1];
    if (token) {
      try {
        await telegram.consumeLinkToken(token, String(fromId), String(chatId));
        return NextResponse.json({
          method: "sendMessage",
          chat_id: chatId,
          text: "PFMP linked successfully. You can use /today and /done <taskId>.",
        });
      } catch {
        return NextResponse.json({
          method: "sendMessage",
          chat_id: chatId,
          text: "Linking failed. Generate a new token in Settings.",
        });
      }
    }
    return NextResponse.json({
      method: "sendMessage",
      chat_id: chatId,
      text: "Welcome to PFMP. Link your account from Settings → Telegram.",
    });
  }

  const link = await telegram.findUserByChatId(String(chatId));
  if (!link) {
    return NextResponse.json({
      method: "sendMessage",
      chat_id: chatId,
      text: "Account not linked. Open PFMP Settings to connect Telegram.",
    });
  }

  if (text === "/today") {
    // Authorized via linked user — list from their personal workspace only through member lookup
    const membership = await getPrisma().workspaceMember.findFirst({
      where: {
        userId: link.userId,
        deletedAtUtc: null,
        workspace: { kind: "personal", deletedAtUtc: null },
      },
    });
    if (!membership) {
      return NextResponse.json({
        method: "sendMessage",
        chat_id: chatId,
        text: "No personal workspace found.",
      });
    }
    const tasks = await new TaskService(getPrisma()).list(membership.workspaceId, {
      status: undefined,
    });
    const open = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").slice(0, 10);
    const lines =
      open.length === 0
        ? ["No open tasks."]
        : open.map((t) => `• ${t.title} (${t.status})${t.dueAtUtc ? ` due ${t.dueAtUtc.toISOString().slice(0, 10)}` : ""}`);
    return NextResponse.json({
      method: "sendMessage",
      chat_id: chatId,
      text: lines.join("\n"),
    });
  }

  if (text.startsWith("/done ")) {
    const taskId = text.slice(6).trim();
    const membership = await getPrisma().workspaceMember.findFirst({
      where: {
        userId: link.userId,
        deletedAtUtc: null,
        workspace: { deletedAtUtc: null },
      },
      include: { workspace: true },
    });
    // Prefer personal; fall back to first membership
    const personal = await getPrisma().workspaceMember.findFirst({
      where: {
        userId: link.userId,
        deletedAtUtc: null,
        workspace: { kind: "personal", deletedAtUtc: null },
      },
    });
    const workspaceId = personal?.workspaceId ?? membership?.workspaceId;
    if (!workspaceId || !taskId) {
      return NextResponse.json({
        method: "sendMessage",
        chat_id: chatId,
        text: "Could not resolve workspace or task.",
      });
    }
    try {
      await new TaskService(getPrisma()).update(workspaceId, taskId, link.userId, {
        status: "completed",
      });
      return NextResponse.json({
        method: "sendMessage",
        chat_id: chatId,
        text: "Marked completed.",
      });
    } catch {
      return NextResponse.json({
        method: "sendMessage",
        chat_id: chatId,
        text: "Task not found or not authorized.",
      });
    }
  }

  return NextResponse.json({
    method: "sendMessage",
    chat_id: chatId,
    text: "Commands: /today, /done <taskId>",
  });
}
