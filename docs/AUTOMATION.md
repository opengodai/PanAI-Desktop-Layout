# Agile automated validation

The manual `agile-validation.yml` workflow accepts Agile's request UUID, immutable
commit SHA, `validation` environment and `build` operation. It runs source syntax
checks and the eleven existing headless Node regression suites with Node 24.19.0.
It installs no desktop packages and does not change a live desktop or deploy.

The full local `scripts/check.sh` additionally requires the installed GNOME and
Ubuntu Dock schemas and runs the isolated installer roundtrip. Hosted success is
not proof of those environment-specific checks, real animation frame rate,
reboot persistence or compatibility with other GNOME major versions.

Agile must read back the exact workflow run and attempt before recording success.
An accepted dispatch or synchronized repository alone is not a passing run.
