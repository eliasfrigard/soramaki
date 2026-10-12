# Technical Specification: Porvoo Log House Task Manager

## 1. Executive Summary & Design Philosophy

The **Porvoo Log House Task Manager** is a lightweight, high-utility task management application custom-tailored for a two-person household undertaking the ongoing restoration, maintenance, and setup of an 1890s log house and its four auxiliary buildings.

### Key Principles
* **Mobile-First Execution:** Hardware store trips, ladder-side edits, and quick updates require high readability, large touch targets, fast load times, and minimal input friction.
* **Desktop Planning:** Strategy sessions, bulk backlog grooming, full property financial overviews, and detailed material research benefit from wide screen layouts, multi-column tables, and drag-and-drop Kanban boards.
* **Strict Two-Player Scope:** Authentication, permissions, and roles are kept ultra-simple. Direct assignment and clear visual indicators prevent overlapping work without requiring complex approval flows.
* **Context over Clutter:** A flat list of 50+ tasks is overwhelming. Work is grouped by **Location** (e.g., Makuuhuone, Verstas, Yard), **Phase** (Backlog vs. Active), and **Procurement Needs** (Items needing store purchases or contractor quotes).

---

## 2. Epics & User Stories

### Epic 1: Task Lifecycle & Ownership
* **US1.1:** As a user, I want to add a task using just a title in under 5 seconds so that I don't lose focus on manual work.
* **US1.2:** As a user, I want to categorize priorities into four distinct buckets: `NEXT` (immediate active queue), `SOON` (up next), `LATER` (backlog), and `MAYBE` (someday/ideas).
* **US1.3:** As a user, I want to claim a task by assigning it to myself and moving it to `IN_PROGRESS` so my partner knows what I am currently working on.
* **US1.4:** As a user, I want to complete tasks and view a history log of finished work to maintain momentum and track project history.

### Epic 2: Domain Context (Spatial & Functional Grouping)
* **US2.1:** As a user, I want to tag tasks by **Location** (e.g., *Makuuhuone*, *Etukuisti*, *Verstas*, *Aitta*, *Sauna*, *Yard*) to organize work days geographically.
* **US2.2:** As a user, I want to assign a **Category** (e.g., *Construction*, *Maintenance*, *Cleaning*, *HVAC/Plumbing*, *Electrical*) to filter tasks by required toolsets or mindsets.

### Epic 3: Financial & Hardware Store Procurement
* **US3.1:** As a user, I want to add multiple individual **Cost Items** to a single task, categorizing each item as `MATERIAL`, `TOOL`, `CONTRACTOR`, or `OTHER`.
* **US3.2:** As a user, I want to save product URLs (e.g., K-Rauta, Stark, Verkkokauppa, Bauhaus) directly to a cost item to easily reference exact specifications or order online.
* **US3.3:** As a user, I want a dedicated **Hardware Store View** on mobile that aggregates all unpurchased material/tool items across all tasks so we can check off items while shopping.
* **US3.4:** As a user, I want to record `Estimated Cost` vs `Actual Cost` for both individual items and rolled-up tasks to keep property budget variance transparent.

### Epic 4: Time Budgeting
* **US4.1:** As a user, I want to set an `Estimated Time` (in hours/days) on tasks to avoid over-committing during weekend project planning.
* **US4.2:** As a user, I want to track `Actual Time` upon task completion to refine our future project estimation skills.

### Epic 5: Seasonal & Maintenance Automation
* **US5.1:** As a user, I want to assign a `Season` tag (`SPRING`, `SUMMER`, `AUTUMN`, `WINTER`) to recurring outdoor or seasonal prep tasks.
* **US5.2:** As a user, I want to set a recurrence interval in months (e.g., 12 months for heat pump maintenance) so completing a recurring task automatically queues the next occurrence.

---

## 3. Data Architecture & Schemas

### 3.1 TypeScript Type Definitions

```typescript
export type Priority = 'NEXT' | 'SOON' | 'LATER' | 'MAYBE';
export type Status = 'BACKLOG' | 'IN_PROGRESS' | 'DONE';
export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | 'ANY';
export type CostType = 'MATERIAL' | 'TOOL' | 'CONTRACTOR' | 'OTHER';

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Location {
  id: string;
  name: string; // e.g., "Makuuhuone", "Etukuisti", "Verstas"
  icon?: string; // Emoji identifier e.g., "🛏️", "🔨", "🌲"
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string; // e.g., "Sähkö", "Maalaus", "LVI", "Siivous"
  colorHex?: string;
}

export interface CostItem {
  id: string;
  taskId: string;
  name: string; // e.g., "Tikkurila Valtti maali 9L"
  costType: CostType;
  storeUrl?: string;
  estimatedCost: number; // EUR
  actualCost?: number;   // EUR
  isPurchased: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;

  // Relations
  assigneeId?: string;
  locationId?: string;
  categoryId?: string;

  // Time
  estimatedMinutes?: number;
  actualMinutes?: number;

  // Seasonal & Recurrence
  season?: Season;
  recurrenceMonths?: number;

  // Sub-resources
  costItems?: CostItem[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

### 3.2 SQL Relational Schema (PostgreSQL)

```sql
-- Enums
CREATE TYPE task_priority AS ENUM ('NEXT', 'SOON', 'LATER', 'MAYBE');
CREATE TYPE task_status AS ENUM ('BACKLOG', 'IN_PROGRESS', 'DONE');
CREATE TYPE season_type AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'ANY');
CREATE TYPE cost_type AS ENUM ('MATERIAL', 'TOOL', 'CONTRACTOR', 'OTHER');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations Table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(10),
    sort_order INT DEFAULT 0
);

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color_hex VARCHAR(7)
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'BACKLOG',
    priority task_priority DEFAULT 'LATER',

    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

    estimated_minutes INT,
    actual_minutes INT,

    season season_type DEFAULT 'ANY',
    recurrence_months INT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Cost Items Table
CREATE TABLE cost_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cost_type cost_type DEFAULT 'MATERIAL',
    store_url TEXT,
    estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_cost NUMERIC(10, 2),
    is_purchased BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_location ON tasks(location_id);
CREATE INDEX idx_cost_items_task ON cost_items(task_id);
```

---

## 4. UI/UX Paradigm & Views

```
+-------------------------------------------------------------------+
|                        APPLICATION VIEWS                          |
+------------------------------------+------------------------------+
|               MOBILE               |           DESKTOP            |
|         (Execution Mode)           |       (Planning Mode)        |
+------------------------------------+------------------------------+
| - Bottom Navigation Bar            | - Left Sidebar Navigation    |
| - Quick-add FAB (+) button         | - Multi-column Kanban Board  |
| - Compact, high-contrast cards     | - Master Financial Spreadsheet|
| - Hardware Store Checklist view    | - Seasonal Calendar View     |
| - One-tap status updates           | - Full task detail drawer    |
+------------------------------------+------------------------------+
```

### View 1: "Now & Next" Execution View (Mobile Priority)
* **Top Header:** Quick toggles between "My Tasks" and "All Active".
* **Active Section:** Cards currently `IN_PROGRESS` with assigned partner avatar and timer/time estimate tag.
* **Queue Section:** `NEXT` tasks grouped by `Location` (e.g., 3 tasks in *Makuuhuone*, 2 tasks in *Yard*).
* **Interactions:** Swipe right to mark completed; swipe left to re-queue.

### View 2: Hardware Store & Shopping Mode (Mobile Priority)
* **Filters:** Filter by store type or location.
* **Content:** Checklist of unpurchased items across all tasks, displaying item name, associated task, store link button, and estimated cost.
* **Action:** Tap checkbox to instantly mark item as purchased and update actual cost.

### View 3: Project Planning & Kanban (Desktop Priority)
* **Board View:** 4 Columns (`NEXT`, `SOON`, `LATER`, `MAYBE`).
* **Drag-and-Drop:** Drag tasks between priority columns or status states.
* **Filters Bar:** Filter simultaneously by Assignee, Location, Category, and Season.

### View 4: Master Budget & Property Overview (Desktop Priority)
* **Financial Summary Cards:** Total Estimated Budget vs. Total Actual Spend to date; breakdown by Material vs Contractor vs Tool costs.
* **Tabular View:** Detailed spreadsheet view of all tasks with expandable child rows for cost items.

---

## 5. Sample Task Mapping

Here is how items from your current task list translate into this structured system:

### Example A: Complex Renovation Task
* **Title:** *Studion sähköasennus*
* **Location:** Studio
* **Category:** Sähkö (Electrical)
* **Priority:** `NEXT`
* **Status:** `BACKLOG`
* **Estimated Time:** 8 hours
* **Cost Items:**
  1. *Contractor:* Electrician labor — Est. 600.00 €
  2. *Material:* Ensto pistorasiat — Est. 80.00 € (`https://www.k-rauta.fi/...`)
  3. *Material:* MMJ kaapeli 50m — Est. 45.00 € (`https://www.stark-suomi.fi/...`)

### Example B: Recurring Seasonal Maintenance Task
* **Title:** *Ilmalämpöpumppujen huolto*
* **Location:** Main House
* **Category:** HVAC / Maintenance
* **Priority:** `SOON`
* **Status:** `BACKLOG`
* **Season:** `AUTUMN`
* **Recurrence:** Every 12 months
* **Estimated Time:** 2 hours
* **Cost Items:**
  1. *Material:* Ilmalämpöpumpun puhdistusaine — Est. 25.00 €

### Example C: Quick Hardware Purchase & Install Task
* **Title:** *Avainkaappi*
* **Location:** Etukuisti
* **Category:** Interior / Carpentry
* **Priority:** `NEXT`
* **Status:** `IN_PROGRESS`
* **Estimated Time:** 30 minutes
* **Cost Items:**
  1. *Material:* Puinen avainkaappi — Est. 40.00 €, Actual: 35.00 € (Purchased)