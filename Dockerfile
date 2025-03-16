
FROM denoland/deno:1.40.2

WORKDIR /app

# Copy dependency files first for better caching
COPY deno.json ./

# Copy the rest of the application
COPY . ./

# Expose the port Fly.io expects (8080 is standard)
EXPOSE 8080

# Create a build task in deno.json
RUN deno task build

# Run the server - use PORT environment variable which Fly.io provides
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-hrtime", "--allow-ffi", "src/main.tsx", "--port", "${PORT:-8080}"]
