# Student Archive Functionality Guide

## Overview

The attendance system now includes a comprehensive archive functionality that allows you to manage students who have left the class while preserving their historical attendance data. This is perfect for scenarios like:

- Students transferring to other classes
- End-of-month cleanup when classes merge
- Students who have stopped attending but you want to keep their records

## Key Features

### 🔄 Soft Delete System
- Students are **archived** instead of permanently deleted
- All historical attendance data is preserved
- Archived students can be restored if needed
- Permanent deletion is still available but requires confirmation

### 📊 Data Preservation
- Attendance percentages remain intact
- Historical records are maintained
- You can still view archived students' attendance history
- Statistics and reports include archived student data when relevant

## How to Use

### 1. Archiving Students

**From Student Management:**
1. Go to the "Students" tab
2. Find the student you want to archive
3. Click the orange "Archive" button (📦)
4. Enter a reason for archiving (e.g., "Student left the class", "Transferred to another section")
5. Confirm the action

**What happens when you archive:**
- Student is removed from active attendance taking
- Their data moves to the "Archived" view
- All historical records are preserved
- They won't appear in new attendance sessions

### 2. Viewing Archived Students

**In Student Management:**
1. Click the "Archived" tab to see all archived students
2. You can search through archived students
3. View their final attendance statistics
4. See when they were archived and why

**In Attendance History:**
- Archived students appear in the dropdown with `[ARCHIVED]` label
- Their records are highlighted with orange background
- You can still view their complete attendance history

### 3. Restoring Students

**If you need to bring a student back:**
1. Go to Student Management → Archived tab
2. Find the student
3. Click the green "Restore" button (↻)
4. Confirm the action
5. Student returns to active status and can take attendance again

### 4. Permanent Deletion

**⚠️ Use with extreme caution:**
1. Only available for archived students
2. Permanently removes student and ALL their data
3. Cannot be undone
4. Requires double confirmation

## Database Changes

### New Columns Added
- `is_active`: Boolean flag (true = active, false = archived)
- `archived_at`: Timestamp when student was archived
- `archived_reason`: Text field for archiving reason

### Migration
If you have an existing database, run the `database-migration.sql` script:

```sql
-- This will safely add the new columns without losing data
-- All existing students will be marked as active by default
```

## UI Changes

### Student Management
- **Active/Archived Toggle**: Switch between viewing active and archived students
- **Archive Button**: Orange button to archive students (replaces delete)
- **Restore Button**: Green button to restore archived students
- **Archive Modal**: Form to enter reason for archiving

### Attendance History
- **Archived Indicators**: `[ARCHIVED]` labels in dropdowns
- **Visual Highlights**: Orange background for archived student records
- **Complete History**: Can still view all historical data

### Attendance Taking
- **Active Students Only**: Only active students appear in attendance sessions
- **Automatic Updates**: When students are archived/restored, attendance lists update automatically

## Best Practices

### 1. Monthly Cleanup Process
```
End of Month Workflow:
1. Review students with high absence rates
2. Archive students who haven't attended recently
3. Add clear reasons (e.g., "No attendance in July 2024")
4. Keep archived students for historical reference
```

### 2. Class Merging Scenario
```
When Classes Merge:
1. Archive students who won't continue
2. Keep their July attendance data intact
3. Add new students to the merged class
4. Historical reports will show complete picture
```

### 3. Reason Documentation
Always provide clear reasons when archiving:
- ✅ "Student transferred to Section B"
- ✅ "No attendance since July 15, 2024"
- ✅ "Completed course early"
- ❌ "Remove" (too vague)

## Technical Implementation

### API Changes
- `studentAPI.getAll(includeArchived)`: Get students with optional archived inclusion
- `studentAPI.archive(id, reason)`: Archive a student
- `studentAPI.restore(id)`: Restore an archived student
- `studentAPI.getArchived()`: Get only archived students

### Database Triggers
- Attendance statistics continue to update for archived students
- Historical data integrity is maintained
- Performance optimized with proper indexing

## Troubleshooting

### Common Issues

**Q: Archived student still appears in attendance?**
A: Check if the student was properly archived. Refresh the page and verify in Student Management.

**Q: Can't see archived student's history?**
A: Make sure you're looking in Attendance History, not Student Management. Archived students appear with `[ARCHIVED]` label.

**Q: Accidentally archived wrong student?**
A: Use the Restore function in Student Management → Archived tab.

**Q: Need to permanently delete for privacy reasons?**
A: Use the permanent delete option in the Archived tab, but remember this cannot be undone.

## Migration Instructions

### For Existing Databases
1. Backup your current database
2. Run the `database-migration.sql` script in Supabase SQL editor
3. Verify all existing students are marked as active
4. Test the archive functionality with a test student

### For New Installations
- Use the updated `database-setup.sql` script
- Archive functionality will be available immediately

## Summary

This archive system gives you the flexibility to manage student rosters while preserving valuable historical data. It's perfect for educational environments where student populations change frequently but historical records need to be maintained for reporting and analysis purposes.

The system ensures data integrity while providing a clean, user-friendly interface for managing both active and archived students.