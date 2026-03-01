FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY ai-backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY ai-backend/ .

# Expose port
EXPOSE 8000

# Run the app
CMD ["python", "main.py"]
