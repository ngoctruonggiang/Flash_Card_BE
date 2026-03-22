# Software Requirements Specification (SRS)

Project: FlashLearn — Web-based English Flashcard Application

Version: 1.0

Date: 2025-10-04

Prepared by: Nguyễn Đại Trường Danh, Trần Đức Hải, Đặng Trần Anh Hào

# **1\. Introduction**

## **1.1 Purpose**

This document defines the functional and non-functional requirements for FlashLearn, a lightweight English vocabulary learning system based on flashcards. The intended audience includes course instructors, student developers, and testers.

## **1.2 Document Conventions**

Functional requirements labeled FR-x.y. Non-functional requirements labeled NFR-x. Priorities: High, Medium, Low.

## **1.3 Scope**

FlashLearn is a web application designed for individual learners. It manages flashcard decks, applies Simplified SM-2 spaced repetition, supports CSV import/export, and shows progress stats. Limitations: English and Vietnamese only, no mobile app, no social features.

## **1.4 References**

IEEE SRS template (provided). SuperMemo-2 algorithm documentation (simplified adaptation).

# **2\. Overall Description**

## **2.1 Product Perspective**

Standalone browser-based application with frontend using ReactJS and backend using Node.js \+ Nestjs \+ SQLite.

## **2.2 User Classes and Characteristics**

Learners: students who use flashcards.

## **2.3 Operating Environment**

Client: Chrome/Firefox/Edge. Server: Node.js 16+ with SQLite.

## **2.4 Design and Implementation Constraints**

Database: SQLite. Passwords hashed.

## **2.5 Assumptions and Dependencies**

Users have modern browsers. Runs on local or small server environment.

## **3\. System Features**

### **3.1 User Authentication**

The system provides user authentication functionalities to ensure security and controlled access to features.

- **FR-1.1 Register**  
   New users can create an account by entering required information such as username, email, and password.  
   The system validates the input (e.g., ensures the email is unique and the password meets security criteria) and stores the user information in the database.

- **FR-1.2 Login**  
   Users can log in using their registered email and password.  
   The system verifies the credentials, grants access to authorized resources, and creates a user session (session or token).

- **FR-1.3 Logout**  
   Users can log out to end the current session.  
   The system terminates the active session, clears authentication tokens (if any), and redirects the user to the login interface.

**Acceptance Criteria:**  
 Login and logout functionalities must be tested successfully:

- Valid users can log in and access system features.

- After logging out, users can no longer access protected pages.

### **3.2 Deck Management**

The system allows users to manage **study decks**, each containing multiple **cards** used for learning and review.

- **FR-2.1 Create Deck**  
   Users can create a new deck by entering a name and an optional description.  
   The system saves the new deck to the database and associates it with the current user.

- **FR-2.2 Edit Deck**  
   Users can edit the deck’s name or description.  
   The system updates the deck information in the database without affecting the cards inside.

- **FR-2.3 Delete Deck**  
   Users can delete an existing deck.  
   When deleted, all cards associated with the deck are also removed from the database to maintain data consistency.

### **3.3 Card Management**

Each deck contains multiple **study cards**, consisting of a **front** (question) and **back** (answer or note).  
 The system provides functions to manage cards within a deck.

- **FR-3.1 Add Card**  
   Users can add new cards to a selected deck.  
   Each card includes a front side (question) and a back side (answer or explanation).

- **FR-3.2 Edit Card**  
   Users can modify the content on either side of an existing card.  
   The system updates the card information in the database accordingly.

- **FR-3.3 Delete Card**  
   Users can delete one or more cards that are no longer needed.  
   The system requests confirmation before permanently removing the selected cards.

### **3.4 Import / Export CSV**

The system supports importing and exporting study cards through **CSV files**, allowing users to back up, share, or migrate their data easily.

- **FR-4.1 Import**  
   Users can upload a CSV file containing a list of cards (each row represents one card with front and back content).  
   The system reads and previews the data, and upon confirmation, creates corresponding cards within the selected deck.

- **FR-4.2 Export**  
   Users can export all cards from a specific deck to a CSV file.  
   The system generates a properly formatted CSV file (e.g., “Front,Back”) and allows the user to download it.

### **3.5 Study Mode — Simplified SM-2 Algorithm**

The study mode is built upon the **Simplified SM-2 algorithm**, which optimizes review scheduling based on user performance.  
 Each card is presented with four feedback buttons after review: **Again**, **Hard**, **Good**, and **Easy**.

- **FR-5.1 Start Study Session**  
   The system selects cards that are due for review today and starts a study session.  
   Users view each card, attempt to recall the answer, and then select a rating that reflects their recall quality.

- **FR-5.2 Record Review Outcome**  
   After the user selects a rating, the system updates the learning parameters of the card according to the SM-2 rules:

  - **Again:**  
     `repetitions = 0`, `interval = 1`, `next_review = today + 1`, `e_factor` remains unchanged.

  - **Hard / Good / Easy:**  
     `repetitions += 1`  
     `interval` is determined based on `repetitions` (e.g., 1, 6, or `prev_interval * e_factor`)  
     `e_factor` is updated using the simplified SM-2 formula.  
     `next_review = today + interval`.

- **FR-5.3 Session Summary**  
   After the study session ends, the system displays a summary including:

  - The total number of cards reviewed.

  - The count of each feedback rating (**Again**, **Hard**, **Good**, **Easy**).

  - The overall accuracy percentage, allowing users to track their learning progress.

### **3.6 Progress & Reports**

The system provides progress tracking and reporting features that help users evaluate their study performance for each deck.

- **FR-6.1 Deck Statistics**  
   The system displays an overview of each deck, including:

  - **Total cards:** the total number of cards contained in the deck.

  - **Card distribution:** the breakdown of cards by learning status, such as new, learning, and mastered.

  - **Last studied date:** the most recent date on which the user reviewed cards from the deck.

- These statistics help users monitor their study progress, identify which decks need review, and observe improvement over time.

# **4\. Data Requirements**

## **4.1 Entities**

**User** — application user account.  
**Deck** — a flashcard deck created by a user.  
**Card** — a flashcard inside a Deck (front/back, SM-2 metadata).  
**StudySession** — a study session instance (one run of Study Mode).  
**CardReview** — one review record for a Card during a StudySession.

**Relationships:**

- One _User_ can have many _Decks_.
- Each _Deck_ can have many _Cards_.
- Each _StudySession_ belongs to one _User_ and one _Deck_.
- Each _CardReview_ is linked to one _Card_ and one _StudySession_.

## **4.2 Key Fields**

### **User**

- `id` — INTEGER, PK, AUTOINCREMENT
- `username` — TEXT, UNIQUE, NOT NULL
- `email` — TEXT, UNIQUE, NOT NULL
- `password_hash` — TEXT, NOT NULL (store salted+hashed password)
- `created_at` — DATETIME,, NOT NULL
- `last_login_at` — DATETIME, NULL

Constraints & indexes: unique on `email` and `username`. Index `email`, `username`.

### **Deck**

- `id` — INTEGER, PK
- `user_id` — INTEGER, FK → `User.id`, NOT NULL
- `title` — TEXT, NOT NULL
- `description` — TEXT, NULL
- `created_at`, `updated_at` — DATETIME, NOT NULL

Indexes: `user_id`.

### **Card**

- `id` — INTEGER, PK
- `deck_id` — INTEGER, FK → `Deck.id`, NOT NULL
- `front` — TEXT, NOT NULL
- `back` — TEXT, NOT NULL
- `created_at`, `updated_at` — DATETIME NOT NULL
- `tags` — TEXT NULL (JSON array or CSV depending on design)

Constraints & indexes:

Indexes: `deck_id`

### **CardReview**

- `id` — INTEGER, PK
- `card_id` — INTEGER, FK → `Card.id`, NOT NULL
- `reviewed_at` — TEXT, NOT NULL
- `repetitions` — INTEGER NOT NULL DEFAULT 0 (SM-2 consecutive correct count)
- `interval` — INTEGER NOT NULL DEFAULT 0 (days until next review)
- `e_factor` — REAL NOT NULL DEFAULT 2.5 (SM-2 ease factor; minimum 1.3)
- `next_review_date` — DATETIME NOT NULL
- `quality` — INTEGER NOT NULL (mapping example: Again=0, Hard=1, Good=2, Easy=3) — or use descriptive strings

Constraint: `e_factor >= 1.3`.

Indexes: `(deck_id)`,`(next_review_date)`.

### **4.3 Reports**

The system will generate and display various analytical and progress reports to the user. These reports will summarize learning performance and aid in retention tracking.

**Report Types:**

1. **Daily Review Summary** — total cards reviewed, percentage correct, and time spent.
2. **Deck Performance Report** — per-deck breakdown of due cards, accuracy rate, and progress curve.
3. **Card Statistics** — detailed per-card review history, ease factor trends, and next review prediction.
4. **Export Report** — user-triggered export of selected decks or cards as CSV or JSON files.

**Characteristics:**

- Sortable and filterable by date, deck, and performance level.
- Charts and visual indicators (accuracy rate, review streaks).
- Conforms to responsive design for both desktop.
- Actual layout and visualization details will be specified in the design phase.

### **4.4 Data Acquisition, Integrity, Retention, and Disposal**

**Data Acquisition:**

- Users enter and manage flashcard data manually through the interface or import it from supported formats (CSV, JSON).
- System-generated data includes spaced repetition calculations (`interval`, `e_factor`, `next_review_date`) and review statistics.

**Data Integrity:**

- All transactions involving card reviews are atomic — inserting a `CardReview` and updating the corresponding `Card` occur together.
- Validation ensures `e_factor >= 1.3`, non-null `deck_id`, and unique user credentials.
- Referential integrity is enforced through foreign keys (e.g., `Deck → User`, `Card → Deck`).

**Data Retention and Backup:**

- All data is stored persistently in SQLite (for standalone).
- Daily automated backups are created before updates or migrations.
- “Soft delete” is supported.
- Users can export or delete their own data in compliance with privacy policies.

**Data Disposal:**

- Permanent deletion occurs only upon explicit user confirmation.

**Security Measures:**

- Passwords are hashed using bcrypt or Argon2.
- All network communication uses HTTPS/TLS.
- Only authenticated users can access or modify their own decks and cards.

# **5\. External Interface Requirements**

## **5.1 User Interfaces**

Deck list screen, Card management screen, Study screen, Stats screen.

## **5.2 Software Interfaces**

REST API (JSON). Examples: /api/register, /api/login, /api/decks, /api/study/start.

## **5.3 Hardware Interfaces**

Standard client device \+ server.

## **5.4 Communication Interfaces**

HTTP(S), JSON, CSV.

# **6\. Non-functional Requirements**

## **NFR-1 Usability**

Learnable in \<10 minutes.

## **NFR-2 Security**

Passwords hashed, auth required.

## **NFR-3 Reliability**

Support \~1000 cards.

## **NFR-4 Testability**

Each FR has acceptance criteria.

# **7\. Internationalization**

English and Vietnamese only, UTF-8.

# **8\. Other Requirements**

Browser compatibility (Chrome/Firefox/Edge). Responsive design.

# **9\. Glossary**

Deck: collection of cards. Card: flashcard front/back. SM-2: spaced repetition algorithm. e_factor: ease factor controlling interval growth.
