FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml ./
RUN pip install -e .
COPY . .
EXPOSE 8001
CMD ["uvicorn", "spandan_ai.service.app:app", "--host", "0.0.0.0", "--port", "8001"]
