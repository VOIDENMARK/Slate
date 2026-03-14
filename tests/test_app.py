from pathlib import Path

from slate.app import Slate
from slate.cli import format_surface, render_results
from slate.roadmap import DELIVERY_PHASES, build_execution_plan


def test_add_and_persist_surface(tmp_path: Path) -> None:
    store = tmp_path / "surfaces.json"
    slate = Slate(store)

    created = slate.add_surface("Ideas", "Build Slate", tags=["todo", "product"])

    assert created.title == "Ideas"
    assert store.exists()

    reloaded = Slate(store)
    assert len(reloaded.surfaces) == 1
    assert reloaded.surfaces[0].tags == ["todo", "product"]


def test_search_by_content_and_tags(tmp_path: Path) -> None:
    slate = Slate(tmp_path / "surfaces.json")
    slate.add_surface("Roadmap", "Polish onboarding", tags=["product"])
    slate.add_surface("Bugfix", "Repair login form", tags=["engineering"])

    product_matches = slate.search("product")
    login_matches = slate.search("login")

    assert len(product_matches) == 1
    assert product_matches[0].title == "Roadmap"
    assert len(login_matches) == 1
    assert login_matches[0].title == "Bugfix"


def test_format_surface_has_readable_alignment() -> None:
    output = format_surface(2, "Ideas", "Build Slate", ["todo", "product"])

    assert output == " 2. Ideas\n    Build Slate\n    [todo, product]"


def test_render_results_handles_empty_state(capsys) -> None:
    exit_code = render_results("Search", [])

    captured = capsys.readouterr()
    assert exit_code == 0
    assert "No surfaces found." in captured.out


def test_initialize_database_creates_tables(tmp_path: Path) -> None:
    from slate.db import initialize_database

    db_path = tmp_path / "slate.db"
    schema_path = Path(__file__).resolve().parents[1] / "db" / "schema.sql"

    initialize_database(db_path, schema_path)

    import sqlite3

    with sqlite3.connect(db_path) as connection:
        table_names = {
            row[0]
            for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        }

    assert {"users", "workspaces", "browser_tabs", "notes", "chat_conversations", "emails"}.issubset(table_names)


def test_build_execution_plan_has_eight_pending_phases() -> None:
    assert len(DELIVERY_PHASES) == 8

    plan = build_execution_plan()
    assert len(plan) == 8
    assert all(item.status == "pending" for item in plan)
    assert all(item.completed_deliverables == [] for item in plan)
