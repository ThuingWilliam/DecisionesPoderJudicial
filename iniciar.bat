@echo off
echo ==========================================
echo  Sistema de Decisiones Judiciales
echo ==========================================
echo.

REM Verificar si existe el entorno virtual
if exist "venv\Scripts\activate.bat" (
    echo Activando entorno virtual...
    call venv\Scripts\activate.bat
) else (
    echo Creando entorno virtual...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo Instalando dependencias...
    pip install -r requirements.txt
)

echo.
echo Iniciando aplicacion...
echo.
python app.py

pause
