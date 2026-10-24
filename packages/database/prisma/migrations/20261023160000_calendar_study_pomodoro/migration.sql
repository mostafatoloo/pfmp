-- Task pomodoro estimate + session linkage + weekly timetable

BEGIN TRY
  BEGIN TRAN;

  IF COL_LENGTH('Task', 'pomodoroEstimate') IS NULL
    ALTER TABLE [Task] ADD [pomodoroEstimate] INT NULL;

  IF COL_LENGTH('PomodoroSession', 'taskId') IS NULL
    ALTER TABLE [PomodoroSession] ADD [taskId] UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH('PomodoroSession', 'userId') IS NULL
    ALTER TABLE [PomodoroSession] ADD [userId] NVARCHAR(36) NULL;

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'PomodoroSession_taskId_fkey')
  BEGIN
    ALTER TABLE [PomodoroSession] WITH CHECK
      ADD CONSTRAINT [PomodoroSession_taskId_fkey]
      FOREIGN KEY ([taskId]) REFERENCES [Task]([id]);
  END

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'PomodoroSession_taskId_startedAtUtc_idx')
    CREATE INDEX [PomodoroSession_taskId_startedAtUtc_idx] ON [PomodoroSession]([taskId], [startedAtUtc]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'PomodoroSession_userId_startedAtUtc_idx')
    CREATE INDEX [PomodoroSession_userId_startedAtUtc_idx] ON [PomodoroSession]([userId], [startedAtUtc]);

  IF OBJECT_ID(N'[TimetableSlot]', N'U') IS NULL
  BEGIN
    CREATE TABLE [TimetableSlot] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [TimetableSlot_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [workspaceId] UNIQUEIDENTIFIER NOT NULL,
      [kind] NVARCHAR(32) NOT NULL,
      [title] NVARCHAR(300) NOT NULL,
      [dayOfWeek] INT NOT NULL,
      [startMinutes] INT NOT NULL,
      [endMinutes] INT NOT NULL,
      [classType] NVARCHAR(100) NULL,
      [notes] NVARCHAR(MAX) NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [TimetableSlot_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAtUtc] DATETIME2 NOT NULL,
      [deletedAtUtc] DATETIME2 NULL,
      CONSTRAINT [TimetableSlot_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [Workspace]([id])
    );
    CREATE INDEX [TimetableSlot_workspaceId_dayOfWeek_startMinutes_idx]
      ON [TimetableSlot]([workspaceId], [dayOfWeek], [startMinutes]);
  END

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH
