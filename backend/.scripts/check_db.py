"""One-off script to verify DATABASE_URL connectivity and print server version."""
from __future__ import annotations

import sys

from sqlalchemy import create_engine, text

from app.config import get_settings


def main() -> int:
    settings = get_settings()
    url = settings.database_url
    # Hide password for log output
    safe = url
    if "@" in url and "://" in url:
        prefix, rest = url.split("://", 1)
        if "@" in rest:
            creds, host = rest.split("@", 1)
            if ":" in creds:
                user, _ = creds.split(":", 1)
                safe = f"{prefix}://{user}:***@{host}"
    print(f"DATABASE_URL = {safe}")

    try:
        engine = create_engine(url, pool_pre_ping=True)
        with engine.connect() as conn:
            version = conn.execute(text("select version()")).scalar_one()
            db = conn.execute(text("select current_database()")).scalar_one()
            user = conn.execute(text("select current_user")).scalar_one()
        print("OK")
        print(f"  database : {db}")
        print(f"  user     : {user}")
        print(f"  version  : {version}")
        return 0
    except Exception as exc:  # noqa: BLE001
        print("FAIL")
        print(f"  {type(exc).__name__}: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
