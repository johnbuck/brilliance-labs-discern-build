# Connections

Discover what is available at runtime. Never claim a tool, connector or model is installed; test it and say what you found.

| Need | Options | Verify | Fallback |
|---|---|---|---|
| Small library | A claude.ai Project, if the plan includes Projects | Ask a question with a known answer; the right file is cited | Upload a few files to a single chat |
| Files in the cloud | Google Drive connector, if connected | List one folder and open one file | User downloads and uploads the files |
| Work on the computer | Claude Code (runs programs); Cowork in Claude Desktop for file tidying | Create and read back a test file in the chosen folder | User runs commands Claude writes |
| Local model runner | Ollama or another local runner the user installs | Runner answers locally; a test embedding returns numbers | Keyword-only search until it is installed |
| Reranker | A local reranking model | Reorders a known test query sensibly | Skip it; hybrid search alone works |
| Study software text | The app's own export, copy or documented automation, within its license | One small, known section captured exactly | Leave that resource out |
| Audio to text | A local speech-to-text tool the user installs | One short recording transcribed and spot-checked | An online transcription service, only with the user's OK and names removed after |
| Claude searching the index | A small local connector (MCP server) | The tool appears in Claude and answers a known question | Claude runs the search command and reads the results |
| Routine updates | A scheduled task, if the plan includes it | One test run adds a new sermon | A weekly reminder |

The user installs apps and grants any computer permissions themselves, after you explain what each permission allows. Never ask for passwords or API keys in chat. Before editing a Claude configuration file, make a backup copy.

## Recovery
- Model runner not responding: ask the user to open it, then retry one test passage before the full run.
- Changed the embedding model: every passage must be re-embedded; vectors from different models don't mix.
- Connector doesn't appear: check the configuration file against the backup, restart Claude, and read the connector's log.
- Capture stopped partway: resume from the log; don't restart from zero. Keep the computer awake.
- Results feel wrong: run the gap audit, test known questions, check passage size, and look at the saved feedback.
- Library ended up in a synced folder: stop, move it to a non-synced folder, and update the profile.
- Unsure whether a resource may be indexed: leave it out and note it as an open question until the terms are confirmed.
