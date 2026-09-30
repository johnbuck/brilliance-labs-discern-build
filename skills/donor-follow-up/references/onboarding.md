# Guided onboarding and the voice profile

Start from the user's request. If they want the demo, run it without an interview. Otherwise look for `donor-follow-up-profile.json` in their chosen folder and reuse it. If there is none, begin: "Whose voice should these letters be in, and would you like to start by building a voice profile from their past letters?"

Ask one focused question at a time, say in a sentence why you are asking, and keep working on anything that doesn't depend on the answer. Never show this list as a questionnaire. About 30 minutes.

1. The signer: name and role as the user gives them, and who else may review drafts.
2. Writing samples: "Could you share 5 to 10 letters or emails the leader wrote themselves to supporters?" More helps, especially recent ones. Ask them to remove donor names and amounts first, or replace names with "[Name]". Explain why: the profile must describe style, never people.
3. One voice or two: many leaders write short everyday emails and warmer, longer supporter letters. If the samples show both, build two voices (for example `email` and `letter`) instead of blending them.
4. Study the samples and draft the profile. Weight recent writing more than older writing. Describe, don't copy:
   - length and rhythm: sentence length, paragraph length, typical letter length by type;
   - greetings and sign-offs, and when each is used;
   - openings: how the leader starts (gratitude first, a story, straight to news);
   - warmth and humor, and how personal they get;
   - faith language: how often, what kind, whether they cite Scripture and how;
   - specifics: do they name numbers, places, people served (with permission);
   - a few short signature phrases the leader approves;
   - phrases to avoid, including stiff AI habits ("I hope this finds you well", padding, heavy formatting, faith words used as decoration);
   - a sniff test: "Would a longtime supporter hear this leader, or a fundraising office?"
5. Test it: draft one short fictional thank-you with the profile, ask what sounds wrong, and revise the profile. Repeat once if needed.
6. Giving system: which one they use and whether it can export a CSV with chosen columns (see [connections](connections.md)).
7. Segments: what counts as a major donor for them (an amount band they choose), how long without a gift counts as lapsed (for example 12 months; a gift after that gap makes someone a "returning" giver), and whether first gifts to a new fund get special thanks.
8. Rhythm: how soon thank-yous go out (for example a weekly or monthly batch) and when quarterly updates go out.
9. Calls: who makes personal thank-you calls to major donors.
10. The data-sensitivity answer from SKILL.md, and the workspace (a folder Claude can work in through Claude Desktop's Cowork or Claude Code, a claude.ai Project if the plan includes it, or plain chat with uploads). Offer to start a `HANDOFF.md` there with the batch rhythm, decisions and next steps, and no donor names.

Save `donor-follow-up-profile.json` with these non-secret fields. Leave unknowns empty.

- `schema_version`: 1
- `signer`: name, role; `reviewers`
- `voices`: one entry per voice with summary, sentence_style, greetings, sign_offs, openings, warmth, faith_language, signature_phrases, avoid, sniff_test, samples_used (count and date range only)
- `segments`: major_band, lapsed_months, first_time_rules
- `cadence`: thank_you, quarterly_update
- `calls_by`, `giving_system`, `export_columns`, `data_sensitivity`, `workspace`, `output_folder`
- `open_questions`

Never store donor names, amounts, giving history, contact details or the sample letters themselves in the profile. Tell the user where it was saved. If their setup supports custom skills, offer to turn the voice profile into its own small skill so newsletters and emails can reuse it too. Suggest refreshing it once a year with newer letters.
