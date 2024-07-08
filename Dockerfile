# 使用官方的 Node.js 18 镜像作为基础镜像
FROM node:18 as builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 Next.js 应用
RUN npm run build

# 仅包含生产环境的依赖项
FROM node:18 as production

# 设置工作目录
WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder /app ./

# 暴露应用的端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]