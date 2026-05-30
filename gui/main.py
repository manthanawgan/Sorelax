"""gui/main.py — Sorelax GUI entry point.

Checks whether a valid `.env` is present:
  - If yes  → opens SorelaxDashboard directly.
  - If no   → opens SorelaxWizard; on wizard completion the dashboard is shown
              in-process (no subprocess restart required).

The dark Tokyo Night QApplication palette and global stylesheet are applied
here so both windows share exactly the same look.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PyQt6.QtGui import QColor, QPalette
from PyQt6.QtWidgets import QApplication

# ---------------------------------------------------------------------------
# Tokyo Night global palette (applied before any window is constructed)
# ---------------------------------------------------------------------------
_TN_PALETTE_ROLES: list[tuple] = [
    ("Window",          "#1a1b26"),
    ("WindowText",      "#a9b1d6"),
    ("Base",            "#16161e"),
    ("AlternateBase",   "#1f2335"),
    ("ToolTipBase",     "#16161e"),
    ("ToolTipText",     "#a9b1d6"),
    ("Text",            "#c0caf5"),
    ("Button",          "#1f2335"),
    ("ButtonText",      "#c0caf5"),
    ("BrightText",      "#f7768e"),
    ("Highlight",       "#7aa2f7"),
    ("HighlightedText", "#1a1b26"),
]

# Shared base stylesheet — enough for unstyled widgets that miss the per-module
# TOKYO_NIGHT_STYLE sheets (e.g. QToolTip, QMenu).
_GLOBAL_STYLE = """
QToolTip {
    background-color: #1f2335;
    color: #c0caf5;
    border: 1px solid #3b4261;
    border-radius: 4px;
    padding: 4px 8px;
}
QMenu {
    background-color: #1f2335;
    color: #c0caf5;
    border: 1px solid #3b4261;
}
QMenu::item:selected {
    background-color: #364a82;
}
"""


def _build_app() -> QApplication:
    """Create and configure the QApplication with the dark palette."""
    app = QApplication.instance() or QApplication(sys.argv)
    app.setStyle("Fusion")
    app.setApplicationName("Sorelax")
    app.setApplicationDisplayName("Sorelax Developer Workspace")

    palette = QPalette()
    role_map = {name: QColor(hex_) for name, hex_ in _TN_PALETTE_ROLES}
    for role_name, color in role_map.items():
        role = getattr(QPalette.ColorRole, role_name)
        palette.setColor(role, color)
    app.setPalette(palette)
    app.setStyleSheet(_GLOBAL_STYLE)
    return app


def _env_configured() -> bool:
    """Return True if a non-trivially-empty .env file is found."""
    try:
        import gui.backend as _backend  # noqa: F401 — just trigger path bootstrap
    except ImportError:
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        import gui.backend as _backend  # noqa: F401

    from gui.backend import _repo_root
    candidates = [
        _repo_root() / ".env",
        Path.home() / ".sorelax" / ".env",
    ]
    for path in candidates:
        if path.exists() and path.stat().st_size > 20:
            return True
    return False


def _open_dashboard() -> None:
    """Show the main SorelaxDashboard window (import deferred for startup speed)."""
    from gui.dashboard import SorelaxDashboard
    win = SorelaxDashboard()
    win.show()
    # Keep a module-level reference so the window is not garbage-collected
    _open_dashboard._instance = win  # type: ignore[attr-defined]


def _open_wizard() -> None:
    """Show the SorelaxWizard; on accept() it hands off to the dashboard."""
    from gui.wizard import SorelaxWizard

    wizard = SorelaxWizard()

    # Override accept() so the wizard opens the full dashboard instead of
    # wizard.py's internal lightweight MainWindow.
    def _on_accept() -> None:
        # Let QWizard close itself first
        from PyQt6.QtWidgets import QDialog
        QDialog.accept(wizard)          # bypasses SorelaxWizard.accept()
        _open_dashboard()

    wizard.accepted.connect(_on_accept)

    # Disconnect the original accept override that opens the wrong window
    try:
        wizard.accepted.disconnect()
    except TypeError:
        pass
    wizard.accepted.connect(_on_accept)

    wizard.show()
    _open_wizard._instance = wizard  # type: ignore[attr-defined]


def launch() -> None:
    """Entry point called by the ``sorelax-gui`` console script."""
    app = _build_app()

    if _env_configured():
        _open_dashboard()
    else:
        _open_wizard()

    sys.exit(app.exec())


if __name__ == "__main__":
    launch()
