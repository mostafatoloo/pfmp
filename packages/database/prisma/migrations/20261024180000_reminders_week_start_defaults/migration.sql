-- Reminders + user weekStartsOn; default calendar to Shamsi (persian)

BEGIN TRY
  BEGIN TRAN;

  IF COL_LENGTH('user', 'weekStartsOn') IS NULL
    ALTER TABLE [user] ADD [weekStartsOn] INT NOT NULL CONSTRAINT [user_weekStartsOn_df] DEFAULT 6;

  IF OBJECT_ID(N'[Reminder]', N'U') IS NULL
  BEGIN
    CREATE TABLE [Reminder] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Reminder_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [workspaceId] UNIQUEIDENTIFIER NOT NULL,
      [userId] NVARCHAR(36) NOT NULL,
      [title] NVARCHAR(300) NOT NULL,
      [notes] NVARCHAR(MAX) NULL,
      [remindAtUtc] DATETIME2 NOT NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Reminder_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAtUtc] DATETIME2 NOT NULL,
      [deletedAtUtc] DATETIME2 NULL,
      CONSTRAINT [Reminder_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [Workspace]([id]),
      CONSTRAINT [Reminder_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [user]([id])
    );
    CREATE INDEX [Reminder_workspaceId_remindAtUtc_idx] ON [Reminder]([workspaceId], [remindAtUtc]);
    CREATE INDEX [Reminder_userId_remindAtUtc_idx] ON [Reminder]([userId], [remindAtUtc]);
  END

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH
