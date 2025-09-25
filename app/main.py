from flask import Flask, request, jsonify, send_file
import os
import logging
from pathlib import Path
from werkzeug.utils import secure_filename
from converter import VideoConverter

# Configuração da aplicação
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB limit

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Diretório temporário para uploads
UPLOAD_DIR = Path('/tmp/video_uploads')
UPLOAD_DIR.mkdir(exist_ok=True)

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de health check"""
    return jsonify({'status': 'healthy', 'service': 'video-converter'})

@app.route('/convert', methods=['POST'])
def convert_video():
    """
    Endpoint para conversão de vídeos
    
    Parâmetros:
    - file: arquivo de vídeo (form-data)
    - output_format: formato de saída (query parameter: mp4, avi, mkv)
    """
    try:
        # Verifica se o arquivo foi enviado
        if 'file' not in request.files:
            logger.warning("Requisição sem arquivo")
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        output_format = request.args.get('output_format', '').lower()
        
        # Validações
        if file.filename == '':
            return jsonify({'error': 'Nome de arquivo vazio'}), 400
        
        if not output_format:
            return jsonify({'error': 'Parâmetro output_format obrigatório'}), 400
        
        if output_format not in VideoConverter.SUPPORTED_FORMATS:
            return jsonify({
                'error': f'Formato {output_format} não suportado',
                'supported_formats': list(VideoConverter.SUPPORTED_FORMATS)
            }), 400
        
        # Salva arquivo temporariamente
        filename = secure_filename(file.filename)
        input_path = UPLOAD_DIR / filename
        file.save(str(input_path))
        
        logger.info(f"Arquivo recebido: {filename} -> {input_path}")
        
        # Converte o vídeo
        converter = VideoConverter()
        output_path = converter.convert_video(str(input_path), output_format)
        
        # Envia arquivo convertido
        response = send_file(
            output_path,
            as_attachment=True,
            download_name=f"converted.{output_format}"
        )
        
        # Limpeza dos arquivos temporários
        try:
            input_path.unlink()
            Path(output_path).unlink()
            logger.info("Arquivos temporários removidos")
        except Exception as e:
            logger.warning(f"Erro na limpeza: {str(e)}")
        
        return response
        
    except ValueError as e:
        logger.error(f"Erro de validação: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Erro interno: {str(e)}")
        return jsonify({'error': 'Erro interno no servidor'}), 500

if __name__ == '__main__':
    logger.info("Iniciando servidor de conversão de vídeos")
    app.run(host='0.0.0.0', port=5000, debug=False)