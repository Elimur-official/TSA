import json
import sqlite3
from pathlib import Path

from export_catalog import export_catalog


def _seed_db() -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            photo_file_id TEXT NOT NULL,
            price INTEGER NOT NULL DEFAULT 0,
            category TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    conn.execute(
        "INSERT INTO products (name, description, photo_file_id, price, category) "
        "VALUES (?, ?, ?, ?, ?)",
        ("Вибратор «Полночь»", "Тихий мотор", "file_abc", 3890, "Вибраторы"),
    )
    conn.commit()
    return conn


def test_export_writes_json_and_downloads_photo(tmp_path: Path):
    conn = _seed_db()
    calls = []

    def fake_downloader(bot_token, file_id, dest_path):
        calls.append((bot_token, file_id, dest_path))
        dest_path.write_bytes(b"fake-jpeg-bytes")

    images_dir = tmp_path / "images"
    data_file = tmp_path / "data" / "products.json"

    catalog = export_catalog(
        conn, "TEST_TOKEN", images_dir, data_file, downloader=fake_downloader
    )

    assert len(catalog) == 1
    assert catalog[0]["name"] == "Вибратор «Полночь»"
    assert catalog[0]["price"] == 3890
    assert catalog[0]["category"] == "Вибраторы"
    assert catalog[0]["image"] == "/images/products/1.jpg"

    assert calls == [("TEST_TOKEN", "file_abc", images_dir / "1.jpg")]
    assert (images_dir / "1.jpg").read_bytes() == b"fake-jpeg-bytes"

    saved = json.loads(data_file.read_text())
    assert saved == catalog


def test_export_is_safe_to_rerun(tmp_path: Path):
    conn = _seed_db()

    def fake_downloader(bot_token, file_id, dest_path):
        dest_path.write_bytes(b"x")

    images_dir = tmp_path / "images"
    data_file = tmp_path / "data" / "products.json"

    export_catalog(conn, "T", images_dir, data_file, downloader=fake_downloader)
    catalog = export_catalog(conn, "T", images_dir, data_file, downloader=fake_downloader)

    assert len(catalog) == 1


def test_export_with_no_products_writes_empty_list(tmp_path: Path):
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            photo_file_id TEXT NOT NULL,
            price INTEGER NOT NULL DEFAULT 0,
            category TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    catalog = export_catalog(
        conn, "T", tmp_path / "images", tmp_path / "products.json",
        downloader=lambda *a: None,
    )
    assert catalog == []
