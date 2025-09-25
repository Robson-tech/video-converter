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

Para depurar ou monitorar a aplicação, você pode veulizar os logs dos pods.

```
# Listar os nomes dos pods
kubectl get pods

# Veulizar o log de um pod específico
kubectl logs <NOME_DO_POD>

# Veulizar os logs de todos os pods do deployment em tempo real
kubectl logs -f -l app=video-converter
```

A flag `-l app=video-converter` seleciona todos os pods com essa label, que foi definida no nosso `deployment.yaml`.

## Monitoramento com Prometheus

Adicionado monitoramento à aplicação. O método recomendado é usar o addon do Minikube. Se ele não funcionar, um método alternativo usando Helm é fornecido.

### Método 1: Habilitar o Addon do Minikube (Recomendado)

O Minikube geralmente vem com um addon que facilita a instalação de uma stack de monitoramento.

Primeiro, verifique se o addon está disponível:

```
minikube addons list
```

Se o `prometheus` aparecer na lista, habilite-o com o seguinte comando:

```
minikube addons enable prometheus
```

Isso pode levar alguns minutos. O Minikube irá baixar as imagens necessárias e configurar o Prometheus e o Grafana no namespace `monitoring`. Após a conclusão, pule para o **Passo 2: Acessar o Painel do Prometheus**.

### Método 2: Instalação com Helm (Alternativa)

Se o addon não estiver disponível ou falhar, use o Helm, o gerenciador de pacotes do Kubernetes.

1. **Instale o Helm**: Se você ainda não o tiver, siga o [guia oficial de instalação do Helm](https://helm.sh/docs/intro/install/).
2. **Adicione o repositório do Prometheus**:
```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```
3. **Instale o Prometheus**: O comando a seguir instala a `kube-prometheus-stack`, que inclui Prometheus, Grafana e outros componentes essenciais, em um namespace dedicado chamado `monitoring`.
```
helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
```

### Passo 2: Acessar o Painel do Prometheus

Para acessar a interface web do Prometheus, vamos encaminhar a porta do serviço dele para a sua máquina local. Abra um **novo terminal** e execute:

```
kubectl port-forward -n monitoring service/prometheus-kube-prometheus-prometheus 9090
```

> **Nota**: O nome do serviço pode variar ligeiramente dependendo do método de instalação, mas `prometheus-kube-prometheus-prometheus` é o padrão para ambas as abordagens.

Agora, é possível acessar o Prometheus no navegador em: [http://localhost:9090](http://localhost:9090)

### Passo 3: Verificar se a Aplicação é um Alvo (Target)

No painel do Prometheus, navegue até Status > Targets. Você deve encontrar um grupo de alvos (targets) chamado `pod/video-converter/...`. Os dois pods da aplicação devem aparecer com o estado "UP", indicando que o Prometheus está coletando métricas deles com sucesso.

### Passo 4: Consultar Métricas da Aplicação

Agora é possível usar a linguagem de consulta do Prometheus (PromQL) para explorar as métricas. Na aba Graph, experimente as seguintes consultas:

* Contador de requisições HTTP por método e status:

```
flask_http_requests_total
```

* Latência (duração) das requisições:

```
flask_http_requests_latency_seconds_bucket
```

Após enviar alguns vídeos para conversão (passo 6), execute essas consultas novamente e você verá os dados sendo atualizados, permitindo monitorar o comportamento da aplicação distribuída em tempo real.