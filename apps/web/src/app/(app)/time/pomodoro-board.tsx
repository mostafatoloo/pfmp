"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@pfmp/i18n/react";

type TaskOption = {
  id: string;
  title: string;
  pomodoroEstimate: number | null;
  completedPomodoros: number;
};

type SessionRow = {
  id: string;
  kind: string;
  taskId: string | null;
  startedAtUtc: string;
  endedAtUtc: string | null;
  durationSeconds: number | null;
};

type Config = {
  workSeconds: number;
  shortBreakSeconds: number;
  longBreakSeconds: number;
  longBreakEvery: number;
};

function formatRemaining(total: number) {
  const s = Math.max(0, total);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function kindLabel(t: (key: string) => string, kind: string) {
  if (kind === "work") return t("time.kindWork");
  if (kind === "short_break") return t("time.kindShortBreak");
  if (kind === "long_break") return t("time.kindLongBreak");
  return kind.replace("_", " ");
}

export function PomodoroBoard({
  tasks,
  config,
  recentSessions,
}: {
  tasks: TaskOption[];
  config: Config;
  recentSessions: SessionRow[];
}) {
  const t = useT();
  const router = useRouter();
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? "");
  const [mode, setMode] = useState<"work" | "short_break" | "long_break">("work");
  const [remaining, setRemaining] = useState(config.workSeconds);
  const [running, setRunning] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [completedInCycle, setCompletedInCycle] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  const selected = localTasks.find((task) => task.id === selectedTaskId) ?? null;

  const durationForMode = useCallback(
    (m: typeof mode) => {
      if (m === "work") return config.workSeconds;
      if (m === "short_break") return config.shortBreakSeconds;
      return config.longBreakSeconds;
    },
    [config],
  );

  useEffect(() => {
    if (!running) return;
    const tick = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [running]);

  useEffect(() => {
    if (!running || remaining > 0) return;
    void completeActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  async function start() {
    setError(null);
    const res = await fetch("/api/v1/pomodoro/sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: mode,
        taskId: mode === "work" ? selectedTaskId || null : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error?.message ?? t("time.couldNotStart"));
      return;
    }
    setActiveId(json.data.id);
    setRemaining(durationForMode(mode));
    setRunning(true);
  }

  async function completeActive() {
    if (!activeId) {
      setRunning(false);
      return;
    }
    setRunning(false);
    await fetch(`/api/v1/pomodoro/sessions/${activeId}/stop`, { method: "POST" });
    if (mode === "work" && selectedTaskId) {
      setLocalTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTaskId
            ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
            : task,
        ),
      );
      const nextCount = completedInCycle + 1;
      setCompletedInCycle(nextCount);
      const nextMode =
        nextCount % config.longBreakEvery === 0 ? "long_break" : "short_break";
      setMode(nextMode);
      setRemaining(durationForMode(nextMode));
    } else {
      setMode("work");
      setRemaining(config.workSeconds);
    }
    setActiveId(null);
    router.refresh();
  }

  async function stopEarly() {
    if (!activeId) {
      setRunning(false);
      return;
    }
    await fetch(`/api/v1/pomodoro/sessions/${activeId}/stop`, { method: "POST" });
    setRunning(false);
    setActiveId(null);
    router.refresh();
  }

  const progressLabel = useMemo(() => {
    if (!selected?.pomodoroEstimate) return null;
    return t("time.pomodorosProgress", {
      done: selected.completedPomodoros,
      estimate: selected.pomodoroEstimate,
    });
  }, [selected, t]);

  return (
    <div className="stack">
      <div className="card stack" style={{ textAlign: "center", gap: "1rem" }}>
        <div className="row" style={{ justifyContent: "center" }}>
          {(["work", "short_break", "long_break"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`btn sm ${mode === m ? "" : "secondary"}`}
              disabled={running}
              onClick={() => {
                setMode(m);
                setRemaining(durationForMode(m));
              }}
            >
              {m === "work"
                ? t("time.focus")
                : m === "short_break"
                  ? t("time.shortBreak")
                  : t("time.longBreak")}
            </button>
          ))}
        </div>

        <div
          style={{
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            fontWeight: 650,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.04em",
          }}
          aria-live="polite"
        >
          {formatRemaining(remaining)}
        </div>

        {mode === "work" ? (
          <div className="field" style={{ textAlign: "start", maxWidth: "28rem", marginInline: "auto" }}>
            <label htmlFor="pomo-task">{t("time.taskForFocus")}</label>
            <select
              id="pomo-task"
              value={selectedTaskId}
              disabled={running}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            >
              {localTasks.length === 0 ? <option value="">{t("time.noOpenTasks")}</option> : null}
              {localTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                  {task.pomodoroEstimate
                    ? ` (${task.completedPomodoros}/${task.pomodoroEstimate})`
                    : ` (${t("time.doneCount", { count: task.completedPomodoros })})`}
                </option>
              ))}
            </select>
            {progressLabel ? <p className="muted">{progressLabel}</p> : null}
          </div>
        ) : null}

        <div className="row" style={{ justifyContent: "center" }}>
          {!running ? (
            <button
              className="btn"
              type="button"
              onClick={() => void start()}
              disabled={mode === "work" && !selectedTaskId}
            >
              {t("time.start")}
            </button>
          ) : (
            <button className="btn danger" type="button" onClick={() => void stopEarly()}>
              {t("time.stop")}
            </button>
          )}
        </div>
        {error ? (
          <p className="muted" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="card stack">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{t("time.savedSessions")}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {t("time.savedSessionsHint")}
        </p>
        {recentSessions.length === 0 ? (
          <div className="empty-state">{t("time.noSessionsYet")}</div>
        ) : (
          <ul className="list-plain">
            {recentSessions.slice(0, 20).map((s) => {
              const taskTitle = localTasks.find((task) => task.id === s.taskId)?.title;
              return (
                <li key={s.id} className="list-item">
                  <span>
                    <strong>{kindLabel(t, s.kind)}</strong>
                    {taskTitle ? ` · ${taskTitle}` : ""}
                  </span>
                  <span className="muted bidi-isolate">
                    {s.endedAtUtc
                      ? t("time.minutes", { count: Math.round((s.durationSeconds ?? 0) / 60) })
                      : t("time.running")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
