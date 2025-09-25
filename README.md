# Aplicação Distribuída de Conversão de Vídeos com Kubernetes

## Contexto

Este projeto foi desenvolvido como parte da avaliação da disciplina de Sistemas Distribuídos. O objetivo é criar e implantar uma aplicação distribuída para conversão de vídeos em um ambiente Kubernetes local (Minikube).

A aplicação consiste em um serviço web simples, construído com Python e Flask, que recebe um arquivo de vídeo, o converte para um formato especificado (MP4, AVI ou MKV) utilizando FFmpeg e o retorna ao cliente.

## Estrutura do Projeto

```
video-converter/
├── app/
│   ├── app.py             # Lógica principal da aplicação Flask
│   └── requirements.txt   # Dependências Python
├── kubernetes/
│   ├── deployment.yaml    # Manifesto do Deployment para o Kubernetes
│   └── service.yaml       # Manifesto do Service para o Kubernetes
├── Dockerfile             # Instruções para construir a imagem Docker
└── README.md              # Este arquivo
```

## Tecnologias Utilizadas

* Backend: Python 3.11+, Flask
* Conversão de Vídeo: FFmpeg
* Containerização: Docker
* Orquestração: Kubernetes (Minikube)

## Passo a Passo para o Deploy

### Passo 1: Iniciar o Minikube

Abra o terminal e inicie um cluster Minikube:

```
minikube start
```

### Passo 2: Configurar o Ambiente Docker

Para que o Minikube utilize imagens Docker construídas localmente, aponte o terminal para o daemon Docker do Minikube. Isso evita a necessidade de um registry remoto.

```
# Para Linux/macOS
eval $(minikube -p minikube docker-env)

# Para PowerShell no Windows
minikube -p minikube docker-env | Invoke-Expression
```

**Importante**: Este comando só afeta a sessão atual do terminal. Se um novo terminal for aberto, será preciso executá-lo novamente.

### Passo 3: Construir a Imagem Docker

Navegue até a raiz do projeto (o diretório `video-converter`) e execute o comando de build:

```
docker build -t video-converter:latest .
```

O `.` no final indica que o Dockerfile está no diretório atual. A tag `-t video-converter:latest` nomeia a imagem para que o Kubernetes possa encontrá-la.

### Passo 4: Aplicar os Manifestos do Kubernetes

Com a imagem pronta, aplique os arquivos de configuração do Deployment e do Service no cluster:

```
kubectl apply -f kubernetes/
```

Este comando criará os Pods (baseado no Deployment) e o Service que expõe os Pods para acesso externo.

### Passo 5: Verificar a Implantação

Verifique se os pods estão em execução e se o serviço foi criado corretamente.

```
# Verifica os pods. Deve haver 2 pods com o status "Running".
kubectl get pods

# Verifica os serviços.
kubectl get services
```

## Como Testar a Aplicação

Para interagir com a aplicação, é preciso obter a URL de acesso ao serviço.

### Passo 1: Obter a URL do Serviço

O Minikube facilita a obtenção da URL para serviços do tipo `NodePort`:

```
minikube service video-converter-service --url
```

Este comando retornará uma URL, algo como `http://192.168.49.2:31234`.

### Passo 2: Enviar um Vídeo para Conversão

Use um cliente HTTP como o `curl` para enviar um arquivo de vídeo para o endpoint `/convert`.

**Exemplo**: Convertendo um vídeo chamado `meu_video.mp4` para o formato `avi`.

Substitua `<URL_DO_SERVICO>` pela URL obtida no passo anterior e `/caminho/para/meu_video.mp4` pelo caminho real do seu arquivo.

```
curl -X POST \
  -F "file=@/caminho/para/meu_video.mp4" \
  "<URL_DO_SERVICO>/convert?output_format=avi" \
  -o video_convertido.avi
```

* `-F "file=@..."`: Anexa o arquivo de vídeo ao corpo da requisição.
* `?output_format=avi`: Especifica o formato de saída como um parâmetro de query.
* `-o video_convertido.avi`: Salva a resposta (o vídeo convertido) em um arquivo local.

Se tudo correr bem, você terá o arquivo `video_convertido.avi` no seu diretório.

## Logs e Debugging

Para depurar ou monitorar a aplicação, você pode visualizar os logs dos pods.

```
# Listar os nomes dos pods
kubectl get pods

# Visualizar o log de um pod específico
kubectl logs <NOME_DO_POD>

# Visualizar os logs de todos os pods do deployment em tempo real
kubectl logs -f -l app=video-converter
```

A flag `-l app=video-converter` seleciona todos os pods com essa label, que foi definida no nosso `deployment.yaml`.