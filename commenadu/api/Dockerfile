FROM node:11-alpine AS builder
WORKDIR /usr/src/app
COPY . .
RUN yarn \
	&& yarn build

FROM node:11-slim
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/build/ ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "./src/index.js"]
