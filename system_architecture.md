# System Architecture: Admin Panel & Discord Bot Integration

## 1. Overview
This system integrates a Next.js Admin Panel with a Serverless Discord Bot to automate esports tournament management. The core philosophy is **Event-Driven Automation**: specific actions in the Admin Panel (e.g., "Create Group") trigger database updates, which then trigger Discord actions (e.g., "Create Channel").

## 2. Database Schema (Supabase/PostgreSQL)

### A. Core Tournament Tables (Existing & Enhanced)
-   **`tournaments`**:
    -   `id` (PK)
    -   `name`, `game`, `start_date`
    -   `owner_id` (FK to profiles, for Admin permission)
    -   `discord_category_id` (Text, stores the Discord Category ID)
    -   `status` (enum: 'draft', 'open', 'ongoing', 'completed')

-   **`groups`** (New):
    -   `id` (PK)
    -   `tournament_id` (FK)
    -   `name` (e.g., "Group A")
    -   `discord_channel_id` (Text)

-   **`group_teams`** (New - Junction Table):
    -   `group_id` (FK)
    -   `team_id` (FK)
    -   `tournament_id` (FK)
    -   `status` (enum: 'pending', 'qualified', 'disqualified', 'eliminated')
    -   `points` (for leaderboard)

-   **`matches`** (New):
    -   `id` (PK)
    -   `tournament_id` (FK)
    -   `group_id` (FK, nullable for final stages)
    -   `stage` (Text, e.g., "Quarterfinals")
    -   `team_a_id`, `team_b_id` (FK, nullable)
    -   `room_id`, `room_password` (Private info)
    -   `start_time` (Timestamp)

### B. Discord Mapping
-   **`user_discord_mappings`** (New):
    -   `user_id` (FK to profiles)
    -   `discord_user_id` (Text)

## 3. Discord Bot Logic (Serverless)

### Architecture
We use the **Interaction Endpoint** for receiving commands and **Supabase Edge Functions** (or Next.js API Routes triggered by webhooks) for proactive actions.

### Automation Flows

#### A. Tournament Creation
1.  **Admin Panel**: Admin creates a tournament.
2.  **Logic**: `tournaments` row inserted.
3.  **Trigger**: API Route calls Discord API -> `POST /guilds/{guild.id}/channels` (Type: Category).
4.  **Save**: `discord_category_id` saved to `tournaments` table.

#### B. Group Generation & Channel Creation
1.  **Admin Panel**: Admin clicks "Generate Groups".
2.  **Logic**: System reshuffles registered teams into chunks of 12. Inserts into `groups` table.
3.  **Trigger**: For each new group:
    -   Create Discord Text Channel under `discord_category_id`.
    -   **Permissions**:
        -   `@everyone`: Deny View.
        -   `Tournament Admin Role`: Allow View/Manage.
        -   `Team Members`: Allow View/Send (via specialized role or user overrides).
    -   Save `discord_channel_id`.

#### C. User Access Control
-   When a user joins a Team on the web platform, they must link their Discord account.
-   The bot adds the user to the relevant Discord Channel Overrides based on their team's group assignment.

## 4. Admin Panel Features & Permissions

### Role-Based Access Control (RBAC)
-   **Super Admin**: Access everything.
-   **Admin**: Access only tournaments where `tournaments.owner_id == auth.uid()`.

### Qualification Flow UI
-   **View**: Table of teams in a group.
-   **Actions**:
    -   "Qualify" Button -> Opens Modal: "Select Next Stage" (e.g., Semi-Finals).
    -   "Disqualify" Button -> Confirms removal.
-   **Backend**: Updates `group_teams.status`.
    -   *Automation*: If qualified, auto-adds team to the next stage's pool/group.

## 5. Security
-   All sensitive actions (delete tournament, dq team) require a "Double Confirmation" modal.
-   Discord Actions rely on a secure `DISCORD_BOT_TOKEN` stored in env vars.
