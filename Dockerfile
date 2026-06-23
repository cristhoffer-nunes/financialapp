# Estágio 1: Build da aplicação React
FROM node:22-alpine AS build

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos de configuração de dependências
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Declara as variáveis que podem ser passadas no momento do build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Define essas variáveis de ambiente para o Vite utilizá-las na compilação
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Compila a aplicação para produção
RUN npm run build

# Estágio 2: Servir a aplicação com o Nginx
FROM nginx:alpine

# Copia a configuração personalizada do Nginx para suportar o React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos gerados no estágio anterior para a pasta pública do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# A porta que será exposta no container
EXPOSE 80

# Inicia o servidor web
CMD ["nginx", "-g", "daemon off;"]
