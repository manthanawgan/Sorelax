-- Coral does not support UNION; split queries merged in Python
-- Part 4 of 5: Slack messages matching keyword
SELECT 'slack.message' AS source_type,
       left(text, 120) AS title,
       user__name AS detail,
       channel__name AS extra
FROM (
  SELECT text, user__name, channel__name, ts
  FROM slack.messages
  WHERE text ILIKE '%{keyword}%'
  ORDER BY ts DESC
  LIMIT 10
) AS slack_hits
