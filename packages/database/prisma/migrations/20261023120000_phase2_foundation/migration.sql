-- Phase 2 foundation (SQL Server)
-- Additive only — preserves Phase 1 data

BEGIN TRY
  BEGIN TRAN;

  -- User preference columns
  IF COL_LENGTH('user', 'calendarSystem') IS NULL
    ALTER TABLE [user] ADD [calendarSystem] NVARCHAR(32) NOT NULL CONSTRAINT [user_calendarSystem_df] DEFAULT 'gregory';
  IF COL_LENGTH('user', 'aiAssistantEnabled') IS NULL
    ALTER TABLE [user] ADD [aiAssistantEnabled] BIT NOT NULL CONSTRAINT [user_aiAssistantEnabled_df] DEFAULT 1;
  IF COL_LENGTH('user', 'quietHoursStart') IS NULL
    ALTER TABLE [user] ADD [quietHoursStart] NVARCHAR(5) NULL;
  IF COL_LENGTH('user', 'quietHoursEnd') IS NULL
    ALTER TABLE [user] ADD [quietHoursEnd] NVARCHAR(5) NULL;

  -- Task recurrence / ownership
  IF COL_LENGTH('Task', 'createdByUserId') IS NULL
    ALTER TABLE [Task] ADD [createdByUserId] NVARCHAR(36) NULL;
  IF COL_LENGTH('Task', 'recurrenceRuleJson') IS NULL
    ALTER TABLE [Task] ADD [recurrenceRuleJson] NVARCHAR(MAX) NULL;
  IF COL_LENGTH('Task', 'recurrenceParentId') IS NULL
    ALTER TABLE [Task] ADD [recurrenceParentId] UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH('Task', 'isRecurrenceTemplate') IS NULL
    ALTER TABLE [Task] ADD [isRecurrenceTemplate] BIT NOT NULL CONSTRAINT [Task_isRecurrenceTemplate_df] DEFAULT 0;

  IF OBJECT_ID(N'[WorkspaceInvite]', N'U') IS NULL
  BEGIN
    CREATE TABLE [WorkspaceInvite] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [WorkspaceInvite_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [workspaceId] UNIQUEIDENTIFIER NOT NULL,
      [email] NVARCHAR(320) NOT NULL,
      [role] NVARCHAR(32) NOT NULL CONSTRAINT [WorkspaceInvite_role_df] DEFAULT 'member',
      [tokenHash] NVARCHAR(128) NOT NULL,
      [expiresAtUtc] DATETIME2 NOT NULL,
      [acceptedAtUtc] DATETIME2 NULL,
      [declinedAtUtc] DATETIME2 NULL,
      [invitedByUserId] NVARCHAR(36) NOT NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [WorkspaceInvite_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [WorkspaceInvite_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [Workspace]([id]),
      CONSTRAINT [WorkspaceInvite_invitedByUserId_fkey] FOREIGN KEY ([invitedByUserId]) REFERENCES [user]([id])
    );
    CREATE UNIQUE INDEX [WorkspaceInvite_tokenHash_key] ON [WorkspaceInvite]([tokenHash]);
    CREATE INDEX [WorkspaceInvite_workspaceId_idx] ON [WorkspaceInvite]([workspaceId]);
    CREATE INDEX [WorkspaceInvite_email_idx] ON [WorkspaceInvite]([email]);
  END

  IF OBJECT_ID(N'[TaskAssignment]', N'U') IS NULL
  BEGIN
    CREATE TABLE [TaskAssignment] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [TaskAssignment_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [taskId] UNIQUEIDENTIFIER NOT NULL,
      [workspaceId] UNIQUEIDENTIFIER NOT NULL,
      [assigneeUserId] NVARCHAR(36) NOT NULL,
      [assignedByUserId] NVARCHAR(36) NOT NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [TaskAssignment_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [TaskAssignment_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [Task]([id]),
      CONSTRAINT [TaskAssignment_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [Workspace]([id]),
      CONSTRAINT [TaskAssignment_assigneeUserId_fkey] FOREIGN KEY ([assigneeUserId]) REFERENCES [user]([id]),
      CONSTRAINT [TaskAssignment_assignedByUserId_fkey] FOREIGN KEY ([assignedByUserId]) REFERENCES [user]([id])
    );
    CREATE UNIQUE INDEX [TaskAssignment_taskId_assigneeUserId_key] ON [TaskAssignment]([taskId], [assigneeUserId]);
    CREATE INDEX [TaskAssignment_workspaceId_idx] ON [TaskAssignment]([workspaceId]);
  END

  IF OBJECT_ID(N'[MealPlan]', N'U') IS NULL
  BEGIN
    CREATE TABLE [MealPlan] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [MealPlan_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [workspaceId] UNIQUEIDENTIFIER NOT NULL,
      [weekStartDate] DATE NOT NULL,
      [title] NVARCHAR(300) NULL,
      [createdByUserId] NVARCHAR(36) NOT NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [MealPlan_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAtUtc] DATETIME2 NOT NULL,
      [deletedAtUtc] DATETIME2 NULL,
      CONSTRAINT [MealPlan_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [Workspace]([id])
    );
    CREATE INDEX [MealPlan_workspaceId_weekStartDate_idx] ON [MealPlan]([workspaceId], [weekStartDate]);
  END

  IF OBJECT_ID(N'[MealEntry]', N'U') IS NULL
  BEGIN
    CREATE TABLE [MealEntry] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [MealEntry_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [mealPlanId] UNIQUEIDENTIFIER NOT NULL,
      [workspaceId] UNIQUEIDENTIFIER NOT NULL,
      [mealDate] DATE NOT NULL,
      [category] NVARCHAR(32) NOT NULL,
      [title] NVARCHAR(300) NOT NULL,
      [notes] NVARCHAR(MAX) NULL,
      [status] NVARCHAR(32) NOT NULL CONSTRAINT [MealEntry_status_df] DEFAULT 'planned',
      [preparedByUserId] NVARCHAR(36) NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [MealEntry_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAtUtc] DATETIME2 NOT NULL,
      CONSTRAINT [MealEntry_mealPlanId_fkey] FOREIGN KEY ([mealPlanId]) REFERENCES [MealPlan]([id]),
      CONSTRAINT [MealEntry_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [Workspace]([id])
    );
    CREATE INDEX [MealEntry_mealPlanId_mealDate_idx] ON [MealEntry]([mealPlanId], [mealDate]);
  END

  IF OBJECT_ID(N'[ShoppingList]', N'U') IS NULL
  BEGIN
    CREATE TABLE [ShoppingList] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ShoppingList_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [workspaceId] UNIQUEIDENTIFIER NOT NULL,
      [mealPlanId] UNIQUEIDENTIFIER NULL,
      [title] NVARCHAR(300) NOT NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [ShoppingList_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAtUtc] DATETIME2 NOT NULL,
      CONSTRAINT [ShoppingList_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [Workspace]([id]),
      CONSTRAINT [ShoppingList_mealPlanId_fkey] FOREIGN KEY ([mealPlanId]) REFERENCES [MealPlan]([id])
    );
    CREATE INDEX [ShoppingList_workspaceId_idx] ON [ShoppingList]([workspaceId]);
  END

  IF OBJECT_ID(N'[ShoppingItem]', N'U') IS NULL
  BEGIN
    CREATE TABLE [ShoppingItem] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ShoppingItem_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [shoppingListId] UNIQUEIDENTIFIER NOT NULL,
      [workspaceId] UNIQUEIDENTIFIER NOT NULL,
      [name] NVARCHAR(300) NOT NULL,
      [quantity] NVARCHAR(64) NULL,
      [unit] NVARCHAR(64) NULL,
      [checkedAtUtc] DATETIME2 NULL,
      [mealEntryId] UNIQUEIDENTIFIER NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [ShoppingItem_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [ShoppingItem_shoppingListId_fkey] FOREIGN KEY ([shoppingListId]) REFERENCES [ShoppingList]([id]),
      CONSTRAINT [ShoppingItem_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [Workspace]([id]),
      CONSTRAINT [ShoppingItem_mealEntryId_fkey] FOREIGN KEY ([mealEntryId]) REFERENCES [MealEntry]([id])
    );
    CREATE INDEX [ShoppingItem_shoppingListId_idx] ON [ShoppingItem]([shoppingListId]);
  END

  IF OBJECT_ID(N'[TelegramLink]', N'U') IS NULL
  BEGIN
    CREATE TABLE [TelegramLink] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [TelegramLink_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [userId] NVARCHAR(36) NOT NULL,
      [telegramUserId] NVARCHAR(64) NOT NULL,
      [chatId] NVARCHAR(64) NOT NULL,
      [linkedAtUtc] DATETIME2 NOT NULL CONSTRAINT [TelegramLink_linkedAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      [unlinkedAtUtc] DATETIME2 NULL,
      CONSTRAINT [TelegramLink_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [user]([id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [TelegramLink_userId_key] ON [TelegramLink]([userId]);
  END

  IF OBJECT_ID(N'[TelegramLinkToken]', N'U') IS NULL
  BEGIN
    CREATE TABLE [TelegramLinkToken] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [TelegramLinkToken_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [userId] NVARCHAR(36) NOT NULL,
      [tokenHash] NVARCHAR(128) NOT NULL,
      [expiresAtUtc] DATETIME2 NOT NULL,
      [usedAtUtc] DATETIME2 NULL,
      CONSTRAINT [TelegramLinkToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [user]([id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [TelegramLinkToken_tokenHash_key] ON [TelegramLinkToken]([tokenHash]);
    CREATE INDEX [TelegramLinkToken_userId_idx] ON [TelegramLinkToken]([userId]);
  END

  IF OBJECT_ID(N'[NotificationPreference]', N'U') IS NULL
  BEGIN
    CREATE TABLE [NotificationPreference] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [NotificationPreference_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [userId] NVARCHAR(36) NOT NULL,
      [category] NVARCHAR(64) NOT NULL,
      [channel] NVARCHAR(32) NOT NULL,
      [enabled] BIT NOT NULL CONSTRAINT [NotificationPreference_enabled_df] DEFAULT 1,
      [leadMinutes] INT NULL,
      CONSTRAINT [NotificationPreference_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [user]([id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [NotificationPreference_userId_category_channel_key]
      ON [NotificationPreference]([userId], [category], [channel]);
  END

  IF OBJECT_ID(N'[NotificationDelivery]', N'U') IS NULL
  BEGIN
    CREATE TABLE [NotificationDelivery] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [NotificationDelivery_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [notificationId] UNIQUEIDENTIFIER NULL,
      [userId] NVARCHAR(36) NOT NULL,
      [channel] NVARCHAR(32) NOT NULL,
      [idempotencyKey] NVARCHAR(255) NOT NULL,
      [status] NVARCHAR(32) NOT NULL,
      [providerMessageId] NVARCHAR(255) NULL,
      [attempts] INT NOT NULL CONSTRAINT [NotificationDelivery_attempts_df] DEFAULT 0,
      [lastError] NVARCHAR(MAX) NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [NotificationDelivery_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      [sentAtUtc] DATETIME2 NULL,
      CONSTRAINT [NotificationDelivery_notificationId_fkey] FOREIGN KEY ([notificationId]) REFERENCES [Notification]([id]),
      CONSTRAINT [NotificationDelivery_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [user]([id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [NotificationDelivery_idempotencyKey_key] ON [NotificationDelivery]([idempotencyKey]);
    CREATE INDEX [NotificationDelivery_userId_createdAtUtc_idx] ON [NotificationDelivery]([userId], [createdAtUtc]);
  END

  IF OBJECT_ID(N'[AiConversation]', N'U') IS NULL
  BEGIN
    CREATE TABLE [AiConversation] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [AiConversation_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [workspaceId] UNIQUEIDENTIFIER NOT NULL,
      [userId] NVARCHAR(36) NOT NULL,
      [title] NVARCHAR(300) NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [AiConversation_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [AiConversation_workspaceId_fkey] FOREIGN KEY ([workspaceId]) REFERENCES [Workspace]([id]),
      CONSTRAINT [AiConversation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [user]([id]) ON DELETE CASCADE
    );
    CREATE INDEX [AiConversation_workspaceId_userId_idx] ON [AiConversation]([workspaceId], [userId]);
  END

  IF OBJECT_ID(N'[AiMessage]', N'U') IS NULL
  BEGIN
    CREATE TABLE [AiMessage] (
      [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [AiMessage_pkey] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
      [conversationId] UNIQUEIDENTIFIER NOT NULL,
      [role] NVARCHAR(32) NOT NULL,
      [content] NVARCHAR(MAX) NOT NULL,
      [metadataJson] NVARCHAR(MAX) NULL,
      [createdAtUtc] DATETIME2 NOT NULL CONSTRAINT [AiMessage_createdAtUtc_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [AiMessage_conversationId_fkey] FOREIGN KEY ([conversationId]) REFERENCES [AiConversation]([id]) ON DELETE CASCADE
    );
    CREATE INDEX [AiMessage_conversationId_createdAtUtc_idx] ON [AiMessage]([conversationId], [createdAtUtc]);
  END

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH
