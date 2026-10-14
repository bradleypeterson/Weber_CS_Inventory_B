// Used by both fresh database initialization and the additive migration.
export const createUserSessionTable = `
  CREATE TABLE IF NOT EXISTS UserSession (
    SessionID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    UserID INT NOT NULL,
    LastActivityAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CreatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_user_session_user (UserID),
    INDEX idx_user_session_activity (LastActivityAt),
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
  );
`;
