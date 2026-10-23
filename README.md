# Trello Backend Mock

A backend service for a Trello-inspired project and task management application built with **Node.js**, **Express**, and **MongoDB (Mongoose)**. It supports user authentication, organization creation, team member management, project boards (dashboards), and ticket creation with status tracking.

---

## Features

- **User Authentication**: Sign up and sign in with JWT-based authentication stored in HTTP cookies.
- **Organization Management**: Create, view, and delete organizations with admin ownership.
- **Member Management**: Organization admins can add and remove registered users as organization members and list all members.
- **Board (Dashboard) Management**: Create and list boards associated with specific organizations.
- **Ticket Creation**: Create tickets inside boards, assign them to registered users, and initialize their status as `pending`.
- **Basic HTML Test Views**: Simple frontend pages (`signup.html`, `signin.html`, `createorg.html`, `showorg.html`) to test authentication and organization flows.

---

## Tech Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express (`^5.2.1`)
- **Database**: MongoDB with Mongoose (`^9.10.2`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`, `cookie-parser`)
- **Environment & Middleware**: `dotenv`, `cors`
- **HTTP Client (Frontend views)**: `axios`

---

## Project Structure

```text
week10-trello/
├── index.js          # Express server and API route handlers
├── databases.js      # Mongoose connection and schema/model definitions
├── middleware.js     # JWT cookie authentication middleware
├── signup.html       # Basic UI for user registration
├── signin.html       # Basic UI for user login
├── createorg.html    # Basic UI for creating and viewing organizations
├── showorg.html      # Basic UI for listing organizations and adding members
├── package.json      # Project dependencies and metadata
└── .env              # Environment variables (MONGODB_URI)
```

---

## Database Schemas (`databases.js`)

1. **Users (`USERS`)**
   - `username`: `String`
   - `password`: `String`

2. **Organisations (`ORGANISATIONS`)**
   - `orgname`: `String`
   - `description`: `String`
   - `admin`: `ObjectId` (User reference)
   - `members`: `[ObjectId]` (Array of User references)

3. **Boards (`Boards`)**
   - `title`: `String`
   - `description`: `String`
   - `orgId`: `ObjectId` (Organization reference)
   - `createdBy`: `ObjectId` (User reference)
   - `tickets`: `[ObjectId]` (Array of Ticket references)

4. **Tickets (`tickets`)**
   - `note`: `String`
   - `details`: `String`
   - `assignedPerson`: `ObjectId` (User reference)
   - `boardId`: `ObjectId` (Board reference)
   - `createdBy`: `ObjectId` (User reference)
   - `status`: `String` (Default: `"pending"`)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) instance (local or MongoDB Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sohail4291/trello_backend.git
   cd week10-trello
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory and add your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>
   ```

4. **Start the server:**
   ```bash
   node index.js
   ```
   The server will start on `http://localhost:3000`.

---

## API Endpoints

### Authentication & Pages

| Method | Endpoint | Auth Required | Description | Request Body |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/signup` | No | Register a new user | `{ "username": "...", "password": "..." }` |
| `POST` | `/signin` | No | Authenticate user & set `token` cookie | `{ "username": "...", "password": "..." }` |
| `GET` | `/signup` | No | Serve signup HTML page | - |
| `GET` | `/signin` | No | Serve signin HTML page | - |
| `GET` | `/create-organisation` | No | Serve create organization HTML page | - |
| `GET` | `/show-org` | No | Serve show organization HTML page | - |

### Organizations & Members

| Method | Endpoint | Auth Required | Description | Request Body |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/create-organisation` | Yes | Create a new organization | `{ "orgname": "...", "description": "..." }` |
| `GET` | `/get-organisations` | Yes | Get organizations where current user is admin | - |
| `DELETE` | `/delete-organisation/:orgId` | Yes | Delete an organization by ID | - |
| `PUT` | `/add-member/:orgId` | Yes | Add a registered user to an organization (Admin only) | `{ "member": "<username>" }` |
| `GET` | `/get-members/:orgId` | Yes | Get all member IDs of an organization | - |
| `DELETE` | `/delete-member/:userId` | Yes | Remove a member from an organization | `{ "orgname": "..." }` |

### Boards (Dashboards) & Tickets

| Method | Endpoint | Auth Required | Description | Request Body |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/dashboard/:orgId` | Yes | Create a new board inside an organization | `{ "title": "...", "description": "..." }` |
| `GET` | `/get-dashboards/:orgId` | Yes | Get all boards for an organization | - |
| `DELETE` | `/delete-dashboard/:boardId` | Yes | Delete a board by ID *(in-memory stub)* | - |
| `POST` | `/add-ticket/:boardId` | Yes | Create a ticket in a board & assign to a user | `{ "note": "...", "details": "...", "assignedPerson": "<username>" }` |

---

## Future Work & Roadmap (Tickets & Resolution)

The core models and ticket creation flow are in place, with the following features planned for upcoming iterations:

- **Ticket Status & Resolution Workflow**:
  - Add endpoints (`PUT /update-ticket-status/:ticketId` or `PATCH /tickets/:ticketId/resolve`) to transition tickets across the 3 workflow stages: `pending` -> `inprogress` -> `done`.
  - Allow assigned members or organization admins to mark tickets as resolved/completed.
- **Fetching & Filtering Tickets**:
  - Implement `GET /get-tickets/:boardId` to retrieve all tickets for a specific board, grouped or filtered by status tabs (`pending`, `inprogress`, `done`).
  - Populate `assignedPerson` and `createdBy` user details when returning tickets.
- **Ticket Editing & Deletion**:
  - Add routes to update ticket descriptions/notes, reassign tickets to different organization members, and delete tickets (`DELETE /delete-ticket/:ticketId`) while removing their reference from the parent board's `tickets` array.
- **Board Deletion Persistence**:
  - Migrate `DELETE /delete-dashboard/:boardId` from the legacy in-memory `BOARDS` array to MongoDB (`boardModel.deleteOne`) and cascade-delete associated tickets.
- **Security & Validation Enhancements**:
  - Hash user passwords using `bcrypt` before storing them in MongoDB.
  - Replace `jwt.decode` with `jwt.verify` in `middleware.js` and load the JWT secret from `.env`.
  - Verify that the `assignedPerson` for a ticket is a member (or admin) of the board's organization.
- **Frontend Dashboard UI**:
  - Build out the organization dashboard interface featuring **Boards** and **Members** tabs, and a 3-column Kanban view (`Pending`, `In Progress`, `Done`) for managing and resolving tickets.

