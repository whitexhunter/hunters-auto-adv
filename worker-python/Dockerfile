FROM python:3.11-slim

WORKDIR /app

COPY worker-python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker-python/worker.py .

CMD ["python3", "worker.py"]
