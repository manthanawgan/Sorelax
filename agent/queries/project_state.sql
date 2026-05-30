WITH recent_commits AS (
  SELECT sha, commit__message, author__login, commit__author__date AS committed_date
  FROM github.commits
  WHERE owner = '{owner}' AND repo = '{repo}'
  ORDER BY commit__author__date DESC
  LIMIT 30
),
open_prs AS (
  SELECT number, title, state, user__login AS author__login, head__ref AS branch
  FROM github.pulls
  WHERE owner = '{owner}' AND repo = '{repo}'
    AND state = 'open'
  LIMIT 20
)
SELECT
  c.commit__message   AS commit_message,
  c.author__login     AS commit_author,
  c.committed_date,
  p.title             AS open_pr_title,
  p.author__login     AS pr_author,
  p.branch,
  NULL                AS linear_issue,
  NULL                AS assignee__name,
  NULL                AS priority,
  NULL                AS sprint,
  NULL                AS slack_message,
  NULL                AS slack_author,
  NULL                AS channel__name,
  NULL                AS notion_doc
FROM recent_commits c
FULL OUTER JOIN open_prs p ON c.author__login = p.author__login
LIMIT 100
