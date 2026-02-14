#!/bin/bash

echo "=========================================="
echo "  Sistema de Decisiones Judiciales"
echo "=========================================="
echo ""

# Verificar si existe el entorno virtual
if [ -d "venv" ]; then
    echo "Activando entorno virtual..."
    source venv/bin/activate
else
    echo "Creando entorno virtual..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Instalando dependencias..."
    pip install -r requirements.txt
fi

echo ""
echo "Iniciando aplicación..."
echo ""
python app.py
