CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    sender_id INT NOT NULL,
    group_id INT NULL,
    recipient_id INT NULL,
    reply_to_id INT NULL,
    reply_to_content VARCHAR(255) NULL,
    reply_to_sender VARCHAR(255) NULL,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id),
    CONSTRAINT fk_messages_group FOREIGN KEY (group_id) REFERENCES `groups`(id),
    CONSTRAINT fk_messages_recipient FOREIGN KEY (recipient_id) REFERENCES users(id)
);
