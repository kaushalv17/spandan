.PHONY: up down build test lint fmt migrate prepare-data
up:            ; docker compose up -d
down:          ; docker compose down
build:         ; docker compose build
test:          ; cd ai && pytest -q && cd ../backend && npm test
lint:          ; cd ai && ruff check . && cd ../backend && npm run lint
fmt:           ; cd ai && ruff format . && cd ../backend && npm run format
migrate:       ; cd backend && npm run migrate up
prepare-data:  ; cd ai && python -m spandan_ai.data.prepare
