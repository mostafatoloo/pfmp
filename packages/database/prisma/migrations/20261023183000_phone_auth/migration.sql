-- Better Auth phoneNumber plugin
-- Use EXEC for indexes so SQL Server sees the new columns (separate batch).
ALTER TABLE [user] ADD
  [phoneNumber] NVARCHAR(32) NULL,
  [phoneNumberVerified] BIT NOT NULL CONSTRAINT [user_phoneNumberVerified_df] DEFAULT 0;

EXEC(N'
CREATE UNIQUE NONCLUSTERED INDEX [user_phoneNumber_unique]
ON [user]([phoneNumber])
WHERE [phoneNumber] IS NOT NULL;
');

EXEC(N'
CREATE NONCLUSTERED INDEX [user_phoneNumber_idx] ON [user]([phoneNumber]);
');
