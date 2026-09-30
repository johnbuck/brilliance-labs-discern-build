# BSB data provenance and redistribution

## What is included

`assets/bsb_smart.json` is a contributor-maintained **Enhanced Smart Bible JSON 1.1.0** dataset containing the Berean Standard Bible's 66-book hierarchy, 31,102 addressable verse rows, stable identifiers, and embedded USJ 3.1 content (including notes, headings, and paragraph/character structures). It is not an official publisher-issued JSON distribution and is not an automatically updated edition.

The dataset records these source fingerprints:

- Original `bsb.txt` SHA-256: `4ff20e60a9e12e2150b49caaa5e757936751c142a3ca0926ac82e11152f7676f`
- Recorded combined USJ source SHA-256: `069ac5576b82c6672add722edffec9a3de2d7f7f602a147eae4b2d976a2f98be`
- Individual USJ filenames and hashes: retained under `source.usj_directory.files`.

Those upstream hashes are provenance recorded in the contributor's dataset, not a claim that the current publisher download is byte-identical to this snapshot.

## Sanitization and integrity

For this contribution, the contributor's local workstation directory was removed from `source.usj_directory.path`, and historical application labels were removed from `generated.generator` and `generated.enhanced_generator`. JSON was serialized as UTF-8 with LF newlines. Every `books` object, including every verse text and the full embedded USJ structures, was compared with the original and preserved unchanged. No translation wording was edited.

Bundled `assets/bsb_smart.json`:

- Bytes: `30671949`
- SHA-256: `652238d963b3d3f0ed9f38f6a32e10fbd6de6821bb7bae34ab48c68d18f67edc`

A byte hash checks this exact bundled file; the tests additionally check that the derived SQLite index preserves all verse references and text. Future intentional data updates must refresh the hash and provenance rather than retaining an obsolete integrity claim.

## Permission and attribution

The publisher's [licensing page](https://berean.bible/licensing.htm) and [terms](https://berean.bible/terms.htm), checked September 30, 2026, state that the Berean Bible texts were dedicated to the public domain on April 30, 2023 and that all uses are freely permitted. The terms allow reproduction, integration, and adaptation, while requesting that modified translation wording not be presented under the Berean name. This contribution preserves the supplied translation wording.

The source dataset retains this attribution:

> The Holy Bible, Berean Standard Bible, BSB is produced in cooperation with Bible Hub, Discovery Bible, unfoldingWord, Bible Aquifer, OpenBible.com, and the Berean Bible Translation Committee.

Official resources: [Berean Bible downloads](https://berean.bible/downloads.htm).

The MIT license in this skill folder applies to the contributed helper, instructions, tests, and any contributor-owned rights in the JSON arrangement. It does **not** impose MIT conditions on the underlying public-domain Bible text. No copyrighted study books, commercial commentaries, private lesson materials, or group recordings are included.
