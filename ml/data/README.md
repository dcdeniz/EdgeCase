# Data boundary

No raw VISEM or UCI participant data is committed. `raw/`, `uci_raw/`, and
`processed/` are ignored.

The fetch command verifies the pinned Zenodo record ID, DOI, archive size, and
Zenodo-published archive MD5, then uses HTTP byte ranges to read the ZIP directory and
extract only three allow-listed CSV members. It never downloads or reads a video member.

Committed files contain only source schemas, non-person-level metadata, and synthetic
test fixtures. VISEM is licensed CC BY-NC 4.0; downstream artifacts are research-only
and non-commercial.

The UCI fetch command downloads only the official 3 KB archive for dataset 244,
verifies the pinned archive SHA-256, enforces a one-member allow-list, and verifies
the member SHA-256 before writing the ignored raw text file. UCI Fertility is CC BY
4.0. Its 100 rows and 88:12 class split are suitable only for a small experimental
screen, not a medical score.

The prospective cohort contract is separate from VISEM. Its committed fixture is
explicitly synthetic and exists only to test repeated-test pairing, temporal feature
windows, and validation isolation. Real prospective extracts require ethics, consent,
privacy, retention, access-control, and licence review outside this repository.
