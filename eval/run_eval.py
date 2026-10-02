from __future__ import annotations

import json
from pathlib import Path
from app.db import connect
from config import DB_PATH, DATA_DIR


def main():
    truth={(r['entity'],r['signal_type']) for r in json.loads((DATA_DIR/'ground_truth.json').read_text())}
    with connect(DB_PATH) as conn:
        found=set()
        for r in conn.execute("SELECT signal_type,entity_type,entity_id FROM action_items"):
            table='customers' if r['entity_type']=='customer' else 'suppliers'
            entity=conn.execute(f"SELECT name FROM {table} WHERE id=?",(r['entity_id'],)).fetchone()[0]
            found.add((entity,r['signal_type']))
    comparable=truth
    matched=comparable & found
    precision=len(matched)/len(found) if found else 0
    recall=len(matched)/len(comparable) if comparable else 0
    result={'precision':round(precision,3),'recall':round(recall,3),'expected':sorted(comparable),'found':sorted(found),'misses':sorted(comparable-found),'false_positives':sorted(found-comparable)}
    (Path(__file__).parent/'results.json').write_text(json.dumps(result,indent=2))
    print(f"{'Metric':<18}Value\n{'Recall':<18}{recall:.1%}\n{'Precision':<18}{precision:.1%}\n\nMisses: {result['misses']}\nFalse positives: {result['false_positives']}")
    return result

if __name__=='__main__': main()
