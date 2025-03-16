
FROM denoland/deno:1.40.2

WORKDIR /app

# Copy dependency files
COPY deno.json ./

# Copy the rest of the application
COPY . ./

# Cache the dependencies
RUN deno cache src/main.tsx

# Compile the project
RUN deno task build

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "src/main.tsx"]
