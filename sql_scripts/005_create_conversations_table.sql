CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    other_user_id INT NOT NULL,
    last_message VARCHAR(255) NULL,
    last_message_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_conversations_other_user FOREIGN KEY (other_user_id) REFERENCES users(id),
    INDEX idx_conversations_user (user_id),
    INDEX idx_conversations_other_user (other_user_id)
);
