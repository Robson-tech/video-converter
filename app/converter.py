import os
import subprocess
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class VideoConverter:
    """Classe responsável pela conversão de vídeos usando FFmpeg"""
    
    SUPPORTED_FORMATS = {'mp4', 'avi', 'mkv'}
    
    @staticmethod
    def convert_video(input_path: str, output_format: str) -> str:
        """
        Converte um vídeo para o formato especificado
        
        Args:
            input_path: Caminho do arquivo de entrada
            output_format: Formato de saída (mp4, avi, mkv)
            
        Returns:
            Caminho do arquivo convertido
            
        Raises:
            ValueError: Formato não suportado ou erro na conversão
        """
        if output_format.lower() not in VideoConverter.SUPPORTED_FORMATS:
            raise ValueError(f"Formato {output_format} não suportado. Use: {', '.join(VideoConverter.SUPPORTED_FORMATS)}")
        
        # Gera caminho de saída
        input_file = Path(input_path)
        output_path = input_file.parent / f"{input_file.stem}_converted.{output_format}"
        
        logger.info(f"Iniciando conversão: {input_path} -> {output_path}")
        
        # Comando FFmpeg para conversão
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-y',  # Sobrescrever arquivo existente
            '-c', 'copy',  # Copiar streams sem re-encoding (mais rápido)
            str(output_path)
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                logger.error(f"Erro na conversão: {result.stderr}")
                raise ValueError(f"Falha na conversão: {result.stderr}")
            
            if not output_path.exists():
                raise ValueError("Arquivo de saída não foi criado")
                
            logger.info(f"Conversão concluída: {output_path}")
            return str(output_path)
            
        except subprocess.TimeoutExpired:
            logger.error("Timeout na conversão do vídeo")
            raise ValueError("Conversão excedeu o tempo limite")
        except Exception as e:
            logger.error(f"Erro inesperado na conversão: {str(e)}")
            raise