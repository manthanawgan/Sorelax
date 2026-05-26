WITH recent_commits AS (
  SELECT sha, message, author__login, committed_date
  FROM github.commits
  WHERE owner = '{owner}' AND repo = '{repo}'
    AND committed_date > NOW() - INTERVAL '7 days'
  ORDER BY committed_date DESC
  LIMIT 30
),
open_prs AS (
  SELECT number, title, state, author__login, head__ref AS branch
  FROM github.pulls
  WHERE owner = '{owner}' AND repo = '{repo}'
    AND state = 'open'
  LIMIT 20
),
active_issues AS (
  SELECT id, title, state, assignee__name, priority, cycle__name
  FROM linear.issues
  WHERE state NOT IN ('done', 'cancelled')
  LIMIT 30
),
recent_discussions AS (
  SELECT text, user__name, channel__name, ts
  FROM slack.messages
  WHERE ts > NOW() - INTERVAL '3 days'
  ORDER BY ts DESC
  LIMIT 40
),
arch_docs AS (
  SELECT title, url, last_edited_time
  FROM notion.pages
  WHERE title ILIKE '%architecture%'
     OR title ILIKE '%decision%'
     OR title ILIKE '%rfc%'
  LIMIT 10
)
SELECT
  c.message           AS commit_message,
  c.author__login     AS commit_author,
  c.committed_date,
  p.title             AS open_pr_title,
  p.author__login     AS pr_author,
  p.branch,
  i.title             AS linear_issue,
  i.assignee__name,
  i.priority,
  i.cycle__name       AS sprint,
  s.text              AS slack_message,
  s.user__name        AS slack_author,
  s.channel__name,
  d.title             AS notion_doc
FROM recent_commits c
FULL OUTER JOIN open_prs p ON c.author__login = p.author__login
FULL OUTER JOIN active_issues i ON i.assignee__name = p.author__login
FULL OUTER JOIN recent_discussions s ON s.user__name = c.author__login
FULL OUTER JOIN arch_docs d ON TRUE
LIMIT 100
