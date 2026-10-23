# so1-formatter-converter

[![Tests](https://github.com/so1tan0v/so1-formatter-converter/actions/workflows/test.yml/badge.svg)](https://github.com/so1tan0v/so1-formatter-converter/actions/workflows/test.yml)

Terminal-style formatter and converter for JSON, YAML, SQL and Markdown.

## Language

English and Russian. The choice is stored in `localStorage` (`so1-fmt.locale`) and otherwise follows the browser. `?lang=ru` or `?locale=en` overrides it, including embed mode. An embed host can also post `{ source: 'so1-converter', type: 'set-locale', locale: 'ru' }`.

## Excel

JSON → Excel writes an `.xlsx` workbook. Excel → JSON reads that preview, a `.xlsx` file, TSV, or CSV.

## Metrics

`docker compose up` starts the site, the Go backend, Prometheus and Grafana. The browser posts visits, actions and visible time to `POST /api/metrics/collect`. Graphs are in Grafana at https://grafana.soltanov.dev. The public site sends `/api/` straight to the backend. Prometheus scrapes `GET /api/metrics` inside the compose network. `BACKEND_TOKEN` protects that scrape. `BACKEND_RETENTION_DAYS` defaults to 30; `0` or `forever` keeps rows. `BACKEND_DB` is the SQLite file. Country names come from the request headers or the DB-IP country lite file cached next to the database.
