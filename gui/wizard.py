"""PyQt6 Setup Wizard for Sorelax.

Provides a Tokyo Night styled 4-page wizard that:
  1. Checks system dependencies (curl, pip, coral)
  2. Collects integration tokens
  3. Runs the install pipeline in a QThread with live output
  4. Shows a "Done" page with copyable commands

When the wizard completes, it emits ``SorelaxWizard.setup_complete`` so the
caller (gui/main.py) can open the real dashboard without restarting the process.

NOTE: The old lightweight ``MainWindow`` class that previously lived here is
kept for import-compatibility but no longer opened by the wizard itself.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Callable

from PyQt6.QtCore import QSize, QThread, Qt, pyqtSignal
from PyQt6.QtGui import QColor, QFont, QPalette, QTextCursor
from PyQt6.QtWidgets import (
    QApplication,
    QFormLayout,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QScrollArea,
    QTabWidget,
    QTextEdit,
    QVBoxLayout,
    QWidget,
    QWizard,
    QWizardPage,
)

# Robust import of gui/backend.py
try:
    import gui.backend as backend
except ImportError:
    # If run directly from gui/ folder, insert parent to sys.path
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    import gui.backend as backend

# Stylesheet for high-end Tokyo Night aesthetics
TOKYO_NIGHT_STYLE = """
/* Core Shell */
QWizard, QMainWindow, QWizardPage, QWidget {
    background-color: #1a1b26;
    color: #a9b1d6;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
}

QTabWidget::pane {
    border: 1px solid #3b4261;
    background-color: #1f2335;
    border-radius: 8px;
}

QTabBar::tab {
    background-color: #16161e;
    color: #787c99;
    border: 1px solid #3b4261;
    border-bottom: none;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    padding: 10px 16px;
    margin-right: 2px;
}

QTabBar::tab:selected, QTabBar::tab:hover {
    background-color: #1f2335;
    color: #7aa2f7;
    border-bottom: 2px solid #7aa2f7;
}

/* Headers */
QLabel#title {
    font-size: 22px;
    font-weight: bold;
    color: #7aa2f7;
    padding-bottom: 5px;
}

QLabel#subtitle {
    font-size: 13px;
    color: #565f89;
    margin-bottom: 15px;
}

/* Forms & Inputs */
QLineEdit {
    background-color: #24283b;
    border: 1px solid #3b4261;
    border-radius: 6px;
    padding: 8px 12px;
    color: #c0caf5;
    selection-background-color: #364a82;
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
    font-size: 13px;
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

QPushButton#copyBtn {
    background-color: #24283b;
    color: #7aa2f7;
    border: 1px solid #3b4261;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
}

QPushButton#copyBtn:hover {
    background-color: #3b4261;
    color: #89ddff;
}

/* Cards & Frames */
QFrame#card {
    background-color: #1f2335;
    border: 1px solid #3b4261;
    border-radius: 8px;
    padding: 12px;
}

QFrame#terminalFrame {
    border: 1px solid #414868;
    border-radius: 8px;
    background-color: #16161e;
}

/* Scroll Area */
QScrollArea {
    border: none;
    background-color: transparent;
}

QScrollBar:vertical {
    border: none;
    background-color: #16161e;
    width: 10px;
    margin: 0px;
}

QScrollBar::handle:vertical {
    background-color: #414868;
    min-height: 20px;
    border-radius: 5px;
}

QScrollBar::handle:vertical:hover {
    background-color: #7aa2f7;
}

/* QTextEdit Console */
QTextEdit {
    background-color: #16161e;
    color: #a9b1d6;
    border: none;
    font-family: 'Consolas', 'Fira Code', 'Courier New', monospace;
    font-size: 12px;
}
"""


class InstallThread(QThread):
    """Runs backend.run_install() off-thread and streams output lines."""

    line_received = pyqtSignal(str)
    finished_success = pyqtSignal(bool)

    def __init__(self, tokens: dict[str, str]) -> None:
        super().__init__()
        self.tokens = tokens

    def run(self) -> None:
        try:
            success = backend.run_install(self.tokens, self._emit)
            self.finished_success.emit(success)
        except Exception as exc:
            self._emit(f"\n>>> CRITICAL ERROR in install thread: {exc}\n")
            self.finished_success.emit(False)

    def _emit(self, line: str) -> None:
        self.line_received.emit(line)


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
    """Starts the Sorelax daemon off-thread."""

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
    """Stops the Sorelax daemon off-thread."""

    finished_code = pyqtSignal(int)

    def run(self) -> None:
        try:
            code = backend.stop_scheduler()
            self.finished_code.emit(code)
        except Exception:
            self.finished_code.emit(1)


class DependencyPage(QWizardPage):
    """Page 1: Check dependencies and block unless curl, pip, and coral are installed."""

    def __init__(self):
        super().__init__()
        self.curl_ok = False
        self.pip_ok = False
        self.coral_ok = False

        self.setTitle("Sorelax Installation Wizard")
        
        layout = QVBoxLayout(self)
        
        # Header
        title = QLabel("System Dependency Check")
        title.setObjectName("title")
        subtitle = QLabel("Checking for required tools on your system path.")
        subtitle.setObjectName("subtitle")
        layout.addWidget(title)
        layout.addWidget(subtitle)

        # Status Cards Container
        self.cards_layout = QVBoxLayout()
        layout.addLayout(self.cards_layout)

        # Coral Install Box (Only shown if Coral is missing)
        self.install_frame = QFrame()
        self.install_frame.setObjectName("card")
        self.install_frame.setVisible(False)
        inst_layout = QVBoxLayout(self.install_frame)
        
        inst_label = QLabel("<b>Coral SQL is missing!</b> Install it using the command below:")
        inst_label.setStyleSheet("color: #bb9af3;")
        inst_layout.addWidget(inst_label)
        
        cmd_row = QHBoxLayout()
        self.cmd_line = QLineEdit("curl -fsSL https://withcoral.com/install.sh | sh")
        self.cmd_line.setReadOnly(True)
        
        copy_btn = QPushButton("Copy")
        copy_btn.setObjectName("copyBtn")
        copy_btn.clicked.connect(self.copy_install_command)
        
        cmd_row.addWidget(self.cmd_line)
        cmd_row.addWidget(copy_btn)
        inst_layout.addLayout(cmd_row)
        layout.addWidget(self.install_frame)

        # Bottom space
        layout.addStretch()

        # Retry button
        self.retry_btn = QPushButton("Re-check Dependencies")
        self.retry_btn.clicked.connect(self.run_checks)
        layout.addWidget(self.retry_btn)

    def initializePage(self):
        self.run_checks()

    def run_checks(self) -> None:
        # Safely remove all child widgets (guard against spacer items)
        while self.cards_layout.count():
            item = self.cards_layout.takeAt(0)
            if item is not None:
                w = item.widget()
                if w is not None:
                    w.deleteLater()

        deps = backend.check_dependencies()

        self.curl_ok = deps.get("curl", {}).get("installed", False)
        self.pip_ok = deps.get("pip", {}).get("installed", False)
        self.coral_ok = deps.get("coral", {}).get("installed", False)

        # Render labels for each dependency
        self.add_dep_row("curl (HTTP Client)", self.curl_ok, deps.get("curl", {}).get("version"))
        self.add_dep_row("pip (Python Package Manager)", self.pip_ok, deps.get("pip", {}).get("version"))
        self.add_dep_row("coral (Coral SQL engine)", self.coral_ok, deps.get("coral", {}).get("version"))

        # Toggle install instructions frame
        self.install_frame.setVisible(not self.coral_ok)

        # Notify wizard to refresh Next button status
        self.completeChanged.emit()

    def add_dep_row(self, name: str, success: bool, version: str | None):
        row = QFrame()
        row.setObjectName("card")
        row_layout = QHBoxLayout(row)

        indicator = QLabel("✓" if success else "✗")
        indicator.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        indicator.setStyleSheet("color: #9ece6a;" if success else "color: #f7768e;")
        row_layout.addWidget(indicator)

        details = QVBoxLayout()
        lbl_name = QLabel(f"<b>{name}</b>")
        lbl_name.setStyleSheet("color: #c0caf5;")
        
        version_str = version if version else "Not installed"
        lbl_version = QLabel(version_str)
        lbl_version.setStyleSheet("color: #565f89; font-size: 11px;")
        
        details.addWidget(lbl_name)
        details.addWidget(lbl_version)
        row_layout.addLayout(details)
        row_layout.addStretch()

        self.cards_layout.addWidget(row)

    def isComplete(self) -> bool:
        return self.curl_ok and self.pip_ok and self.coral_ok

    def copy_install_command(self):
        clipboard = QApplication.clipboard()
        clipboard.setText(self.cmd_line.text())
        QMessageBox.information(self, "Copied", "Coral installation command copied to clipboard!")


class TokenPage(QWizardPage):
    """Page 2: Collect all Sorelax integration credentials."""

    def __init__(self):
        super().__init__()
        self.setTitle("Sorelax Credentials Configuration")
        
        layout = QVBoxLayout(self)

        title = QLabel("API & Source Tokens")
        title.setObjectName("title")
        subtitle = QLabel("Configure Sorelax environment credentials. All fields are required.")
        subtitle.setObjectName("subtitle")
        layout.addWidget(title)
        layout.addWidget(subtitle)

        form_frame = QFrame()
        form_frame.setObjectName("card")
        form_layout = QFormLayout(form_frame)
        form_layout.setLabelAlignment(Qt.AlignmentFlag.AlignRight)

        # Form fields
        self.fields = {}
        fields_def = [
            ("github_token", "GitHub Token"),
            ("github_owner", "GitHub Owner"),
            ("github_repo", "GitHub Repo Name"),
            ("linear_api_key", "Linear API Key"),
            ("slack_token", "Slack Bot Token"),
            ("notion_token", "Notion Integration Token"),
            ("gemini_api_key", "Gemini API Key"),
        ]

        for internal_name, label_text in fields_def:
            edit = QLineEdit()
            edit.setEchoMode(QLineEdit.EchoMode.Password)
            form_layout.addRow(QLabel(label_text), edit)
            self.fields[internal_name] = edit
            self.registerField(internal_name, edit)

        layout.addWidget(form_frame)
        layout.addStretch()

    def validatePage(self) -> bool:
        has_empty = False
        for name, edit in self.fields.items():
            if not edit.text().strip():
                edit.setStyleSheet("border: 1px solid #f7768e; background-color: #2e243b;")
                has_empty = True
            else:
                edit.setStyleSheet("")
                
        if has_empty:
            QMessageBox.warning(
                self,
                "Required Fields",
                "Please fill in all Sorelax configuration fields before starting installation.",
            )
            return False
        return True


class ProgressPage(QWizardPage):
    """Page 3: Run the install thread while displaying active console output."""

    def __init__(self):
        super().__init__()
        self.setTitle("Installing Sorelax Components")
        self.is_running = False
        self.install_success = False

        layout = QVBoxLayout(self)

        title = QLabel("System Configuration Progress")
        title.setObjectName("title")
        subtitle = QLabel("Executing Python setup, writing local .env database, registering Hermes skills...")
        subtitle.setObjectName("subtitle")
        layout.addWidget(title)
        layout.addWidget(subtitle)

        # Monospace terminal log output
        term_frame = QFrame()
        term_frame.setObjectName("terminalFrame")
        term_layout = QVBoxLayout(term_frame)
        term_layout.setContentsMargins(1, 1, 1, 1)

        self.terminal = QTextEdit()
        self.terminal.setReadOnly(True)
        term_layout.addWidget(self.terminal)
        layout.addWidget(term_frame)

        layout.addStretch()

    def initializePage(self):
        if self.is_running:
            return

        self.is_running = True
        self.install_success = False
        self.terminal.clear()
        
        # Block user navigation during install
        self.wizard().button(QWizard.WizardButton.BackButton).setEnabled(False)
        self.wizard().button(QWizard.WizardButton.NextButton).setEnabled(False)

        # Gather token dict from previous page fields
        tokens = {
            "GITHUB_TOKEN": self.field("github_token"),
            "GITHUB_OWNER": self.field("github_owner"),
            "GITHUB_REPO": self.field("github_repo"),
            "LINEAR_API_KEY": self.field("linear_api_key"),
            "SLACK_TOKEN": self.field("slack_token"),
            "NOTION_TOKEN": self.field("notion_token"),
            "GEMINI_API_KEY": self.field("gemini_api_key"),
        }

        # Spawn installer worker thread
        self.thread = InstallThread(tokens)
        self.thread.line_received.connect(self.append_terminal_line)
        self.thread.finished_success.connect(self.on_install_finish)
        self.thread.start()

    def append_terminal_line(self, line: str):
        # Color coding logic for elegant output styling
        if line.startswith(">>>"):
            # Step header lines -> cyan/blue
            self.terminal.append(f"<font color='#7aa2f7'><b>{line}</b></font>")
        elif "error" in line.lower() or "failed" in line.lower() or "✗" in line.lower():
            # Error lines -> red
            self.terminal.append(f"<font color='#f7768e'>{line}</font>")
        elif "success" in line.lower() or "✓" in line.lower() or "completed" in line.lower():
            # Success lines -> green
            self.terminal.append(f"<font color='#9ece6a'>{line}</font>")
        else:
            # Regular output -> neutral gray-blue
            self.terminal.append(f"<font color='#c0caf5'>{line}</font>")

        self.terminal.moveCursor(QTextCursor.MoveOperation.End)

    def on_install_finish(self, success: bool):
        self.is_running = False
        self.install_success = success

        # Enable Back button so user can fix credentials if failure occurs
        self.wizard().button(QWizard.WizardButton.BackButton).setEnabled(True)

        if success:
            # Enable Next page button
            self.wizard().button(QWizard.WizardButton.NextButton).setEnabled(True)
            self.terminal.append(
                "\n<font color='#9ece6a'><b>✓ Sorelax setup pipeline completed successfully! Click Next.</b></font>"
            )
        else:
            self.terminal.append(
                "\n<font color='#f7768e'><b>✗ Setup pipeline failed. Click Back to check entered credentials.</b></font>"
            )
            QMessageBox.critical(
                self,
                "Installation Failed",
                "Sorelax setup did not complete successfully. Check the terminal logs for details.",
            )

        self.terminal.moveCursor(QTextCursor.MoveOperation.End)
        self.completeChanged.emit()

    def isComplete(self) -> bool:
        return not self.is_running and self.install_success


class DonePage(QWizardPage):
    """Page 4: Done page displaying copyable terminal actions for manual execution."""

    def __init__(self):
        super().__init__()
        self.setTitle("Sorelax Setup Completed")

        layout = QVBoxLayout(self)

        title = QLabel("Initialization Completed Successfully!")
        title.setObjectName("title")
        title.setStyleSheet("color: #9ece6a;")
        subtitle = QLabel("Your environment is configured. Use the following Hermes commands to start scheduling:")
        subtitle.setObjectName("subtitle")
        layout.addWidget(title)
        layout.addWidget(subtitle)

        # Instructions panel
        inst_frame = QFrame()
        inst_frame.setObjectName("card")
        inst_layout = QVBoxLayout(inst_frame)

        instructions = [
            ("1. Select & configure LLM provider for Hermes scheduler:", "hermes model"),
            ("2. Launch active background gateway scheduler:", "hermes gateway"),
            ("3. Perform context synchronization manually:", "sorelax refresh"),
        ]

        for title_text, cmd_text in instructions:
            inst_layout.addWidget(QLabel(f"<b>{title_text}</b>"))
            
            row = QHBoxLayout()
            cmd_line = QLineEdit(cmd_text)
            cmd_line.setReadOnly(True)
            
            copy_btn = QPushButton("Copy")
            copy_btn.setObjectName("copyBtn")
            # Safe binding with lambda capturing current cmd_text
            copy_btn.clicked.connect(lambda checked, text=cmd_text: self.copy_text(text))
            
            row.addWidget(cmd_line)
            row.addWidget(copy_btn)
            inst_layout.addLayout(row)
            inst_layout.addSpacing(5)

        layout.addWidget(inst_frame)
        layout.addStretch()

    def copy_text(self, text: str):
        clipboard = QApplication.clipboard()
        clipboard.setText(text)
        QMessageBox.information(self, "Copied", f"Command copied to clipboard: '{text}'")


class SorelaxWizard(QWizard):
    """4-page setup wizard with Tokyo Night styling.

    On completion the wizard emits ``setup_complete`` instead of opening any
    window itself.  The caller (gui/main.py) connects that signal to open the
    real ``SorelaxDashboard``.
    """

    # Emitted after the user clicks Finish on the Done page.
    setup_complete = pyqtSignal()

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("Sorelax Setup & Install Wizard")
        self.setStyleSheet(TOKYO_NIGHT_STYLE)
        self.setWizardStyle(QWizard.WizardStyle.ModernStyle)
        self.setOption(QWizard.WizardOption.NoCancelButton, True)
        self.setFixedSize(650, 520)

        self.dep_page = DependencyPage()
        self.token_page = TokenPage()
        self.progress_page = ProgressPage()
        self.done_page = DonePage()

        self.addPage(self.dep_page)
        self.addPage(self.token_page)
        self.addPage(self.progress_page)
        self.addPage(self.done_page)

    def accept(self) -> None:
        """Emit setup_complete then close — the caller opens the dashboard."""
        super().accept()
        self.setup_complete.emit()


class MainWindow(QMainWindow):
    """Main dashboard application displayed once Sorelax is configured."""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Sorelax Developer Dashboard")
        self.setStyleSheet(TOKYO_NIGHT_STYLE)
        self.resize(800, 600)

        self.refresh_thread = None
        self.ask_thread = None

        # Base Widget
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)

        # Header Row
        header = QHBoxLayout()
        title = QLabel("Sorelax Context Manager")
        title.setStyleSheet("font-size: 24px; font-weight: bold; color: #7aa2f7;")
        header.addWidget(title)
        
        self.status_badge = QLabel("CONFIGURED")
        self.status_badge.setStyleSheet(
            "background-color: #1f2335; border: 1px solid #9ece6a; "
            "color: #9ece6a; border-radius: 4px; padding: 4px 8px; font-weight: bold;"
        )
        header.addWidget(self.status_badge)
        header.addStretch()
        layout.addLayout(header)

        # Tabs Layout
        self.tabs = QTabWidget()
        layout.addWidget(self.tabs)

        # Render internal tabs
        self.init_status_tab()
        self.init_ask_tab()
        self.init_logs_tab()

        self.update_status_metrics()

    def init_status_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        # Health grid card container
        grid_frame = QFrame()
        grid_frame.setObjectName("card")
        grid = QGridLayout(grid_frame)

        self.lbl_last_ref = QLabel("<b>Last Context Refresh:</b> Loading...")
        self.lbl_sched_status = QLabel("<b>Scheduler Process:</b> Loading...")
        self.lbl_context_path = QLabel("<b>Context Path:</b> Loading...")
        grid.addWidget(self.lbl_last_ref, 0, 0)
        grid.addWidget(self.lbl_sched_status, 1, 0)
        grid.addWidget(self.lbl_context_path, 2, 0)

        layout.addWidget(grid_frame)

        # Sources status container
        sources_frame = QFrame()
        sources_frame.setObjectName("card")
        src_layout = QVBoxLayout(sources_frame)
        src_layout.addWidget(QLabel("<b>Integration Source Health:</b>"))
        
        self.sources_health_lbl = QLabel("Fetching source health...")
        self.sources_health_lbl.setStyleSheet("color: #787c99; padding-left: 10px;")
        src_layout.addWidget(self.sources_health_lbl)
        layout.addWidget(sources_frame)

        # Interactive controls frame
        btn_layout = QHBoxLayout()
        refresh_btn = QPushButton("Refresh Context Now")
        refresh_btn.clicked.connect(self.trigger_refresh)
        
        start_sched_btn = QPushButton("Start Background Scheduler")
        start_sched_btn.clicked.connect(self.trigger_start_scheduler)
        
        stop_sched_btn = QPushButton("Stop Background Scheduler")
        stop_sched_btn.clicked.connect(self.trigger_stop_scheduler)

        btn_layout.addWidget(refresh_btn)
        btn_layout.addWidget(start_sched_btn)
        btn_layout.addWidget(stop_sched_btn)
        layout.addLayout(btn_layout)

        # Output console for status tab
        self.status_console = QTextEdit()
        self.status_console.setReadOnly(True)
        self.status_console.setPlaceholderText("Subprocess tasks logs will output here...")
        layout.addWidget(self.status_console)

        self.tabs.addTab(tab, "Overview & Status")

    def init_ask_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        layout.addWidget(QLabel("<b>Ask Sorelax Q&A</b>"))
        layout.addWidget(QLabel("Query your connected sources (GitHub, Slack, Notion, Linear) via on-demand Coral SQL:"))

        row = QHBoxLayout()
        self.ask_input = QLineEdit()
        self.ask_input.setPlaceholderText("e.g. what changes were made in auth?")
        self.ask_input.returnPressed.connect(self.trigger_ask)
        
        self.ask_btn = QPushButton("Ask Sorelax")
        self.ask_btn.clicked.connect(self.trigger_ask)

        row.addWidget(self.ask_input)
        row.addWidget(self.ask_btn)
        layout.addLayout(row)

        self.ask_console = QTextEdit()
        self.ask_console.setReadOnly(True)
        layout.addWidget(self.ask_console)

        self.tabs.addTab(tab, "Interactive Ask (Q&A)")

    def init_logs_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        row = QHBoxLayout()
        row.addWidget(QLabel("<b>Database Action Logs</b>"))
        row.addStretch()
        
        refresh_logs_btn = QPushButton("Reload Logs")
        refresh_logs_btn.setObjectName("copyBtn")
        refresh_logs_btn.clicked.connect(self.load_logs)
        row.addWidget(refresh_logs_btn)
        layout.addLayout(row)

        self.logs_terminal = QTextEdit()
        self.logs_terminal.setReadOnly(True)
        layout.addWidget(self.logs_terminal)

        self.tabs.addTab(tab, "Action Logs")
        self.load_logs()

    def update_status_metrics(self):
        try:
            status = backend.get_status()
            self.lbl_last_ref.setText(f"<b>Last Context Refresh:</b> {status.get('last_refresh', 'never')}")
            self.lbl_sched_status.setText(f"<b>Scheduler Process:</b> {status.get('scheduler', 'stopped')}")
            self.lbl_context_path.setText(f"<b>Context Path:</b> {status.get('context_path', 'unknown')}")

            # Parse and render sources health nicely
            sources = status.get("sources", {})
            src_text = []
            for src_name, healthy in sources.items():
                indicator = "<font color='#9ece6a'>✓ Active</font>" if healthy else "<font color='#f7768e'>✗ Inactive</font>"
                src_text.append(f"<b>{src_name}</b>: {indicator}")
            
            self.sources_health_lbl.setText("  ·  ".join(src_text))
        except Exception as exc:
            self.sources_health_lbl.setText(f"Error fetching status: {exc}")

    def load_logs(self):
        self.logs_terminal.clear()
        try:
            # Safely fetch log entries
            from agent.refresh import load_logs
            logs = load_logs(25)
            if not logs:
                self.logs_terminal.append("<font color='#565f89'>No logs found in Sorelax log database.</font>")
                return
            for entry in logs:
                ts = entry.get("timestamp", "unknown")
                status = entry.get("status", "ok")
                rows = entry.get("row_count", 0)
                status_color = "#9ece6a" if status == "ok" else "#f7768e"
                
                self.logs_terminal.append(
                    f"<font color='#565f89'>[{ts}]</font> "
                    f"Refresh status: <font color='{status_color}'><b>{status.upper()}</b></font> · "
                    f"Parsed Rows: <b>{rows}</b>"
                )
        except Exception as exc:
            self.logs_terminal.append(f"<font color='#f7768e'>Failed to load logs: {exc}</font>")

    def trigger_refresh(self):
        if self.refresh_thread and self.refresh_thread.isRunning():
            return
        
        self.status_console.clear()
        self.status_console.append("<font color='#7aa2f7'><b>Starting context refresh process in background...</b></font>\n")
        
        self.refresh_thread = RefreshThread()
        self.refresh_thread.line_received.connect(self.append_status_line)
        self.refresh_thread.finished_code.connect(self.on_refresh_finished)
        self.refresh_thread.start()

    def append_status_line(self, line: str):
        if line.startswith(">>>"):
            self.status_console.append(f"<font color='#7aa2f7'><b>{line}</b></font>")
        elif "error" in line.lower() or "failed" in line.lower():
            self.status_console.append(f"<font color='#f7768e'>{line}</font>")
        else:
            self.status_console.append(f"<font color='#c0caf5'>{line}</font>")
            
        self.status_console.moveCursor(QTextCursor.MoveOperation.End)

    def on_refresh_finished(self, code: int):
        if code == 0:
            self.status_console.append("\n<font color='#9ece6a'><b>✓ Context refresh finished successfully!</b></font>")
        else:
            self.status_console.append(f"\n<font color='#f7768e'><b>✗ Context refresh finished with code {code}</b></font>")
        self.update_status_metrics()
        self.load_logs()

    def trigger_start_scheduler(self) -> None:
        self.status_console.clear()
        self.status_console.append(
            "<font color='#7aa2f7'><b>Starting Sorelax scheduler daemon…</b></font>\n"
        )
        # Stop first (off-thread), then start — chained via signals
        self._sched_prestop = SchedulerStopThread()
        self._sched_prestop.finished_code.connect(self._on_prestop_done)
        self._sched_prestop.start()

    def _on_prestop_done(self, _code: int) -> None:
        """Callback after pre-stop; now launch the scheduler."""
        self._sched_start = SchedulerStartThread()
        self._sched_start.line_received.connect(self.append_status_line)
        self._sched_start.finished_code.connect(self._on_sched_start_done)
        self._sched_start.start()

    def _on_sched_start_done(self, code: int) -> None:
        if code == 0:
            self.status_console.append(
                "<font color='#9ece6a'><b>✓ Scheduler started.</b></font>"
            )
        else:
            self.status_console.append(
                f"<font color='#f7768e'><b>✗ Scheduler start returned code {code}</b></font>"
            )
        self.update_status_metrics()

    def trigger_stop_scheduler(self) -> None:
        self.status_console.clear()
        self.status_console.append(
            "<font color='#7aa2f7'><b>Stopping Sorelax scheduler daemon…</b></font>\n"
        )
        self._sched_stop = SchedulerStopThread()
        self._sched_stop.finished_code.connect(self._on_sched_stop_done)
        self._sched_stop.start()

    def _on_sched_stop_done(self, code: int) -> None:
        if code == 0:
            self.status_console.append(
                "<font color='#9ece6a'><b>✓ Scheduler stopped.</b></font>"
            )
        else:
            self.status_console.append(
                "<font color='#f7768e'><b>✗ Stop returned non-zero. Check PID file.</b></font>"
            )
        self.update_status_metrics()

    def trigger_ask(self):
        query = self.ask_input.text().strip()
        if not query:
            return
        
        if self.ask_thread and self.ask_thread.isRunning():
            return
            
        self.ask_console.clear()
        self.ask_console.append(f"<font color='#7aa2f7'><b>Searching local knowledge & Q&A for: '{query}'...</b></font>\n")
        
        self.ask_thread = AskThread(query)
        self.ask_thread.line_received.connect(self.append_ask_line)
        self.ask_thread.finished_code.connect(self.on_ask_finished)
        self.ask_thread.start()

    def append_ask_line(self, line: str):
        self.ask_console.append(f"<font color='#c0caf5'>{line}</font>")
        self.ask_console.moveCursor(QTextCursor.MoveOperation.End)

    def on_ask_finished(self, code: int):
        if code != 0:
            self.ask_console.append(f"\n<font color='#f7768e'><b>✗ Ask query completed with code {code}</b></font>")
        self.ask_console.moveCursor(QTextCursor.MoveOperation.End)


def main() -> None:
    """Standalone entry point — delegates to gui.main.launch for consistency."""
    from gui.main import launch
    launch()


if __name__ == "__main__":
    main()
