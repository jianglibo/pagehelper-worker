-- DROP TABLE IF EXISTS Customers;

CREATE TABLE IF NOT EXISTS Customers(
    id integer PRIMARY KEY AUTOINCREMENT,
    uid text NOT NULL,
    phApiKey text NOT NULL,
	apiKeyExpireAt integer,
    createdAt integer DEFAULT (strftime('%s', 'now'))
);

CREATE UNIQUE INDEX idx_unique_email ON Customers(uid);
CREATE UNIQUE INDEX idx_unique_apikey ON Customers(phApiKey);


