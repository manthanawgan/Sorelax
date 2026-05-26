SELECT 'github.commit' AS source_type,
       message AS title,
       author__login AS detail,
       committed_date::text AS extra
FROM github.commits
WHERE owner = '{owner}' AND repo = '{repo}'
  AND message ILIKE '%{keyword}%'
ORDER BY committed_date DESC
LIMIT 10

UNION ALL

SELECT 'github.pr',
       title,
       author__login,
       number::text
FROM github.pulls
WHERE owner = '{owner}' AND repo = '{repo}'
  AND title ILIKE '%{keyword}%'
LIMIT 10

UNION ALL

SELECT 'linear.issue',
       title,
       assignee__name,
       state
FROM linear.issues
WHERE title ILIKE '%{keyword}%'
   OR assignee__name ILIKE '%{keyword}%'
LIMIT 10

UNION ALL

SELECT 'slack.message',
       left(text, 120),
       user__name,
       channel__name
FROM (
  SELECT text, user__name, channel__name, ts
  FROM slack.messages
  WHERE text ILIKE '%{keyword}%'
  ORDER BY ts DESC
  LIMIT 10
) AS slack_hits

UNION ALL

SELECT 'notion.page',
       title,
       url,
       last_edited_time::text
FROM notion.pages
WHERE title ILIKE '%{keyword}%'
LIMIT 10
