# Demo questions for the Cedar Hill sermon library

Fictional sample data. The five sermon files in `demo-sermons/` are short, made-up excerpts for practice.

Ask these one at a time. For each, the answer should come only from the sermon files and cite title, date, speaker and paragraph numbers.

| Question | What a good answer draws on | What it teaches |
|---|---|---|
| What have we taught about grief and losing someone? | Mercies in the Morning (2026-01-11) | A plain keyword search works when the question uses the sermon's own words. |
| What have we said about burnout? | Rest for the Weary (2026-03-15) | The sermon never says "burnout"; it says "running on empty", "stretched thin" and "exhausted". Keyword search finds nothing; meaning search finds it. |
| Who is my neighbor, according to our preaching? | Who Is My Neighbor? (2026-02-08) | Answers should cite the exact paragraphs, not summarize from memory. |
| Which sermons mention Romans 12? | Welcome the Stranger (2026-04-19) | Passages tied to verse references can be searched by passage. |
| How should we treat guests at the food pantry? | Do Justly, Love Mercy (2026-05-17) and Who Is My Neighbor? (2026-02-08) | Good answers combine two sources and cite both. |
| What have we preached on the book of Revelation? | Nothing | The right answer is "the library doesn't cover this", not a guess. |

## Try it without installing anything (Project tier)

Upload the five files to a chat or a Claude Project and say: "Answer only from these sermon files. For every point, cite the sermon title, date, speaker and paragraph. If the files don't cover the question, say so." Then ask the questions above.

## Try the keyword and chunking demo (local tier preview)

See the sample commands in `references/local-index.md`. The file `demo-meaning-ranks.json` is a hand-written stand-in for what a local meaning search might return for the burnout question, so you can see rank fusion work without installing a model.
