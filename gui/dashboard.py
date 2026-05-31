"""Sorelax Developer Dashboard — PyQt6 Developer Panel.

Exposes status monitoring, on-demand Coral ask Q&A, context explore cards,
live log tailing, and secure credentials management.

All long-running operations execute in QThread workers — the main thread
is never blocked.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any

from PyQt6.QtCore import QSize, QThread, QTimer, Qt, pyqtSignal
from PyQt6.QtGui import QColor, QFont, QPalette, QTextCursor
from PyQt6.QtWidgets import (
    QApplication,
    QFormLayout,
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QPushButton,
    QScrollArea,
    QStackedWidget,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

# Robust import of gui/backend.py
try:
    import gui.backend as backend
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    import gui.backend as backend

# ---------------------------------------------------------------------------
# Tokyo Night Dark Theme Stylesheet
# ---------------------------------------------------------------------------
TOKYO_NIGHT_STYLE = """
/* Shell */
QMainWindow, QWidget {
    background-color: #1a1b26;
    color: #a9b1d6;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
}

/* Sidebar Navigation */
QListWidget#sidebar {
    background-color: #16161e;
    border: none;
    border-right: 1px solid #3b4261;
    padding-top: 10px;
}

QListWidget#sidebar::item {
    padding: 12px 20px;
    color: #787c99;
    font-weight: bold;
    border-radius: 0px;
}

QListWidget#sidebar::item:hover {
    background-color: #24283b;
    color: #89ddff;
}

QListWidget#sidebar::item:selected {
    background-color: #1f2335;
    color: #7aa2f7;
    border-left: 4px solid #7aa2f7;
}

/* Ask History List */
QListWidget#historyList {
    background-color: #16161e;
    border: 1px solid #3b4261;
    border-radius: 6px;
    color: #c0caf5;
}

QListWidget#historyList::item {
    padding: 8px 12px;
    border-bottom: 1px solid #24283b;
}

QListWidget#historyList::item:hover {
    background-color: #24283b;
    color: #89ddff;
}

/* Section titles */
QLabel#sectionTitle {
    font-size: 22px;
    font-weight: bold;
    color: #7aa2f7;
    padding-bottom: 5px;
}

QLabel#sectionSubtitle {
    font-size: 13px;
    color: #565f89;
    margin-bottom: 20px;
}

/* Inputs */
QLineEdit {
    background-color: #24283b;
    border: 1px solid #3b4261;
    border-radius: 6px;
    padding: 8px 12px;
    color: #c0caf5;
}

QLineEdit:focus {
    border: 1px solid #7aa2f7;
}

/* Buttons */
QPushButton {
    background-color: #7aa2f7;
    color: #1a1b26;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-weight: bold;
}

QPushButton:hover {
    background-color: #89ddff;
}

QPushButton:pressed {
    background-color: #3d59a1;
}

QPushButton:disabled {
    background-color: #414868;
    color: #565f89;
}

QPushButton#toggleBtn {
    background-color: #24283b;
    color: #7aa2f7;
    border: 1px solid #3b4261;
    border-radius: 6px;
    padding: 8px 16px;
}

QPushButton#toggleBtn:hover {
    background-color: #3b4261;
}

/* Cards */
QFrame#card {
    background-color: #1f2335;
    border: 1px solid #3b4261;
    border-radius: 8px;
    padding: 15px;
}

/* Terminal consoles */
QTextEdit {
    background-color: #16161e;
    color: #c0caf5;
    border: 1px solid #3b4261;
    border-radius: 8px;
    padding: 10px;
    font-family: 'Consolas', 'Fira Code', 'Courier New', monospace;
    font-size: 12px;
}

/* Scroll areas */
QScrollArea {
    border: none;
    background-color: transparent;
}
"""


# ---------------------------------------------------------------------------
# QThread workers — every subprocess lives here, never in the main thread
# ---------------------------------------------------------------------------

class RefreshThread(QThread):
    """Runs backend.run_refresh() off-thread and streams output lines."""

    line_received = pyqtSignal(str)
    finished_code = pyqtSignal(int)

    def run(self) -> None:
        try:
            code = backend.run_refresh(self._emit)
            self.finished_code.emit(code)
        except Exception as exc:
            self._emit(f"\n>>> ERROR: {exc}\n")
            self.finished_code.emit(1)

    def _emit(self, line: str) -> None:
        self.line_received.emit(line)


class AskThread(QThread):
    """Runs backend.run_ask() off-thread and streams answer lines live."""

    line_received = pyqtSignal(str)
    finished_code = pyqtSignal(int)

    def __init__(self, query: str) -> None:
        super().__init__()
        self.query = query

    def run(self) -> None:
        try:
            code = backend.run_ask(self.query, self._emit)
            self.finished_code.emit(code)
        except Exception as exc:
            self._emit(f"\n>>> ERROR: {exc}\n")
            self.finished_code.emit(1)

    def _emit(self, line: str) -> None:
        self.line_received.emit(line)


class SchedulerStartThread(QThread):
    """Starts the background scheduler daemon off-thread."""

    line_received = pyqtSignal(str)
    finished_code = pyqtSignal(int)

    def run(self) -> None:
        try:
            code = backend.start_scheduler(self._emit)
            self.finished_code.emit(code)
        except Exception as exc:
            self._emit(f"\n>>> ERROR: {exc}\n")
            self.finished_code.emit(1)

    def _emit(self, line: str) -> None:
        self.line_received.emit(line)


class SchedulerStopThread(QThread):
    """Stops the background scheduler daemon off-thread."""

    finished_code = pyqtSignal(int)

    def run(self) -> None:
        try:
            code = backend.stop_scheduler()
            self.finished_code.emit(code)
        except Exception as exc:
            self.finished_code.emit(1)


class StatusPollThread(QThread):
    """Polls backend.get_status() off-thread to avoid blocking on coral calls."""

    status_ready = pyqtSignal(dict)

    def run(self) -> None:
        try:
            status = backend.get_status()
            self.status_ready.emit(status)
        except Exception:
            self.status_ready.emit({})


class SaveEnvThread(QThread):
    """Calls backend.save_env() off-thread (coral source add can be slow)."""

    finished_ok = pyqtSignal()
    finished_err = pyqtSignal(str)

    def __init__(self, tokens: dict[str, str]) -> None:
        super().__init__()
        self.tokens = tokens

    def run(self) -> None:
        try:
            backend.save_env(self.tokens)
            self.finished_ok.emit()
        except Exception as exc:
            self.finished_err.emit(str(exc))


class LogsThread(QThread):
    """Tails the Sorelax log file continuously, emitting each new line."""

    line_received = pyqtSignal(str)

    def __init__(self) -> None:
        super().__init__()
        self._active = True

    def run(self) -> None:
        try:
            from gui.backend import LOG_PATH  # re-import for path resolution
        except ImportError:
            LOG_PATH = Path.home() / ".sorelax" / "project_log.jsonl"

        try:
            if not LOG_PATH.exists():
                self.line_received.emit(">>> Log file not found yet. Run a refresh first.")
                return

            with LOG_PATH.open("r", encoding="utf-8") as f:
                # Seed with last 50 lines
                existing = f.readlines()
                for ln in existing[-50:]:
                    if not self._active:
                        return
                    self.line_received.emit(ln.strip())

                # Tail new entries
                f.seek(0, os.SEEK_END)
                while self._active:
                    ln = f.readline()
                    if not ln:
                        time.sleep(0.4)
                        continue
                    self.line_received.emit(ln.strip())
        except Exception as exc:
            self.line_received.emit(f">>> Logs stream error: {exc}")

    def stop(self) -> None:
        self._active = False


# ---------------------------------------------------------------------------
# Main Window
# ---------------------------------------------------------------------------

class SorelaxDashboard(QMainWindow):
    """QMainWindow with a QStackedWidget + sidebar for 5-panel navigation."""

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("Sorelax Developer Workspace")
        self.setStyleSheet(TOKYO_NIGHT_STYLE)
        self.resize(1060, 720)

        # Active thread references (kept to avoid GC and for lifecycle control)
        self._refresh_thread: RefreshThread | None = None
        self._ask_thread: AskThread | None = None
        self._sched_start_thread: SchedulerStartThread | None = None
        self._sched_stop_thread: SchedulerStopThread | None = None
        self._logs_thread: LogsThread | None = None
        self._status_thread: StatusPollThread | None = None
        self._save_thread: SaveEnvThread | None = None

        # Countdown: seconds remaining until next scheduled refresh.
        # Only ticks down when scheduler is running; reset on manual refresh.
        self._countdown_secs: int = backend.INTERVAL_HOURS * 3600
        self._sched_running: bool = False

        # --- Central layout ---
        central = QWidget()
        self.setCentralWidget(central)
        root_layout = QHBoxLayout(central)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # Sidebar
        self.sidebar = QListWidget()
        self.sidebar.setObjectName("sidebar")
        self.sidebar.setFixedWidth(220)
        self.sidebar.currentRowChanged.connect(self._switch_panel)
        root_layout.addWidget(self.sidebar)

        # Stacked viewport
        self.viewport = QStackedWidget()
        root_layout.addWidget(self.viewport)

        # Populate sidebar items
        nav_items = [
            ("Dashboard", "Overview & status metrics"),
            ("Ask Sorelax", "On-demand source query"),
            ("Context Explorer", "Sorelax knowledge database"),
            ("Live Logs", "Real-time daemon streams"),
            ("Settings", "Tokens & database configuration"),
        ]
        for name, tip in nav_items:
            item = QListWidgetItem(name)
            item.setToolTip(tip)
            self.sidebar.addItem(item)

        # Build all panels
        self._init_dashboard_panel()
        self._init_ask_panel()
        self._init_context_panel()
        self._init_logs_panel()
        self._init_settings_panel()

        # Select Dashboard by default
        self.sidebar.setCurrentRow(0)

        # 1-second countdown ticker (cheap — no subprocess)
        self._tick_timer = QTimer(self)
        self._tick_timer.timeout.connect(self._tick_countdown)
        self._tick_timer.start(1000)

        # Initial status poll (off-thread)
        self._poll_status()

    # -----------------------------------------------------------------------
    # Panel switching
    # -----------------------------------------------------------------------

    def _switch_panel(self, index: int) -> None:
        self.viewport.setCurrentIndex(index)

        if index == 3:  # Live Logs
            self._start_logs_thread()
        else:
            self._stop_logs_thread()

        if index == 2:  # Context Explorer
            self._load_context_data()

    # -----------------------------------------------------------------------
    # Panel 1 — Dashboard
    # -----------------------------------------------------------------------

    def _init_dashboard_panel(self) -> None:
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(30, 30, 30, 30)

        # Header
        title = QLabel("System Dashboard")
        title.setObjectName("sectionTitle")
        subtitle = QLabel("Live connection state, scheduler controls, and manual synchronisation.")
        subtitle.setObjectName("sectionSubtitle")
        layout.addWidget(title)
        layout.addWidget(subtitle)

        # Connection health row
        health_frame = QFrame()
        health_frame.setObjectName("card")
        health_layout = QHBoxLayout(health_frame)
        health_layout.addWidget(QLabel("<b>Source Integrity:</b>"))
        health_layout.addSpacing(20)

        self._health_dots: dict[str, QLabel] = {}
        for src in ("GitHub", "Linear", "Slack", "Notion"):
            dot = QLabel(f"<span style='color:#f7768e;font-size:16px;'>●</span> {src}")
            health_layout.addWidget(dot)
            self._health_dots[src] = dot

        health_layout.addStretch()
        layout.addWidget(health_frame)
        layout.addSpacing(10)

        # Status cards row
        cards_row = QHBoxLayout()

        card_a = QFrame()
        card_a.setObjectName("card")
        la = QVBoxLayout(card_a)
        la.addWidget(QLabel("<font color='#7aa2f7'><b>LAST SYNCHRONISATION</b></font>"))
        self._lbl_last_refresh = QLabel("—")
        self._lbl_last_refresh.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        la.addWidget(self._lbl_last_refresh)
        cards_row.addWidget(card_a)

        card_b = QFrame()
        card_b.setObjectName("card")
        lb = QVBoxLayout(card_b)
        lb.addWidget(QLabel("<font color='#7aa2f7'><b>NEXT SCHEDULED REFRESH</b></font>"))
        self._lbl_countdown = QLabel("—")
        self._lbl_countdown.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        lb.addWidget(self._lbl_countdown)
        cards_row.addWidget(card_b)

        layout.addLayout(cards_row)
        layout.addSpacing(20)

        # Controls & output
        ctrl_frame = QFrame()
        ctrl_frame.setObjectName("card")
        ctrl_layout = QVBoxLayout(ctrl_frame)

        btn_row = QHBoxLayout()
        btn_row.addWidget(QLabel("<b>Actions &amp; Scheduler Controls:</b>"))
        btn_row.addStretch()

        self._btn_refresh = QPushButton("Refresh Now")
        self._btn_refresh.clicked.connect(self._trigger_refresh)
        btn_row.addWidget(self._btn_refresh)

        self._btn_scheduler = QPushButton("Start Scheduler")
        self._btn_scheduler.setObjectName("toggleBtn")
        self._btn_scheduler.clicked.connect(self._toggle_scheduler)
        btn_row.addWidget(self._btn_scheduler)

        ctrl_layout.addLayout(btn_row)

        self._dash_console = QTextEdit()
        self._dash_console.setReadOnly(True)
        self._dash_console.setPlaceholderText("Console output for active refresh operations…")
        ctrl_layout.addWidget(self._dash_console)

        layout.addWidget(ctrl_frame)
        self.viewport.addWidget(panel)

    # -- Status polling (off-thread) -----------------------------------------

    def _poll_status(self) -> None:
        """Fire a one-shot off-thread status poll; apply results via signal."""
        if self._status_thread and self._status_thread.isRunning():
            return
        self._status_thread = StatusPollThread()
        self._status_thread.status_ready.connect(self._apply_status)
        self._status_thread.start()

    def _apply_status(self, status: dict) -> None:
        # Connection dots
        sources = status.get("sources", {})
        for name, healthy in sources.items():
            if name in self._health_dots:
                color = "#9ece6a" if healthy else "#f7768e"
                self._health_dots[name].setText(
                    f"<span style='color:{color};font-size:16px;'>●</span> {name}"
                )

        # Last refresh label
        self._lbl_last_refresh.setText(status.get("last_refresh", "never"))

        # Scheduler button + state flag
        sched = status.get("scheduler", "stopped")
        self._sched_running = "running" in sched
        if self._sched_running:
            self._btn_scheduler.setText("Stop Scheduler")
            self._btn_scheduler.setStyleSheet("background-color:#f7768e;color:#1a1b26;")
        else:
            self._btn_scheduler.setText("Start Scheduler")
            self._btn_scheduler.setStyleSheet("")

    # -- Countdown tick (purely local arithmetic — no subprocess) ------------

    def _tick_countdown(self) -> None:
        if self._sched_running:
            self._countdown_secs -= 1
            if self._countdown_secs < 0:
                self._countdown_secs = backend.INTERVAL_HOURS * 3600
            h = self._countdown_secs // 3600
            m = (self._countdown_secs % 3600) // 60
            s = self._countdown_secs % 60
            self._lbl_countdown.setText(f"{h:02d}:{m:02d}:{s:02d}")
        else:
            self._lbl_countdown.setText("Paused")

    # -- Refresh action -------------------------------------------------------

    def _trigger_refresh(self) -> None:
        if self._refresh_thread and self._refresh_thread.isRunning():
            return

        self._dash_console.clear()
        self._dash_console.append(
            "<font color='#7aa2f7'><b>Triggering manual context refresh…</b></font>\n"
        )
        self._btn_refresh.setEnabled(False)

        self._refresh_thread = RefreshThread()
        self._refresh_thread.line_received.connect(self._dash_append)
        self._refresh_thread.finished_code.connect(self._on_refresh_done)
        self._refresh_thread.start()

    def _dash_append(self, line: str) -> None:
        if line.startswith(">>>"):
            self._dash_console.append(f"<font color='#7aa2f7'><b>{line}</b></font>")
        elif any(kw in line.lower() for kw in ("error", "failed", "exception")):
            self._dash_console.append(f"<font color='#f7768e'>{line}</font>")
        elif any(kw in line.lower() for kw in ("success", "completed", "done")):
            self._dash_console.append(f"<font color='#9ece6a'>{line}</font>")
        else:
            self._dash_console.append(f"<font color='#c0caf5'>{line}</font>")
        self._dash_console.moveCursor(QTextCursor.MoveOperation.End)

    def _on_refresh_done(self, code: int) -> None:
        self._btn_refresh.setEnabled(True)
        if code == 0:
            self._dash_console.append(
                "\n<font color='#9ece6a'><b>✓ Context refresh completed!</b></font>"
            )
            self._countdown_secs = backend.INTERVAL_HOURS * 3600
        else:
            self._dash_console.append(
                f"\n<font color='#f7768e'><b>✗ Refresh finished with code {code}</b></font>"
            )
        self._poll_status()

    # -- Scheduler toggle (off-thread) ----------------------------------------

    def _toggle_scheduler(self) -> None:
        self._btn_scheduler.setEnabled(False)
        self._dash_console.clear()

        if self._sched_running:
            self._dash_console.append(
                "<font color='#7aa2f7'><b>Stopping Sorelax daemon…</b></font>"
            )
            self._sched_stop_thread = SchedulerStopThread()
            self._sched_stop_thread.finished_code.connect(self._on_sched_stop_done)
            self._sched_stop_thread.start()
        else:
            self._dash_console.append(
                "<font color='#7aa2f7'><b>Starting Sorelax daemon…</b></font>"
            )
            self._sched_start_thread = SchedulerStartThread()
            self._sched_start_thread.line_received.connect(self._dash_append)
            self._sched_start_thread.finished_code.connect(self._on_sched_start_done)
            self._sched_start_thread.start()

    def _on_sched_stop_done(self, code: int) -> None:
        self._btn_scheduler.setEnabled(True)
        if code == 0:
            self._dash_console.append(
                "<font color='#9ece6a'><b>✓ Scheduler stopped.</b></font>"
            )
        else:
            self._dash_console.append(
                "<font color='#f7768e'><b>✗ Stop command returned non-zero. Check PID.</b></font>"
            )
        self._poll_status()

    def _on_sched_start_done(self, code: int) -> None:
        self._btn_scheduler.setEnabled(True)
        if code == 0:
            self._dash_console.append(
                "<font color='#9ece6a'><b>✓ Scheduler started.</b></font>"
            )
            self._countdown_secs = backend.INTERVAL_HOURS * 3600
        else:
            self._dash_console.append(
                f"<font color='#f7768e'><b>✗ Scheduler start finished with code {code}</b></font>"
            )
        self._poll_status()

    # -----------------------------------------------------------------------
    # Panel 2 — Ask
    # -----------------------------------------------------------------------

    def _init_ask_panel(self) -> None:
        panel = QWidget()
        layout = QHBoxLayout(panel)
        layout.setContentsMargins(30, 30, 30, 30)

        # History sidebar
        history_box = QVBoxLayout()
        history_box.addWidget(QLabel("<b>Q&amp;A Session History</b>"))
        self._history_list = QListWidget()
        self._history_list.setObjectName("historyList")
        self._history_list.setFixedWidth(200)
        self._history_list.itemClicked.connect(self._on_history_clicked)
        history_box.addWidget(self._history_list)
        layout.addLayout(history_box)

        # Main Q&A area
        main_qa = QVBoxLayout()

        title = QLabel("Ask Sorelax")
        title.setObjectName("sectionTitle")
        subtitle = QLabel(
            "Query cross-source knowledge graphs on demand using natural language."
        )
        subtitle.setObjectName("sectionSubtitle")
        main_qa.addWidget(title)
        main_qa.addWidget(subtitle)

        search_row = QHBoxLayout()
        self._ask_input = QLineEdit()
        self._ask_input.setPlaceholderText("Ask a question about the project state…")
        self._ask_input.returnPressed.connect(self._trigger_ask)
        self._btn_ask = QPushButton("Submit")
        self._btn_ask.clicked.connect(self._trigger_ask)
        search_row.addWidget(self._ask_input)
        search_row.addWidget(self._btn_ask)
        main_qa.addLayout(search_row)

        self._ask_console = QTextEdit()
        self._ask_console.setReadOnly(True)
        self._ask_console.setPlaceholderText("Answer will stream here…")
        main_qa.addWidget(self._ask_console)

        layout.addLayout(main_qa)
        self.viewport.addWidget(panel)

        # Session cache: query -> accumulated answer text
        self._qa_cache: dict[str, str] = {}
        self._current_query: str = ""

    def _trigger_ask(self) -> None:
        query = self._ask_input.text().strip()
        if not query:
            return
        if self._ask_thread and self._ask_thread.isRunning():
            return

        self._ask_console.clear()
        self._ask_console.append(
            f"<font color='#7aa2f7'><b>Querying: '{query}'…</b></font>\n"
        )
        self._btn_ask.setEnabled(False)
        self._current_query = query

        # Add to history sidebar
        if query not in self._qa_cache:
            self._history_list.insertItem(0, QListWidgetItem(query))
            self._qa_cache[query] = ""

        self._ask_thread = AskThread(query)
        self._ask_thread.line_received.connect(self._on_ask_line)
        self._ask_thread.finished_code.connect(self._on_ask_done)
        self._ask_thread.start()

    def _on_ask_line(self, line: str) -> None:
        self._ask_console.append(f"<font color='#c0caf5'>{line}</font>")
        self._ask_console.moveCursor(QTextCursor.MoveOperation.End)
        self._qa_cache[self._current_query] += line + "\n"

    def _on_ask_done(self, code: int) -> None:
        self._btn_ask.setEnabled(True)
        self._ask_input.clear()
        if code != 0:
            self._ask_console.append(
                f"\n<font color='#f7768e'><b>✗ Query failed with code {code}</b></font>"
            )

    def _on_history_clicked(self, item: QListWidgetItem) -> None:
        query = item.text()
        cached = self._qa_cache.get(query, "No cached answer.")
        self._ask_console.clear()
        self._ask_console.append(
            f"<font color='#7aa2f7'><b>Session query: '{query}'</b></font>\n"
        )
        self._ask_console.append(cached)

    # -----------------------------------------------------------------------
    # Panel 3 — Context Explorer
    # -----------------------------------------------------------------------

    def _init_context_panel(self) -> None:
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(30, 30, 30, 30)

        header = QHBoxLayout()
        title_box = QVBoxLayout()
        title = QLabel("Context Explorer")
        title.setObjectName("sectionTitle")
        subtitle = QLabel("Interactive view of the Sorelax synchronised project state.")
        subtitle.setObjectName("sectionSubtitle")
        title_box.addWidget(title)
        title_box.addWidget(subtitle)
        header.addLayout(title_box)
        header.addStretch()

        reload_btn = QPushButton("Reload")
        reload_btn.clicked.connect(self._load_context_data)
        header.addWidget(reload_btn)
        layout.addLayout(header)

        self._ctx_scroll = QScrollArea()
        self._ctx_scroll.setWidgetResizable(True)
        self._ctx_content = QWidget()
        self._ctx_layout = QVBoxLayout(self._ctx_content)
        self._ctx_scroll.setWidget(self._ctx_content)
        layout.addWidget(self._ctx_scroll)

        self.viewport.addWidget(panel)

    def _clear_ctx_layout(self) -> None:
        """Safely remove all child widgets from the context scroll layout."""
        while self._ctx_layout.count():
            item = self._ctx_layout.takeAt(0)
            if item is not None:
                w = item.widget()
                if w is not None:
                    w.deleteLater()

    def _load_context_data(self) -> None:
        self._clear_ctx_layout()
        ctx = backend.read_context()

        if not ctx:
            placeholder = QLabel(
                "Sorelax context database is empty.\n"
                "Synchronise using the Dashboard refresh first."
            )
            placeholder.setStyleSheet("color:#565f89;font-style:italic;padding:20px;")
            placeholder.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self._ctx_layout.addWidget(placeholder)
            return

        # Cards grouped by common top-level context keys
        card_defs = [
            ("sprint_goal", "🎯 Sprint Objective", lambda v: str(v)),
            ("key_actions", "⚡ Priority Actions", lambda v: "\n".join(f"• {a}" for a in v)),
            ("recent_progress", "📈 Recent Developments", lambda v: "\n".join(f"• {p}" for p in v)),
            ("pr_status", "🐙 PR Status", lambda v: str(v)),
            ("architecture_docs", "📂 Architecture Docs",
             lambda v: "\n".join(f"• {d.get('title', str(d))}" for d in v)),
        ]

        shown = 0
        for key, card_title, formatter in card_defs:
            value = ctx.get(key)
            if value:
                try:
                    self._add_context_card(card_title, formatter(value))
                    shown += 1
                except Exception:
                    pass

        # Fallback: render all top-level string/int fields as a catch-all card
        if shown == 0:
            known_keys = {k for k, _, _ in card_defs}
            extra_lines = []
            for k, v in ctx.items():
                if k not in known_keys and isinstance(v, (str, int, float, bool)):
                    extra_lines.append(f"<b>{k}:</b> {v}")
            if extra_lines:
                self._add_context_card("📋 Raw Context Fields", "\n".join(extra_lines))
            else:
                placeholder = QLabel("Context data present but in an unrecognised format.")
                placeholder.setStyleSheet("color:#565f89;padding:20px;")
                self._ctx_layout.addWidget(placeholder)

        self._ctx_layout.addStretch()

    def _add_context_card(self, title: str, content: str) -> None:
        card = QFrame()
        card.setObjectName("card")
        card_layout = QVBoxLayout(card)

        lbl_title = QLabel(f"<b>{title}</b>")
        lbl_title.setStyleSheet("font-size:15px;color:#7aa2f7;")
        card_layout.addWidget(lbl_title)

        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet("background-color:#3b4261;")
        card_layout.addWidget(sep)

        lbl_content = QLabel(content)
        lbl_content.setWordWrap(True)
        lbl_content.setStyleSheet("color:#c0caf5;line-height:1.5;")
        card_layout.addWidget(lbl_content)

        self._ctx_layout.addWidget(card)

    # -----------------------------------------------------------------------
    # Panel 4 — Live Logs
    # -----------------------------------------------------------------------

    def _init_logs_panel(self) -> None:
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(30, 30, 30, 30)

        header = QHBoxLayout()
        title_box = QVBoxLayout()
        title = QLabel("Live Tail Daemon Logs")
        title.setObjectName("sectionTitle")
        subtitle = QLabel("Real-time telemetry stream from the Sorelax daemon scheduler.")
        subtitle.setObjectName("sectionSubtitle")
        title_box.addWidget(title)
        title_box.addWidget(subtitle)
        header.addLayout(title_box)
        header.addStretch()

        self._btn_logs_toggle = QPushButton("Pause")
        self._btn_logs_toggle.clicked.connect(self._toggle_logs)
        header.addWidget(self._btn_logs_toggle)
        layout.addLayout(header)

        self._logs_terminal = QTextEdit()
        self._logs_terminal.setReadOnly(True)
        self._logs_terminal.setPlaceholderText("Log entries will appear here…")
        layout.addWidget(self._logs_terminal)

        self.viewport.addWidget(panel)
        self._logs_active = False

    def _start_logs_thread(self) -> None:
        if self._logs_active:
            return

        self._logs_active = True
        self._logs_terminal.clear()
        self._logs_terminal.append(
            "<font color='#7aa2f7'><b>Connecting to log stream…</b></font>\n"
        )
        self._btn_logs_toggle.setText("Pause")
        self._btn_logs_toggle.setStyleSheet("")

        self._logs_thread = LogsThread()
        self._logs_thread.line_received.connect(self._on_log_line)
        self._logs_thread.start()

    def _stop_logs_thread(self) -> None:
        if not self._logs_active:
            return
        self._logs_active = False
        if self._logs_thread:
            self._logs_thread.stop()
            self._logs_thread.wait(2000)
            self._logs_thread = None
        self._btn_logs_toggle.setText("Resume")
        self._btn_logs_toggle.setStyleSheet(
            "background-color:#24283b;color:#7aa2f7;border:1px solid #3b4261;"
        )

    def _toggle_logs(self) -> None:
        if self._logs_active:
            self._stop_logs_thread()
            self._logs_terminal.append(
                "\n<font color='#e0af68'><b>Stream paused.</b></font>"
            )
        else:
            self._start_logs_thread()

    def _on_log_line(self, line: str) -> None:
        try:
            entry = json.loads(line)
            ts = entry.get("timestamp", "?")
            status = entry.get("status", "ok")
            rows = entry.get("row_count", 0)
            color = "#9ece6a" if status == "ok" else "#f7768e"
            self._logs_terminal.append(
                f"<font color='#565f89'>[{ts}]</font> "
                f"Sync: <font color='{color}'><b>{status.upper()}</b></font> · "
                f"Rows: <b>{rows}</b>"
            )
        except Exception:
            self._logs_terminal.append(f"<font color='#565f89'>{line}</font>")
        self._logs_terminal.moveCursor(QTextCursor.MoveOperation.End)

    # -----------------------------------------------------------------------
    # Panel 5 — Settings
    # -----------------------------------------------------------------------

    def _init_settings_panel(self) -> None:
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(30, 30, 30, 30)

        title = QLabel("Settings")
        title.setObjectName("sectionTitle")
        subtitle = QLabel("Manage integration credentials and repository tokens.")
        subtitle.setObjectName("sectionSubtitle")
        layout.addWidget(title)
        layout.addWidget(subtitle)

        form_frame = QFrame()
        form_frame.setObjectName("card")
        form_layout = QFormLayout(form_frame)
        form_layout.setLabelAlignment(Qt.AlignmentFlag.AlignRight)
        form_layout.setSpacing(12)

        tokens = self._load_tokens()

        self._settings_fields: dict[str, QLineEdit] = {}
        fields_def = [
            ("GITHUB_TOKEN", "GitHub Token"),
            ("GITHUB_OWNER", "GitHub Owner"),
            ("GITHUB_REPO", "GitHub Repo"),
            ("LINEAR_API_KEY", "Linear API Key"),
            ("SLACK_TOKEN", "Slack Bot Token"),
            ("NOTION_API_KEY", "Notion API Key"),
            ("GEMINI_API_KEY", "Gemini API Key"),
        ]

        for env_name, label in fields_def:
            row = QHBoxLayout()
            edit = QLineEdit(tokens.get(env_name, ""))
            edit.setEchoMode(QLineEdit.EchoMode.Password)
            row.addWidget(edit)

            vis_btn = QPushButton("Show")
            vis_btn.setFixedWidth(60)
            vis_btn.setStyleSheet(
                "background-color:#24283b;color:#7aa2f7;"
                "border:1px solid #3b4261;border-radius:4px;padding:4px;"
            )
            vis_btn.clicked.connect(
                lambda _checked, e=edit, b=vis_btn: self._toggle_vis(e, b)
            )
            row.addWidget(vis_btn)

            form_layout.addRow(QLabel(label), row)
            self._settings_fields[env_name] = edit

        layout.addWidget(form_frame)
        layout.addSpacing(10)

        self._lbl_settings_status = QLabel("")
        self._lbl_settings_status.setStyleSheet("font-weight:bold;font-size:13px;")
        layout.addWidget(self._lbl_settings_status)

        layout.addSpacing(10)

        self._btn_save = QPushButton("Save Settings & Apply Sources")
        self._btn_save.clicked.connect(self._save_settings)
        layout.addWidget(self._btn_save)

        layout.addStretch()
        self.viewport.addWidget(panel)

    def _load_tokens(self) -> dict[str, str]:
        try:
            from dotenv import dotenv_values
            root = backend._repo_root()
            env_path = root / ".env"
            if not env_path.exists():
                env_path = Path.home() / ".sorelax" / ".env"
            if env_path.exists():
                return dict(dotenv_values(str(env_path)))
        except Exception:
            pass
        return {}

    def _toggle_vis(self, edit: QLineEdit, btn: QPushButton) -> None:
        if edit.echoMode() == QLineEdit.EchoMode.Password:
            edit.setEchoMode(QLineEdit.EchoMode.Normal)
            btn.setText("Hide")
        else:
            edit.setEchoMode(QLineEdit.EchoMode.Password)
            btn.setText("Show")

    def _save_settings(self) -> None:
        if self._save_thread and self._save_thread.isRunning():
            return

        tokens = {name: edit.text().strip() for name, edit in self._settings_fields.items()}
        self._lbl_settings_status.setText(
            "<font color='#7aa2f7'>Saving credentials and registering Coral sources…</font>"
        )
        self._btn_save.setEnabled(False)

        self._save_thread = SaveEnvThread(tokens)
        self._save_thread.finished_ok.connect(self._on_save_ok)
        self._save_thread.finished_err.connect(self._on_save_err)
        self._save_thread.start()

    def _on_save_ok(self) -> None:
        self._btn_save.setEnabled(True)
        self._lbl_settings_status.setText(
            "<font color='#9ece6a'>✓ Configuration saved and Coral sources registered!</font>"
        )
        self._poll_status()

    def _on_save_err(self, msg: str) -> None:
        self._btn_save.setEnabled(True)
        self._lbl_settings_status.setText(
            f"<font color='#f7768e'>✗ Failed: {msg}</font>"
        )

    # -----------------------------------------------------------------------
    # Cleanup
    # -----------------------------------------------------------------------

    def closeEvent(self, event) -> None:  # noqa: N802
        self._stop_logs_thread()
        # Ask any running thread to stop (best-effort)
        for attr in (
            "_refresh_thread", "_ask_thread",
            "_sched_start_thread", "_sched_stop_thread",
            "_status_thread", "_save_thread",
        ):
            thread = getattr(self, attr, None)
            if thread and thread.isRunning():
                thread.wait(1000)
        event.accept()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    app = QApplication(sys.argv)
    app.setStyle("Fusion")

    palette = QPalette()
    palette.setColor(QPalette.ColorRole.Window, QColor("#1a1b26"))
    palette.setColor(QPalette.ColorRole.WindowText, QColor("#a9b1d6"))
    palette.setColor(QPalette.ColorRole.Base, QColor("#16161e"))
    palette.setColor(QPalette.ColorRole.AlternateBase, QColor("#1f2335"))
    palette.setColor(QPalette.ColorRole.ToolTipBase, QColor("#16161e"))
    palette.setColor(QPalette.ColorRole.ToolTipText, QColor("#a9b1d6"))
    palette.setColor(QPalette.ColorRole.Text, QColor("#c0caf5"))
    palette.setColor(QPalette.ColorRole.Button, QColor("#1f2335"))
    palette.setColor(QPalette.ColorRole.ButtonText, QColor("#c0caf5"))
    palette.setColor(QPalette.ColorRole.BrightText, QColor("#f7768e"))
    palette.setColor(QPalette.ColorRole.Highlight, QColor("#7aa2f7"))
    palette.setColor(QPalette.ColorRole.HighlightedText, QColor("#1a1b26"))
    app.setPalette(palette)

    window = SorelaxDashboard()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
