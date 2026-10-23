BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[user] (
    [id] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(200) NOT NULL,
    [email] NVARCHAR(320) NOT NULL,
    [emailVerified] BIT NOT NULL CONSTRAINT [user_emailVerified_df] DEFAULT 0,
    [image] NVARCHAR(2000),
    [timezone] NVARCHAR(64) NOT NULL CONSTRAINT [user_timezone_df] DEFAULT 'UTC',
    [locale] NVARCHAR(16) NOT NULL CONSTRAINT [user_locale_df] DEFAULT 'en',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [user_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [user_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[session] (
    [id] NVARCHAR(36) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [token] NVARCHAR(255) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [session_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [ipAddress] NVARCHAR(64),
    [userAgent] NVARCHAR(512),
    [userId] NVARCHAR(36) NOT NULL,
    CONSTRAINT [session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [session_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[account] (
    [id] NVARCHAR(36) NOT NULL,
    [accountId] NVARCHAR(255) NOT NULL,
    [providerId] NVARCHAR(255) NOT NULL,
    [userId] NVARCHAR(36) NOT NULL,
    [accessToken] NVARCHAR(max),
    [refreshToken] NVARCHAR(max),
    [idToken] NVARCHAR(max),
    [accessTokenExpiresAt] DATETIME2,
    [refreshTokenExpiresAt] DATETIME2,
    [scope] NVARCHAR(1000),
    [password] NVARCHAR(255),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [account_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [account_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[verification] (
    [id] NVARCHAR(36) NOT NULL,
    [identifier] NVARCHAR(255) NOT NULL,
    [value] NVARCHAR(255) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [verification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [verification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[passkey] (
    [id] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(200),
    [publicKey] NVARCHAR(max) NOT NULL,
    [userId] NVARCHAR(36) NOT NULL,
    [credentialID] NVARCHAR(512) NOT NULL,
    [counter] INT NOT NULL,
    [deviceType] NVARCHAR(64) NOT NULL,
    [backedUp] BIT NOT NULL,
    [transports] NVARCHAR(255),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [passkey_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [aaguid] NVARCHAR(64),
    CONSTRAINT [passkey_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Workspace] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(200) NOT NULL,
    [kind] NVARCHAR(32) NOT NULL CONSTRAINT [Workspace_kind_df] DEFAULT 'personal',
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Workspace_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [Workspace_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[WorkspaceMember] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [userId] NVARCHAR(36) NOT NULL,
    [role] NVARCHAR(32) NOT NULL CONSTRAINT [WorkspaceMember_role_df] DEFAULT 'owner',
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [WorkspaceMember_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [WorkspaceMember_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [WorkspaceMember_workspaceId_userId_key] UNIQUE NONCLUSTERED ([workspaceId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Task] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [title] NVARCHAR(500) NOT NULL,
    [notes] NVARCHAR(max),
    [status] NVARCHAR(32) NOT NULL,
    [dueAtUtc] DATETIME2,
    [originalDueAtUtc] DATETIME2,
    [completedAtUtc] DATETIME2,
    [projectId] UNIQUEIDENTIFIER,
    [courseId] UNIQUEIDENTIFIER,
    [priority] INT,
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Task_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [Task_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TaskHistory] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [taskId] UNIQUEIDENTIFIER NOT NULL,
    [eventType] NVARCHAR(64) NOT NULL,
    [fromJson] NVARCHAR(max),
    [toJson] NVARCHAR(max),
    [actorUserId] NVARCHAR(36) NOT NULL,
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [TaskHistory_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TaskHistory_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(300) NOT NULL,
    [description] NVARCHAR(max),
    [billable] BIT NOT NULL CONSTRAINT [Project_billable_df] DEFAULT 0,
    [status] NVARCHAR(32) NOT NULL CONSTRAINT [Project_status_df] DEFAULT 'active',
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Project_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Activity] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [projectId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(300) NOT NULL,
    [notes] NVARCHAR(max),
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Activity_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [Activity_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Term] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(200) NOT NULL,
    [startsOn] DATE NOT NULL,
    [endsOn] DATE NOT NULL,
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Term_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [Term_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Course] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [termId] UNIQUEIDENTIFIER NOT NULL,
    [code] NVARCHAR(64),
    [title] NVARCHAR(300) NOT NULL,
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Course_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [Course_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Topic] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [courseId] UNIQUEIDENTIFIER NOT NULL,
    [title] NVARCHAR(300) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [Topic_sortOrder_df] DEFAULT 0,
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Topic_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [Topic_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Assessment] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [courseId] UNIQUEIDENTIFIER NOT NULL,
    [title] NVARCHAR(300) NOT NULL,
    [dueAtUtc] DATETIME2,
    [weightPercent] DECIMAL(5,2),
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Assessment_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [Assessment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TopicProgress] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [topicId] UNIQUEIDENTIFIER NOT NULL,
    [measureType] NVARCHAR(32) NOT NULL,
    [plannedValue] DECIMAL(18,4),
    [actualValue] DECIMAL(18,4),
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [TopicProgress_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TopicProgress_topicId_key] UNIQUE NONCLUSTERED ([topicId])
);

-- CreateTable
CREATE TABLE [dbo].[ScheduleVersion] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [label] NVARCHAR(200),
    [source] NVARCHAR(32) NOT NULL,
    [effectiveFromUtc] DATETIME2,
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [ScheduleVersion_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [supersededAtUtc] DATETIME2,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [ScheduleVersion_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ScheduleItem] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [scheduleVersionId] UNIQUEIDENTIFIER NOT NULL,
    [title] NVARCHAR(500) NOT NULL,
    [startsAtUtc] DATETIME2 NOT NULL,
    [endsAtUtc] DATETIME2 NOT NULL,
    [durationSeconds] INT NOT NULL,
    [taskId] UNIQUEIDENTIFIER,
    [courseId] UNIQUEIDENTIFIER,
    [topicId] UNIQUEIDENTIFIER,
    [projectId] UNIQUEIDENTIFIER,
    [constraintJson] NVARCHAR(max),
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [ScheduleItem_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [ScheduleItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PlanProposal] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [status] NVARCHAR(32) NOT NULL,
    [promptSummary] NVARCHAR(max),
    [proposalJson] NVARCHAR(max) NOT NULL,
    [explanation] NVARCHAR(max),
    [modelProvider] NVARCHAR(64),
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [PlanProposal_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [resolvedAtUtc] DATETIME2,
    [resolvedByUserId] NVARCHAR(36),
    CONSTRAINT [PlanProposal_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TimeEntry] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [startedAtUtc] DATETIME2 NOT NULL,
    [endedAtUtc] DATETIME2,
    [durationSeconds] INT,
    [source] NVARCHAR(32) NOT NULL,
    [taskId] UNIQUEIDENTIFIER,
    [projectId] UNIQUEIDENTIFIER,
    [courseId] UNIQUEIDENTIFIER,
    [topicId] UNIQUEIDENTIFIER,
    [note] NVARCHAR(max),
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [TimeEntry_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [TimeEntry_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ActiveTimer] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [startedAtUtc] DATETIME2 NOT NULL,
    [taskId] UNIQUEIDENTIFIER,
    [projectId] UNIQUEIDENTIFIER,
    [note] NVARCHAR(max),
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [ActiveTimer_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ActiveTimer_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ActiveTimer_workspaceId_key] UNIQUE NONCLUSTERED ([workspaceId])
);

-- CreateTable
CREATE TABLE [dbo].[PomodoroConfig] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [workSeconds] INT NOT NULL CONSTRAINT [PomodoroConfig_workSeconds_df] DEFAULT 1500,
    [shortBreakSeconds] INT NOT NULL CONSTRAINT [PomodoroConfig_shortBreakSeconds_df] DEFAULT 300,
    [longBreakSeconds] INT NOT NULL CONSTRAINT [PomodoroConfig_longBreakSeconds_df] DEFAULT 900,
    [longBreakEvery] INT NOT NULL CONSTRAINT [PomodoroConfig_longBreakEvery_df] DEFAULT 4,
    [updatedAtUtc] DATETIME2 NOT NULL,
    CONSTRAINT [PomodoroConfig_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PomodoroConfig_workspaceId_key] UNIQUE NONCLUSTERED ([workspaceId])
);

-- CreateTable
CREATE TABLE [dbo].[PomodoroSession] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [kind] NVARCHAR(32) NOT NULL,
    [startedAtUtc] DATETIME2 NOT NULL,
    [endedAtUtc] DATETIME2,
    [durationSeconds] INT,
    [timeEntryId] UNIQUEIDENTIFIER,
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [PomodoroSession_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [PomodoroSession_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Notification] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [userId] NVARCHAR(36) NOT NULL,
    [channel] NVARCHAR(32) NOT NULL CONSTRAINT [Notification_channel_df] DEFAULT 'in_app',
    [title] NVARCHAR(300) NOT NULL,
    [body] NVARCHAR(max),
    [readAtUtc] DATETIME2,
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Notification_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [Notification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Job] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [type] NVARCHAR(64) NOT NULL,
    [payloadJson] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(32) NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER,
    [attempts] INT NOT NULL CONSTRAINT [Job_attempts_df] DEFAULT 0,
    [runAfterUtc] DATETIME2 NOT NULL,
    [lockedAtUtc] DATETIME2,
    [lockedBy] NVARCHAR(128),
    [lastError] NVARCHAR(max),
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [Job_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAtUtc] DATETIME2 NOT NULL,
    CONSTRAINT [Job_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ExportArtifact] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workspaceId] UNIQUEIDENTIFIER NOT NULL,
    [jobId] UNIQUEIDENTIFIER,
    [format] NVARCHAR(16) NOT NULL,
    [storagePath] NVARCHAR(1000) NOT NULL,
    [expiresAtUtc] DATETIME2,
    [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [ExportArtifact_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAtUtc] DATETIME2,
    CONSTRAINT [ExportArtifact_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [session_userId_idx] ON [dbo].[session]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [account_userId_idx] ON [dbo].[account]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [verification_identifier_idx] ON [dbo].[verification]([identifier]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [passkey_userId_idx] ON [dbo].[passkey]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [passkey_credentialID_idx] ON [dbo].[passkey]([credentialID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkspaceMember_userId_idx] ON [dbo].[WorkspaceMember]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_workspaceId_status_dueAtUtc_idx] ON [dbo].[Task]([workspaceId], [status], [dueAtUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_workspaceId_updatedAtUtc_idx] ON [dbo].[Task]([workspaceId], [updatedAtUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskHistory_taskId_createdAtUtc_idx] ON [dbo].[TaskHistory]([taskId], [createdAtUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Project_workspaceId_idx] ON [dbo].[Project]([workspaceId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Activity_workspaceId_projectId_idx] ON [dbo].[Activity]([workspaceId], [projectId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Term_workspaceId_idx] ON [dbo].[Term]([workspaceId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Course_workspaceId_termId_idx] ON [dbo].[Course]([workspaceId], [termId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Topic_courseId_sortOrder_idx] ON [dbo].[Topic]([courseId], [sortOrder]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Assessment_workspaceId_courseId_idx] ON [dbo].[Assessment]([workspaceId], [courseId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScheduleVersion_workspaceId_createdAtUtc_idx] ON [dbo].[ScheduleVersion]([workspaceId], [createdAtUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScheduleItem_workspaceId_startsAtUtc_endsAtUtc_idx] ON [dbo].[ScheduleItem]([workspaceId], [startsAtUtc], [endsAtUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScheduleItem_scheduleVersionId_startsAtUtc_idx] ON [dbo].[ScheduleItem]([scheduleVersionId], [startsAtUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PlanProposal_workspaceId_status_createdAtUtc_idx] ON [dbo].[PlanProposal]([workspaceId], [status], [createdAtUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TimeEntry_workspaceId_startedAtUtc_idx] ON [dbo].[TimeEntry]([workspaceId], [startedAtUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PomodoroSession_workspaceId_startedAtUtc_idx] ON [dbo].[PomodoroSession]([workspaceId], [startedAtUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notification_userId_createdAtUtc_idx] ON [dbo].[Notification]([userId], [createdAtUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Job_status_runAfterUtc_idx] ON [dbo].[Job]([status], [runAfterUtc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ExportArtifact_workspaceId_createdAtUtc_idx] ON [dbo].[ExportArtifact]([workspaceId], [createdAtUtc]);

-- AddForeignKey
ALTER TABLE [dbo].[session] ADD CONSTRAINT [session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[account] ADD CONSTRAINT [account_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[passkey] ADD CONSTRAINT [passkey_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WorkspaceMember] ADD CONSTRAINT [WorkspaceMember_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WorkspaceMember] ADD CONSTRAINT [WorkspaceMember_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskHistory] ADD CONSTRAINT [TaskHistory_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskHistory] ADD CONSTRAINT [TaskHistory_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Activity] ADD CONSTRAINT [Activity_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Term] ADD CONSTRAINT [Term_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Course] ADD CONSTRAINT [Course_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Course] ADD CONSTRAINT [Course_termId_fkey] FOREIGN KEY ([termId]) REFERENCES [dbo].[Term]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Topic] ADD CONSTRAINT [Topic_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Topic] ADD CONSTRAINT [Topic_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Assessment] ADD CONSTRAINT [Assessment_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Assessment] ADD CONSTRAINT [Assessment_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TopicProgress] ADD CONSTRAINT [TopicProgress_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TopicProgress] ADD CONSTRAINT [TopicProgress_topicId_fkey] FOREIGN KEY ([topicId]) REFERENCES [dbo].[Topic]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScheduleVersion] ADD CONSTRAINT [ScheduleVersion_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScheduleItem] ADD CONSTRAINT [ScheduleItem_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScheduleItem] ADD CONSTRAINT [ScheduleItem_scheduleVersionId_fkey] FOREIGN KEY ([scheduleVersionId]) REFERENCES [dbo].[ScheduleVersion]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PlanProposal] ADD CONSTRAINT [PlanProposal_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TimeEntry] ADD CONSTRAINT [TimeEntry_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ActiveTimer] ADD CONSTRAINT [ActiveTimer_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PomodoroConfig] ADD CONSTRAINT [PomodoroConfig_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PomodoroSession] ADD CONSTRAINT [PomodoroSession_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Job] ADD CONSTRAINT [Job_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ExportArtifact] ADD CONSTRAINT [ExportArtifact_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
