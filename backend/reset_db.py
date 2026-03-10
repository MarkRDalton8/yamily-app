#!/usr/bin/env python3
"""
Yamily Database Reset Script

Deletes ALL data from ALL tables while preserving the schema.
Works both locally (SQLite) and production (PostgreSQL).

Usage:
  Local:      python reset_db.py
  Production: ssh to EC2, then: python reset_db.py
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Get database URL (same as app/database.py)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./yamily.db")

def reset_database():
    """
    Deletes all data from all tables in the correct order.
    """
    # Show current environment
    env = "PRODUCTION" if "postgres" in DATABASE_URL.lower() else "LOCAL"
    db_type = "PostgreSQL" if "postgres" in DATABASE_URL.lower() else "SQLite"

    print(f"\n{'='*60}")
    print(f"  Yamily Database Reset")
    print(f"{'='*60}")
    print(f"Environment: {env}")
    print(f"Database:    {db_type}")
    print(f"{'='*60}\n")

    # Extra confirmation for production
    if env == "PRODUCTION":
        print("⚠️  WARNING: You are about to delete ALL data from PRODUCTION!\n")
        confirm = input("Type 'RESET PRODUCTION' to confirm (or anything else to cancel): ")
        if confirm != "RESET PRODUCTION":
            print("\n✅ Cancelled. No changes made.")
            sys.exit(0)
    else:
        print("⚠️  This will delete ALL data from your local database!\n")
        confirm = input("Type 'yes' to confirm (or anything else to cancel): ")
        if confirm.lower() != "yes":
            print("\n✅ Cancelled. No changes made.")
            sys.exit(0)

    print("\n🔄 Connecting to database...")

    try:
        # Create engine and session
        connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
        engine = create_engine(DATABASE_URL, connect_args=connect_args)
        Session = sessionmaker(bind=engine)
        session = Session()

        print("🗑️  Deleting data in correct order...\n")

        # Delete in correct order to avoid foreign key constraints
        tables_to_clear = [
            ("comment_votes", "Comment votes"),
            ("review_votes", "Review votes"),
            ("event_comments", "Event comments"),
            ("reviews", "Reviews"),
            ("event_guests", "Event guests"),
            ("expected_guests", "Expected guests"),
            ("events", "Events"),
            ("users", "Users")
        ]

        for table_name, description in tables_to_clear:
            try:
                result = session.execute(text(f"DELETE FROM {table_name}"))
                count = result.rowcount
                print(f"   ✓ Deleted {count:3d} rows from {description}")
            except Exception as e:
                print(f"   ⚠ Skipped {description}: {str(e)}")

        # Commit all deletions
        session.commit()
        print(f"\n{'='*60}")
        print("✅ Database reset successful!")
        print(f"{'='*60}\n")
        print("All data has been deleted. The database is now empty.")
        print("You can register new accounts and create new events.\n")

    except Exception as e:
        print(f"\n❌ Reset failed: {str(e)}\n")
        session.rollback()
        sys.exit(1)

    finally:
        session.close()

if __name__ == "__main__":
    reset_database()
