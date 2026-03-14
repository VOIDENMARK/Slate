# Slate

One Surface for Everything.

Slate is a tiny local-first organizer for quick notes, ideas, and tasks.

## Quick start

```bash
python -m pip install -e .
slate add "Ideas" "Build Slate" --tag todo --tag product
slate list
slate search product
```

Data is stored in `~/.slate/surfaces.json` by default.

## Development

```bash
python -m pytest
```
