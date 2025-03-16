
FROM denoland/deno:1.40.2

WORKDIR /app

# Copy dependency files first for better caching
COPY deno.json ./

# Copy the rest of the application
COPY . ./

# Create a build task in deno.json
RUN deno task build

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-hrtime", "--allow-ffi", "src/main.tsx"]
