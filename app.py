from flask import Flask, render_template, request, jsonify
import requests
import json
import os
from datetime import datetime

app = Flask(__name__)

# Configuración
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
API_URL = "https://api.poderjudicial.gob.do/Decisiones/Decisiones/ObtenerDecisiones"

# Asegurar que existe el directorio de datos
os.makedirs(DATA_DIR, exist_ok=True)

def obtener_decisiones(nuc, pagina_actual=1, registros_por_pagina=20):
    """
    Función para consultar la API del Poder Judicial
    """
    params = {
        'Nuc': nuc,
        'PaginaActual': pagina_actual,
        'RegistrosPorPagina': registros_por_pagina
    }

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        response = requests.get(API_URL, params=params, headers=headers, timeout=30)
        
        # Intentar parsear JSON independientemente del status code para debugging
        try:
            data = response.json()
        except:
            data = {'error': 'No se pudo parsear la respuesta como JSON', 'content': response.text}
            
        return {
            'status_code': response.status_code,
            'data': data,
            'raw_response': data
        }
    except requests.exceptions.RequestException as e:
        print(f"Error al consultar la API: {e}")
        return {
            'status_code': 500,
            'data': None,
            'error': str(e)
        }

def guardar_respuesta(nuc, data):
    """
    Guarda la respuesta de la API en un archivo JSON
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"decisiones_{nuc.replace('-', '_')}_{timestamp}.json"
    filepath = os.path.join(DATA_DIR, filename)
    
    # Agregar metadatos
    data_con_metadatos = {
        'nuc_consultado': nuc,
        'fecha_consulta': datetime.now().isoformat(),
        'respuesta_api': data
    }
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data_con_metadatos, f, ensure_ascii=False, indent=2)
    
    return filename

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/api/buscar', methods=['POST'])
def buscar():
    """Endpoint para buscar decisiones"""
    data = request.get_json()
    nuc = data.get('nuc', '').strip()
    pagina = data.get('pagina', 1)
    registros = data.get('registros', 20)
    
    if not nuc:
        return jsonify({'error': 'El NUC es requerido'}), 400
    
    # Consultar la API
    resultado_api = obtener_decisiones(nuc, pagina, registros)
    
    if resultado_api['status_code'] != 200:
        return jsonify({
            'success': False,
            'error': f"Error de la API del Poder Judicial (Status: {resultado_api['status_code']})",
            'debug': {
                'status_code': resultado_api['status_code'],
                'raw_response': resultado_api.get('raw_response', resultado_api.get('error'))
            }
        }), 200 # Devolver 200 para manejarlo en el frontend y mostrar debug info
    
    resultado = resultado_api['data']
    
    # Guardar la respuesta
    archivo_guardado = guardar_respuesta(nuc, resultado)
    
    return jsonify({
        'success': True,
        'data': resultado,
        'archivo_guardado': archivo_guardado,
        'debug': {
            'status_code': 200,
            'raw_response': resultado
        }
    })

@app.route('/api/historial', methods=['GET'])
def historial():
    """Obtener lista de consultas guardadas"""
    archivos = []
    for f in os.listdir(DATA_DIR):
        if f.endswith('.json'):
            filepath = os.path.join(DATA_DIR, f)
            stat = os.stat(filepath)
            archivos.append({
                'nombre': f,
                'fecha': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'tamano': stat.st_size
            })
    
    archivos.sort(key=lambda x: x['fecha'], reverse=True)
    return jsonify(archivos)

@app.route('/api/historial/<filename>', methods=['GET'])
def ver_historial(filename):
    """Ver una consulta guardada específica"""
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Archivo no encontrado'}), 404
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
