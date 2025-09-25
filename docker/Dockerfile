FROM python:3.9-slim

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Define diretório de trabalho
WORKDIR /app

# Copia requirements e instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia código da aplicação
COPY app/ .

# Expõe porta da aplicação
EXPOSE 5000

# Comando de inicialização
CMD ["python", "main.py"]