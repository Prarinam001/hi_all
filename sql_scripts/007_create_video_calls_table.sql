CREATE TABLE video_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caller_id INT NOT NULL,
    receiver_id INT NOT NULL,
    call_type VARCHAR(50) NOT NULL, -- 'audio' or 'video'
    status VARCHAR(50) NOT NULL,    -- 'started', 'completed', 'missed', 'rejected'
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    duration INT NULL,               -- in seconds
    FOREIGN KEY (caller_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);
