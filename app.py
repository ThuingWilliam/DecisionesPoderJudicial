from flask import Flask, render_template, request, jsonify
import requests
import json
import os
from datetime import datetime

app = Flask(__name__)

# Configuración
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

API_DECISIONES = "https://api.poderjudicial.gob.do/Decisiones/Decisiones/ObtenerDecisiones"
API_CASOS      = "https://api.poderjudicial.gob.do/Casos/Tramite/ObtenerDatosPorNuc"
API_AUDIENCIAS = "https://api.poderjudicial.gob.do/Audiencias/Audiencias/ObtenerAudienciasPorNuc"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
}

# Asegurar que existe el directorio de datos
os.makedirs(DATA_DIR, exist_ok=True)


def _llamar_api(url, params):
    """Función genérica para llamar una API del Poder Judicial."""
    try:
        response = requests.get(url, params=params, headers=HEADERS, timeout=30)
        try:
            data = response.json()
        except Exception:
            data = {'error': 'No se pudo parsear la respuesta como JSON', 'content': response.text}
        return {'status_code': response.status_code, 'data': data}
    except requests.exceptions.RequestException as e:
        print(f"Error al consultar {url}: {e}")
        return {'status_code': 500, 'data': None, 'error': str(e)}


def obtener_decisiones(nuc, pagina_actual=1, registros_por_pagina=15):
    params = {'Nuc': nuc, 'PaginaActual': pagina_actual, 'RegistrosPorPagina': registros_por_pagina}
    return _llamar_api(API_DECISIONES, params)


def obtener_casos(nuc, pagina_actual=1, registros_por_pagina=15):
    params = {'Nuc': nuc, 'PaginaActual': pagina_actual, 'RegistrosPorPagina': registros_por_pagina}
    return _llamar_api(API_CASOS, params)


def obtener_audiencias(nuc, pagina_actual=1, registros_por_pagina=15):
    params = {'Nuc': nuc, 'PaginaActual': pagina_actual, 'RegistrosPorPagina': registros_por_pagina}
    return _llamar_api(API_AUDIENCIAS, params)


def guardar_respuesta(nuc, data):
    """Guarda la respuesta combinada de la API en un archivo JSON."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"consulta_{nuc.replace('-', '_')}_{timestamp}.json"
    filepath = os.path.join(DATA_DIR, filename)
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
    """Endpoint para buscar información por NUC en las tres APIs."""
    data = request.get_json()
    nuc = data.get('nuc', '').strip()
    pagina = data.get('pagina', 1)
    registros = data.get('registros', 15)

    if not nuc:
        return jsonify({'error': 'El NUC es requerido'}), 400

    # Consultar las tres APIs
    r_decisiones  = obtener_decisiones(nuc, pagina, registros)
    r_casos        = obtener_casos(nuc, pagina, registros)
    r_audiencias   = obtener_audiencias(nuc, pagina, registros)

    # Preparar resultado combinado. Si una API falla, se incluye igualmente con su error.
    resultado = {
        'success': True,
        'nuc': nuc,
        'decisiones': r_decisiones['data'] if r_decisiones['status_code'] == 200 else {'error': r_decisiones.get('error', f"Status {r_decisiones['status_code']}"), 'datos': []},
        'casos':      r_casos['data']      if r_casos['status_code'] == 200      else {'error': r_casos.get('error', f"Status {r_casos['status_code']}"), 'datos': []},
        'audiencias': r_audiencias['data'] if r_audiencias['status_code'] == 200 else {'error': r_audiencias.get('error', f"Status {r_audiencias['status_code']}"), 'datos': []},
        'debug': {
            'decisiones_status': r_decisiones['status_code'],
            'casos_status':      r_casos['status_code'],
            'audiencias_status': r_audiencias['status_code'],
        }
    }

    # Guardar resultado completo
    archivo_guardado = guardar_respuesta(nuc, resultado)
    resultado['archivo_guardado'] = archivo_guardado

    return jsonify(resultado)


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
