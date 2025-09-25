import os
import subprocess
import uuid
import logging
from flask import Flask, request, send_file, jsonify

# Configuração básica de logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

# Define o limite máximo de tamanho do arquivo para 100 MB
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024 

# Diretório temporário dentro do contêiner
TEMP_DIR = "/tmp"
ALLOWED_FORMATS = {"mp4", "avi", "mkv"}

@app.route('/convert', methods=['POST'])
def convert_video():
    """
    Endpoint para receber um vídeo, convertê-lo e retorná-lo.
    """
    # 1. Validação da Requisição
    if 'file' not in request.files:
        logging.warning("Nenhum arquivo enviado na requisição.")
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    file = request.files['file']
    output_format = request.args.get('output_format')

    if file.filename == '':
        logging.warning("Arquivo enviado sem nome.")
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400

    if not output_format or output_format.lower() not in ALLOWED_FORMATS:
        logging.warning(f"Formato de saída inválido: {output_format}")
        return jsonify({"error": f"Formato de saída inválido. Use um dos seguintes: {', '.join(ALLOWED_FORMATS)}"}), 400

    # 2. Processamento do Arquivo
    # Gera nomes de arquivo únicos para evitar conflitos
    unique_id: str = str(uuid.uuid4())
    original_filename = file.filename
    input_filename: str = f"{unique_id}_{original_filename}"
    output_filename: str = f"{unique_id}.{output_format.lower()}"
    
    input_path = os.path.join(TEMP_DIR, input_filename)
    output_path = os.path.join(TEMP_DIR, output_filename)

    logging.info(f"Recebido arquivo '{original_filename}'. Formato de saída: {output_format}")
    logging.info(f"Salvando temporariamente em: {input_path}")
    
    file.save(input_path)

    # 3. Conversão com FFmpeg
    try:
        logging.info(f"Iniciando conversão de '{input_path}' para '{output_path}'")
        
        # Comando FFmpeg: -i para input, -y para sobrescrever arquivos existentes
        command = [
            'ffmpeg',
            '-i', input_path,
            '-y', # Sobrescreve o arquivo de saída se ele já existir
            output_path
        ]
        
        # Executa o comando e captura a saída. `check=True` lança uma exceção se o comando falhar.
        subprocess.run(command, check=True, capture_output=True, text=True)
        
        logging.info(f"Conversão concluída com sucesso para '{output_path}'")

        # 4. Envio do Arquivo Convertido
        return send_file(output_path, as_attachment=True, download_name=f"converted_{original_filename.split('.')[0]}.{output_format.lower()}")

    except subprocess.CalledProcessError as e:
        # Erro durante a execução do FFmpeg
        logging.error(f"Erro do FFmpeg durante a conversão: {e.stderr}")
        return jsonify({"error": "Falha ao converter o vídeo", "details": e.stderr}), 500
    except Exception as e:
        # Outros erros inesperados
        logging.error(f"Um erro inesperado ocorreu: {str(e)}")
        return jsonify({"error": "Ocorreu um erro interno no servidor"}), 500
    finally:
        # 5. Limpeza dos Arquivos Temporários
        # Garante que os arquivos sejam deletados mesmo se ocorrer um erro
        if os.path.exists(input_path):
            os.remove(input_path)
            logging.info(f"Arquivo temporário de entrada deletado: {input_path}")
        if os.path.exists(output_path):
            os.remove(output_path)
            logging.info(f"Arquivo temporário de saída deletado: {output_path}")

@app.errorhandler(413)
def request_entity_too_large(error):
    """
    Tratamento de erro para arquivos que excedem o limite de tamanho.
    """
    logging.warning("Tentativa de upload de arquivo maior que o limite de 100MB.")
    return jsonify(error="O arquivo é muito grande. O limite é de 100MB."), 413


if __name__ == '__main__':
    # '0.0.0.0' torna a aplicação acessível na rede local (e dentro do contêiner)
    app.run(host='0.0.0.0', port=5000, debug=True)
