-- Study schedule grid: slot description + workspace study settings

BEGIN TRY
  BEGIN TRAN;

  IF COL_LENGTH('TimetableSlot', 'description') IS NULL
    ALTER TABLE [TimetableSlot] ADD [description] NVARCHAR(500) NULL;

  IF OBJECT_ID(N'[StudySettings]', N'U') IS NULL
  BEGIN
    CREATE TABLE [StudySettings] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [StudySettings_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [workspaceId] UNIQUEIDENTIFIER NOT NULL,
      [schoolStartMinutes] INT NOT NULL CONSTRAINT [StudySettings_schoolStartMinutes_df] DEFAULT 480,
      [schoolEndMinutes] INT NOT NULL CONSTRAINT [StudySettings_schoolEndMinutes_df] DEFAULT 780,
      [schoolWeekPattern] NVARCHAR(16) NOT NULL CONSTRAINT [StudySettings_schoolWeekPattern_df] DEFAULT 'sat_thu',
      [defaultColumnCount] INT NOT NULL CONSTRAINT [StudySettings_defaultColumnCount_df] DEFAULT 7,
      [dayStartMinutes] INT NOT NULL CONSTRAINT [StudySettings_dayStartMinutes_df] DEFAULT 420,
      [dayEndMinutes] INT NOT NULL CONSTRAINT [StudySettings_dayEndMinutes_df] DEFAULT 1320,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [StudySettings_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAtUtc] DATETIME2 NOT NULL,
      CONSTRAINT [StudySettings_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [Workspace]([id]),
      CONSTRAINT [StudySettings_workspaceId_key] UNIQUE ([workspaceId])
    );
  END

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH
