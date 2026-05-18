# MongoDB Setup

This backend uses MongoDB Atlas through Mongoose. Each developer needs a local `.env` file, but `.env` must never be committed to GitHub.

## Required Environment Variables

Create `backend/.env` from `.env.example`:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/4viso-dev?retryWrites=true&w=majority&appName=<app-name>
```

`4viso-dev` is the development database name. MongoDB creates it automatically after the first document is written.

## Recommended Atlas Settings

- Provider: AWS
- Region: Frankfurt `eu-central-1`
- Sample dataset: disabled
- Security quick setup: enabled

## Team Access

Use two layers of access:

1. Atlas project access for team members.
2. Database users for connecting from the backend or MongoDB Compass.

Recommended setup:

- Invite all team members to the Atlas project.
- Create one app database user for the backend with `readWrite` access to `4viso-dev`.
- If teammates need MongoDB Compass access, create separate database users for each teammate instead of sharing one personal password.
- Add each teammate's IP address in `Network Access`.

For a short classroom demo, `0.0.0.0/0` can be used temporarily in Network Access, but it should not be used for production.

## Local Check

After `.env` is configured:

```powershell
npm start
```

Expected result:

```text
MongoDB connected successfully
... SERVER IS RUNNING ON PORT 3000 ...
```

If MongoDB does not connect, check:

- The password is correct.
- The password is URL-encoded if it contains special characters.
- Your current IP address is allowed in Atlas Network Access.
- The connection string contains the database name: `/4viso-dev`.
