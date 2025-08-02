# End of Month Workflow Test Guide

## Testing Your Archive System

This guide will help you verify that the archive functionality works perfectly for your end-of-month student removal workflow.

### Test Scenario: July to August Class Merge

Let's simulate your exact scenario:
- July: Two separate classes (28 + 16 students)
- August: Classes merge, some students don't continue
- Need to remove non-continuing students while preserving their July data

### Step-by-Step Test

#### 1. **Setup Test Data (July)**
1. Add a few test students with different attendance patterns:
   ```
   Test Student 1: Roll 101, Good attendance (90%+)
   Test Student 2: Roll 102, Poor attendance (50%)
   Test Student 3: Roll 103, No recent attendance
   ```

2. Take attendance for these students for several days in July
3. Verify their attendance percentages are calculated correctly

#### 2. **End of July - Archive Students**
1. Go to **Student Management** → **Active** tab
2. For students who won't continue in August:
   - Click the orange **Archive** button
   - Enter reason: "End of July 2024 - Not continuing in merged class"
   - Confirm archiving

#### 3. **Verify Data Preservation**
1. Go to **Student Management** → **Archived** tab
2. Find the archived student
3. Click the blue **Verify** button
4. Check that the verification shows:
   - ✅ All attendance records preserved
   - ✅ July attendance percentage intact
   - ✅ Monthly breakdown showing July data
   - ✅ Date range from first to last attendance

#### 4. **Verify Clean Active List**
1. Go to **Student Management** → **Active** tab
2. Confirm archived students don't appear
3. Go to **Attendance Dashboard**
4. Click **Take Attendance**
5. Confirm archived students don't appear in attendance taking

#### 5. **Verify Historical Access**
1. Go to **Attendance History**
2. In the student dropdown, find archived students marked with `[ARCHIVED]`
3. Select an archived student
4. Verify you can still see all their July attendance data
5. Check calendar view shows their historical attendance

#### 6. **Add New August Students**
1. Go to **Student Management**
2. Add new students for the merged August class
3. Take attendance - only active students should appear

### Expected Results ✅

**Data Preservation:**
- All July attendance records remain intact
- Attendance percentages preserved exactly as they were
- Monthly breakdown shows complete July data
- Historical reports include archived student data

**Clean Interface:**
- Archived students don't appear in daily attendance taking
- Active student list only shows current students
- New students can be added anytime

**Audit Trail:**
- Archive reason is recorded and visible
- Archive date is tracked
- Can verify data integrity anytime

### Verification Commands

You can also verify data preservation directly in your Supabase database:

```sql
-- Check that archived students still have all their attendance records
SELECT 
    s.name,
    s.roll_number,
    s.is_active,
    s.archived_at,
    s.archived_reason,
    COUNT(ar.id) as total_records,
    s.attendance_percentage
FROM students s
LEFT JOIN attendance_records ar ON s.id = ar.student_id
WHERE s.is_active = false
GROUP BY s.id, s.name, s.roll_number, s.is_active, s.archived_at, s.archived_reason, s.attendance_percentage;

-- Check that attendance records are preserved even after archiving
SELECT 
    ar.date,
    ar.status,
    s.name,
    s.roll_number,
    s.is_active
FROM attendance_records ar
JOIN students s ON ar.student_id = s.id
WHERE s.is_active = false
ORDER BY ar.date DESC;
```

### Troubleshooting

**Q: What if I accidentally archive the wrong student?**
A: Use the **Restore** button in the Archived tab to bring them back to active status.

**Q: How do I verify data is really preserved?**
A: Use the **Verify** button on any archived student to see a complete data integrity report.

**Q: Can I see archived students in reports?**
A: Yes, in Attendance History, archived students appear with `[ARCHIVED]` labels and you can view their complete history.

**Q: What if I need to permanently remove a student for privacy reasons?**
A: Only use the permanent delete option in the Archived tab - this cannot be undone and removes ALL data.

### Monthly Workflow Summary

```
End of Month Process:
1. Review active students
2. Archive students who won't continue
3. Add clear archiving reasons
4. Verify data preservation using Verify button
5. Add new students for next month
6. Historical data remains accessible forever
```

This system ensures you never lose valuable attendance data while keeping your active student management clean and organized for each new month.

### Real-World Benefits

✅ **July Data Safe**: All July attendance records preserved forever  
✅ **Clean August Start**: Only continuing students in attendance taking  
✅ **Audit Compliance**: Complete trail of who was removed and when  
✅ **Flexible Management**: Can restore students if they return  
✅ **Historical Reports**: Can generate reports including archived students  

The archive system perfectly handles your class merging scenario while maintaining complete data integrity!