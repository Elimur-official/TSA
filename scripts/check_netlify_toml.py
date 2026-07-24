#!/usr/bin/env python3
"""Проверяет, что netlify.toml — валидный TOML. Запускать из site/."""
import tomllib
from pathlib import Path


def main() -> None:
    path = Path("netlify.toml")
    with path.open("rb") as f:
        config = tomllib.load(f)
    assert config["build"]["command"] == "npm run build"
    assert config["build"]["publish"] == "_site"
    print("netlify.toml валиден:", config)


if __name__ == "__main__":
    main()
