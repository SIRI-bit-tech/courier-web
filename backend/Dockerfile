# Use Python slim image for smaller size
FROM python:3.11-slim

# Set environment variables for production
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=swiftcourier_backend.settings
ENV PYTHONPATH=/app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        netcat-traditional \
        curl \
        libjpeg-dev \
        libpng-dev \
        libtiff-dev \
        libfreetype6-dev \
        liblcms2-dev \
        libwebp-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create app directory and set work directory
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos '' --uid 1001 appuser \
    && chown -R appuser:appuser /app

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn==21.2.0

# Copy project files
COPY --chown=appuser:appuser . /app/

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media /app/logs /app/tmp \
    && chown -R appuser:appuser /app/staticfiles /app/media /app/logs /app/tmp

# Copy entrypoint script
COPY --chown=appuser:appuser docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Switch to non-root user
USER appuser

# Health check for Render
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health/ || exit 1

# Expose port
EXPOSE 8000

# Set entrypoint and default command with PORT support
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "$PORT", "swiftcourier_backend.asgi:application"]
