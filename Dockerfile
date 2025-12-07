#base image
FROM oven/bun:1.2.20

#working directory
WORKDIR /app

#copy dependencies files first for better caching
COPY package.json bun.lock* bunfig.toml* ./

#install dependencies
RUN bun install

# copy rest of the project
COPY . .

#expose port
EXPOSE 3000

#start the bun server
CMD ["bun","run","start"]
