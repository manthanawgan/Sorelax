-- Coral does not support UNION; split queries merged in Python
-- Part 5 of 5: Notion pages matching keyword
SELECT 'notion.page' AS source_type,
       title,
       url AS detail,
       last_edited_time::text AS extra
FROM notion.pages
WHERE title ILIKE '%{keyword}%'
LIMIT 10
