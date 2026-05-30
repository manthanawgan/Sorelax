-- Coral does not support UNION; split queries merged in Python
-- Part 3 of 5: Linear issues matching keyword
SELECT 'linear.issue' AS source_type,
       title,
       assignee__name AS detail,
       state AS extra
FROM linear.issues
WHERE title ILIKE '%{keyword}%'
   OR assignee__name ILIKE '%{keyword}%'
LIMIT 10
