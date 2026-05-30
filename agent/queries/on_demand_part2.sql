-- Coral does not support UNION; split queries merged in Python
-- Part 2 of 5: GitHub pull requests matching keyword
SELECT 'github.pr' AS source_type,
       title,
       user__login AS detail,
       number::text AS extra
FROM github.pulls
WHERE owner = '{owner}' AND repo = '{repo}'
  AND title ILIKE '%{keyword}%'
LIMIT 10
