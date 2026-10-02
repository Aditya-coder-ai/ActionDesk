from pathlib import Path
from app.db import init_db
from app.ingest import ingest
from app.extract import extract_all
from app.signals import detect
from data.generate import main as generate


def test_six_planted_signals(tmp_path):
    data = tmp_path / "data"
    data.mkdir()
    import shutil
    from config import DATA_DIR

    for f in DATA_DIR.iterdir():
        if f.is_file():
            shutil.copy(f, data / f.name)

    db = tmp_path / "test.sqlite3"
    generate()
    init_db(db)
    ingest(data, db)
    extract_all(db)
    assert detect(db) >= 5

