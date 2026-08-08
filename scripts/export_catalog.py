#!/usr/bin/env python3
"""Экспорт каталога elimurbot (bot.db) в site/src/_data/products.json
и скачивание фото товаров в site/src/images/products/.

Запуск: python3 export_catalog.py --db-path /path/to/bot.db --bot-token XXX
"""
import argparse
import json
import sqlite3
import urllib.request
from pathlib import Path
from typing import Callable

TelegramDownloader = Callable[[str, str, Path], None]


def fetch_products(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT id, name, description, photo_file_id, price, category "
        "FROM products ORDER BY id"
    ).fetchall()
    return [dict(row) for row in rows]


def download_telegram_photo(bot_token: str, file_id: str, dest_path: Path) -> None:
    meta_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}"
    with urllib.request.urlopen(meta_url) as response:
        meta = json.load(response)
    file_path = meta["result"]["file_path"]
    file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
    with urllib.request.urlopen(file_url) as response, open(dest_path, "wb") as out:
        out.write(response.read())


def export_catalog(
    conn: sqlite3.Connection,
    bot_token: str,
    images_dir: Path,
    data_file: Path,
    downloader: TelegramDownloader = download_telegram_photo,
) -> list[dict]:
    images_dir.mkdir(parents=True, exist_ok=True)
    data_file.parent.mkdir(parents=True, exist_ok=True)

    catalog = []
    for product in fetch_products(conn):
        image_name = f"{product['id']}.jpg"
        dest_path = images_dir / image_name
        downloader(bot_token, product["photo_file_id"], dest_path)
        catalog.append(
            {
                "id": product["id"],
                "name": product["name"],
                "description": product["description"],
                "price": product["price"],
                "category": product["category"],
                "oldPrice": round(product["price"] / 0.85 / 10) * 10,
                "inStock": True,
                "image": f"/images/products/{image_name}",
            }
        )

    data_file.write_text(json.dumps(catalog, ensure_ascii=False, indent=2))
    return catalog


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db-path", required=True)
    parser.add_argument("--bot-token", required=True)
    parser.add_argument("--images-dir", default="../src/images/products")
    parser.add_argument("--data-file", default="../src/_data/products.json")
    args = parser.parse_args()

    conn = sqlite3.connect(args.db_path)
    conn.row_factory = sqlite3.Row
    catalog = export_catalog(
        conn, args.bot_token, Path(args.images_dir), Path(args.data_file)
    )
    print(f"Экспортировано товаров: {len(catalog)}")


if __name__ == "__main__":
    main()
