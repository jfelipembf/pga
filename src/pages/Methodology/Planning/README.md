# Methodology Planning Module

## Overview
The Planning module allows instructors/administrators to plan weekly training objectives and monitor student progress towards level promotion.

## Architecture

PO Structure:
- **Service (`PlanningService.js`):** Handles persistence of weekly objectives (`techniqueA`, `techniqueB`) in Firestore under `training_plans` collection.
- **Hook (`useEvaluationAnalysis.js`):** Encapsulates the logic for analyzing student evaluations. It fetches the latest evaluations for a list of students and determines if they are "Ready", "Warning", or "Attention" based on:
    1. Completion of all "Fundamental" topics.
    2. General score > 85%.
- **Hook (`usePlanningData.js`):** Helper to fetch students enrolled in a specific session (merging regular class enrollments with single-session/trial enrollments), reusing logic from `AttendanceService`.
- **Component (`PlanningSessionModal.js`):** Displays the list of students for a selected session with their progress bars and status badges.
- **Page (`index.js`):** The main entry point. Reuses the `GradeGrid` component to display the weekly schedule but overrides the interaction to open the Planning Modal instead of the Attendance Modal.

## Data Flow
1. User opens `/methodology/planning`.
2. `PlanningService` fetches weekly objectives.
3. `useGradeData` fetches the weekly schedule (Sessions).
4. User clicks a Session.
5. `usePlanningData` fetches enrolled students for that session.
6. `PlanningSessionModal` opens.
7. `useEvaluationAnalysis` fetches the *latest evaluation* for each student in that specific activity.
8. Progress is calculated and displayed.

## Key Decisions
- **Reuse of GradeGrid:** To ensure consistency with the operational "Grade" page and reduce code duplication.
- **Separation of Analysis Logic:** The complex logic of "is student ready?" is isolated in `useEvaluationAnalysis` to allow easy testing and future reuse in other dashboards.
- **Midday Anchor:** All date operations dealing with "Weeks" use the `getStartOfWeek` utility to ensure timezone consistency.
