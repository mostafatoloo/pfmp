-- Better Auth username plugin (login id). Phone remains for SMS password reset only.
ALTER TABLE [user] ADD [username] NVARCHAR(64) NULL;

EXEC(N'
CREATE UNIQUE NONCLUSTERED INDEX [user_username_key]
ON [user]([username])
WHERE [username] IS NOT NULL;
');
