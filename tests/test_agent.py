"""Unit tests for the Sorelax backend agent."""

import unittest
from unittest.mock import patch, MagicMock
import json
import tempfile
from pathlib import Path

# Import agent components
from agent.coral_client import coral_query
from agent.generate_context import format_claude_md, write_claude_md
from agent.summariser import _extract_json, _normalise, summarise_rows
from agent.refresh import _count_sources


class TestCoralClient(unittest.TestCase):
    """Test Coral client SQL execution and response parsing."""

    @patch("subprocess.run")
    def test_coral_query_list(self, mock_run):
        """Test parsing when Coral returns a JSON list."""
        mock_response = MagicMock()
        mock_response.returncode = 0
        mock_response.stdout = json.dumps([{"col1": "val1"}, {"col1": "val2"}])
        mock_run.return_value = mock_response

        rows = coral_query("SELECT 1")
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["col1"], "val1")

    @patch("subprocess.run")
    def test_coral_query_dict_with_rows(self, mock_run):
        """Test parsing when Coral returns a dict with 'rows' key."""
        mock_response = MagicMock()
        mock_response.returncode = 0
        mock_response.stdout = json.dumps({"rows": [{"col": "a"}]})
        mock_run.return_value = mock_response

        rows = coral_query("SELECT 1")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["col"], "a")

    @patch("subprocess.run")
    def test_coral_query_empty_response(self, mock_run):
        """Test parsing when Coral returns empty stdout."""
        mock_response = MagicMock()
        mock_response.returncode = 0
        mock_response.stdout = ""
        mock_run.return_value = mock_response

        rows = coral_query("SELECT 1")
        self.assertEqual(rows, [])

    @patch("subprocess.run")
    def test_coral_query_failure(self, mock_run):
        """Test Coral client behavior when subprocess fails."""
        mock_response = MagicMock()
        mock_response.returncode = 127
        mock_response.stderr = "Command not found"
        mock_run.return_value = mock_response

        with self.assertRaises(RuntimeError) as ctx:
            coral_query("SELECT 1")
        self.assertIn("Command not found", str(ctx.exception))


class TestGenerateContext(unittest.TestCase):
    """Test generating and formatting CLAUDE.md."""

    def test_format_claude_md(self):
        """Test that the markdown format includes all sections and values."""
        context = {
            "active_work": ["Issue A (Assignee)", "Issue B (Assignee)"],
            "recent_commits": ["Commit 1", "Commit 2"],
            "open_prs": ["#1: Title (Author)"],
            "sprint_goal": "Finish the core logic",
            "key_decisions": ["Decision A"],
            "relevant_slack_threads": ["#general - thread 1"],
            "architecture_docs": ["Doc A"],
        }
        md = format_claude_md(context, updated_at="2026-05-28T16:00:00Z")
        self.assertIn("Last updated: 2026-05-28T16:00:00Z", md)
        self.assertIn("Finish the core logic", md)
        self.assertIn("- Issue A (Assignee)", md)
        self.assertIn("- Decision A", md)

    def test_format_claude_md_empty(self):
        """Test markdown formatting with empty lists."""
        context = {}
        md = format_claude_md(context)
        self.assertIn("- (none)", md)
        self.assertIn("(unknown)", md)

    def test_write_claude_md(self):
        """Test writing CLAUDE.md to target output directory."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            context_path = tmp_path / "project_context.json"
            context = {"active_work": ["Task 1"]}
            with context_path.open("w") as f:
                json.dump(context, f)

            write_claude_md(context_path=context_path, output_dir=tmp_path)
            claude_md_path = tmp_path / "CLAUDE.md"
            self.assertTrue(claude_md_path.exists())
            content = claude_md_path.read_text()
            self.assertIn("- Task 1", content)


class TestSummariser(unittest.TestCase):
    """Test Gemini summarisation helper functions."""

    def test_extract_json(self):
        """Test extracting JSON from text with and without markdown code blocks."""
        raw_json = '{"active_work": ["Task 1"]}'
        self.assertEqual(_extract_json(raw_json)["active_work"], ["Task 1"])

        fenced_json = '```json\n{"active_work": ["Task 1"]}\n```'
        self.assertEqual(_extract_json(fenced_json)["active_work"], ["Task 1"])

    def test_normalise(self):
        """Test normalisation of the dictionary returned from Gemini."""
        input_data = {
            "active_work": ["Task A"],
            "recent_commits": None,
            "open_prs": "A string that should be in a list",
            "sprint_goal": ["Goal 1", "Goal 2"],
        }
        norm = _normalise(input_data)
        self.assertEqual(norm["active_work"], ["Task A"])
        self.assertEqual(norm["recent_commits"], [])
        self.assertEqual(norm["open_prs"], ["A string that should be in a list"])
        self.assertEqual(norm["sprint_goal"], "Goal 1, Goal 2")


class TestRefresh(unittest.TestCase):
    """Test Sorelax refresh module helpers."""

    def test_count_sources(self):
        """Test correct mapping and counting of diverse rows."""
        rows = [
            {"commit_message": "Added tests", "commit_author": "dev1"},
            {"open_pr_title": "Fix bug", "pr_author": "dev1"},
            {"linear_issue": "Issue 1", "sprint": "Sprint 5"},
            {"slack_message": "Hey", "channel__name": "general"},
            {"slack_message": "How are you", "channel__name": "general"},
            {"notion_doc": "ADR 1"},
        ]
        counts = _count_sources(rows)
        self.assertEqual(counts["github_commits"], 1)
        self.assertEqual(counts["github_prs"], 1)
        self.assertEqual(counts["linear_issues"], 1)
        self.assertEqual(counts["slack_messages"], 2)
        self.assertEqual(counts["notion_docs"], 1)
        self.assertEqual(counts["slack_channels"], 1)
        self.assertEqual(counts["channel_names"], ["general"])
        self.assertEqual(counts["sprint_names"], ["Sprint 5"])


if __name__ == "__main__":
    unittest.main()
