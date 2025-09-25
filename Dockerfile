# Etapa 1: Imagem base com Python
# Usamos a imagem 'slim' para manter o tamanho final menor.
FROM python:3.11-slim

# Instala o FFmpeg, que é uma dependência de sistema operacional
# `apt-get clean` e `rm -rf /var/lib/apt/lists/*` ajudam a reduzir o tamanho da imagem
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia o arquivo de dependências primeiro para aproveitar o cache do Docker
COPY ./app/requirements.txt .

# Instala as dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código da aplicação
COPY ./app .

# Expõe a porta que a aplicação Flask irá rodar
EXPOSE 5000

# Comando para iniciar a aplicação quando o contêiner for executado
# Usamos 'app:app' para indicar que o objeto 'app' está no arquivo 'app.py'
CMD ["python", "app.py"]