-- Coral does not support UNION; split queries merged in Python
-- Part 1 of 5: GitHub commits matching keyword
SELECT 'github.commit' AS source_type,
       commit__message AS title,
       author__login AS detail,
       commit__author__date::text AS extra
FROM github.commits
WHERE owner = '{owner}' AND repo = '{repo}'
  AND commit__message ILIKE '%{keyword}%'
ORDER BY commit__author__date DESC
LIMIT 10
