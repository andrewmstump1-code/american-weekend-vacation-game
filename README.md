# american-weekend-vacation-game
a 2D side-scrolling game for my software engineering class

## Local setup

1. Install dependencies:
   `npm install`
2. Create a Neon table for subscribers, for example:

   ```sql
   create table newsletter_subscribers (
     id serial primary key,
     email text not null unique,
     created_at timestamptz default now()
   );
   ```

3. Set `NEON_DB_URL` in your Vercel environment variables to the Neon connection string.
4. Deploy to Vercel so `/api/subscribe` can save landing page emails in Neon.

## How it works

- Users must enter a valid email before the game starts.
- The email is posted to `/api/subscribe`.
- If the API saves the email successfully, the game starts.
- If the API returns an error, the landing page shows the message and the game does not start.
