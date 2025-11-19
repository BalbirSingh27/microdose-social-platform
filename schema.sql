CREATE TABLE users_social (
id SERIAL PRIMARY KEY,
platform VARCHAR(50),
platform_user_id VARCHAR(100) UNIQUE,
username VARCHAR(100),
display_name VARCHAR(150),
followers_count INT,
karma_score INT,
is_influencer BOOLEAN DEFAULT FALSE,
last_seen_at TIMESTAMP,
raw_user_json JSONB
);

CREATE TABLE posts (
id SERIAL PRIMARY KEY,
platform VARCHAR(50),
platform_post_id VARCHAR(100) UNIQUE,
user_id INT REFERENCES users_social(id),
url TEXT,
title TEXT,
text TEXT,
created_at_utc TIMESTAMP,
likes INT,
comments INT,
shares INT,
sentiment VARCHAR(20),
topic_tags TEXT[],
status VARCHAR(20),
raw_post_json JSONB
);

CREATE TABLE suggestions (
id SERIAL PRIMARY KEY,
post_id INT REFERENCES posts(id),
tone VARCHAR(50),
text_original TEXT,
safety_flags TEXT[],
created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE approvals (
id SERIAL PRIMARY KEY,
suggestion_id INT REFERENCES suggestions(id),
approver VARCHAR(100),
action VARCHAR(20),
edited_text TEXT,
timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE publish_logs (
id SERIAL PRIMARY KEY,
suggestion_id INT REFERENCES suggestions(id),
platform VARCHAR(50),
response_code INT,
response_body JSONB,
posted_at TIMESTAMP,
status VARCHAR(20)
);

CREATE TABLE settings (
id SERIAL PRIMARY KEY,
key VARCHAR(100) UNIQUE,
value JSONB,
updated_at TIMESTAMP DEFAULT NOW()
);
