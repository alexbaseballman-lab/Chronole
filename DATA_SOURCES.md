# Data Sources

## Historical boundaries

Chronole's historical boundary data comes from
[aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps),
by Andre Aourednik.

- **License:** GPL-3.0
- **Pinned commit:** `62d8f1a03a71f2d3ff17f2d166f7553f256bce68`
- **Fetched via:** `scripts/build-data.mjs`, which downloads the raw GeoJSON
  snapshots, filters out non-political features, simplifies geometry, and
  writes the result to `public/data/`.

The dataset is kept as plain static assets separate from the app's source
code and logic. This attribution notice is also shown on the About page.

To refresh the data (e.g. to pull in upstream corrections), update `COMMIT`
in `scripts/build-data.mjs` and re-run it:

```bash
node scripts/build-data.mjs
```
