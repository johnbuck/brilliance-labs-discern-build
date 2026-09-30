"""Offline tests; run from the skill folder: python -m unittest discover -s tests -v."""
import json
from contextlib import closing
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SKILL = Path(__file__).resolve().parents[1]
SCRIPT = SKILL / 'scripts' / 'bsb_retrieve.py'
SOURCE = SKILL / 'assets' / 'bsb_smart.json'


class RetrievalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='bsb-tests-', dir=os.environ.get('TMPDIR'))
        cls.db = Path(cls.temp.name) / 'index.sqlite'
        cls.data = json.loads(SOURCE.read_text(encoding='utf-8'))
        cls.verses = {v['reference']: v['text'] for b in cls.data['books']
                      for c in b['chapters'] for v in c['verses']}

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def run_cli(self, *args):
        return subprocess.run([sys.executable, str(SCRIPT), '--db', str(self.db), *args],
                              cwd=self.temp.name, capture_output=True, encoding='utf-8')

    def test_portable_lookup_from_another_working_directory(self):
        result = self.run_cli('--ref', 'John 3:16', '--format', 'json')
        self.assertEqual(result.returncode, 0, result.stderr)
        rows = json.loads(result.stdout)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['reference'], 'John 3:16')
        self.assertEqual(rows[0]['text'], self.verses['John 3:16'])
        self.assertTrue(self.db.exists())

    def test_invalid_or_partial_reference_fails_without_partial_output(self):
        for ref in ('John 3:16-999', 'John 3-999', 'John 3:18-16',
                    'John 4:2-3:16', 'John 0', 'John 3:0', 'John 99',
                    'John 3:999', 'Unknown 1:1'):
            with self.subTest(ref=ref):
                result = self.run_cli('--ref', 'Genesis 1:1', '--ref', ref, '--format', 'json')
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stdout, '')
                self.assertIn('ERROR:', result.stderr)

    def test_apostrophe_keyword_search(self):
        for query in ("God's", "God's ("):
            with self.subTest(query=query):
                result = self.run_cli('--search', query, '--limit', '2', '--format', 'json')
                self.assertEqual(result.returncode, 0, result.stderr)
                rows = json.loads(result.stdout)
                self.assertGreater(len(rows), 0)
                self.assertLessEqual(len(rows), 2)
                for row in rows:
                    self.assertEqual(row['text'], self.verses[row['reference']])

    def test_whole_bible_index_matches_every_source_verse(self):
        import sqlite3
        result = self.run_cli('--stats')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('Books: 66', result.stdout)
        self.assertIn('Addressable verses: 31102', result.stdout)
        with closing(sqlite3.connect(self.db)) as con:
            actual = dict(con.execute('SELECT reference, text FROM verses').fetchall())
        self.assertEqual(actual, self.verses)

    def test_batch_ranges_aliases_and_single_chapter_book(self):
        result = self.run_cli('--refs', 'Psalm 23; John 3:35-4:2; Jude', '--format', 'json')
        self.assertEqual(result.returncode, 0, result.stderr)
        rows = json.loads(result.stdout)
        expected = [v['reference'] for b in self.data['books'] if b['id'] == 'PSA'
                    for c in b['chapters'] if c['number'] == 23 for v in c['verses']]
        expected += ['John 3:35', 'John 3:36', 'John 4:1', 'John 4:2']
        expected += [v['reference'] for b in self.data['books'] if b['id'] == 'JUD'
                     for c in b['chapters'] for v in c['verses']]
        self.assertEqual([r['reference'] for r in rows], expected)
        for row in rows:
            self.assertEqual(row['text'], self.verses[row['reference']])

    def test_chapter_range_and_numbered_book(self):
        result = self.run_cli('--ref', '1 John 1-2', '--format', 'json')
        self.assertEqual(result.returncode, 0, result.stderr)
        rows = json.loads(result.stdout)
        expected = [v['reference'] for b in self.data['books'] if b['id'] == '1JN'
                    for c in b['chapters'] if c['number'] in (1, 2) for v in c['verses']]
        self.assertEqual([r['reference'] for r in rows], expected)

    def test_search_limits_notes_headings_and_empty_rows(self):
        result = self.run_cli('--search', 'faith hope love', '--limit', '3', '--format', 'json')
        self.assertEqual(result.returncode, 0, result.stderr)
        rows = json.loads(result.stdout)
        self.assertGreater(len(rows), 0)
        self.assertLessEqual(len(rows), 3)
        for row in rows:
            self.assertEqual(row['text'], self.verses[row['reference']])
        result = self.run_cli('--ref', 'John 3:16', '--format', 'json')
        row = json.loads(result.stdout)[0]
        self.assertIsInstance(row['notes'], list)
        self.assertIsInstance(row['headings'], str)
        # Source-addressable empty verses must remain empty, not be filled from memory.
        empty = next(ref for ref, text in self.verses.items() if not text)
        result = self.run_cli('--ref', empty, '--format', 'json')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)[0]['text'], '')

    def test_notes_are_returned_separately_and_can_be_suppressed(self):
        import sqlite3
        self.assertEqual(self.run_cli('--stats').returncode, 0)
        with closing(sqlite3.connect(self.db)) as con:
            ref, notes = con.execute("SELECT reference, notes FROM verses WHERE notes <> '' LIMIT 1").fetchone()
        result = self.run_cli('--ref', ref, '--format', 'json')
        row = json.loads(result.stdout)[0]
        self.assertEqual(row['notes'], notes.split('\n'))
        self.assertEqual(row['text'], self.verses[ref])
        compact = self.run_cli('--ref', ref, '--format', 'compact', '--no-notes')
        self.assertEqual(compact.returncode, 0, compact.stderr)
        self.assertEqual(compact.stdout.strip(), f'{ref} {self.verses[ref]}'.strip())

    def test_rebuild_preserves_source_and_lookup(self):
        import hashlib
        before = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
        result = self.run_cli('--rebuild', '--ref', 'Genesis 1:1', '--format', 'json')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)[0]['text'], self.verses['Genesis 1:1'])
        self.assertEqual(hashlib.sha256(SOURCE.read_bytes()).hexdigest(), before)


if __name__ == '__main__':
    unittest.main()
