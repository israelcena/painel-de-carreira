# Document files are stored in Postgres

Uploaded Documents (CVs, up to 8 MB) are stored as bytes in the `documents` table instead of in object storage. The app runs both on Vercel with Neon and self-hosted with Docker Compose, and keeping files in the database means one storage backend, no extra credentials, and backups that include the files. This is fine for a single user's few CVs; if Documents grow in number or size, move them to object storage and keep only metadata in Postgres.
