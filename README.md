# Sistema de Decisiones Judiciales - LexDigital

Bienvenido a **LexDigital**, una plataforma moderna y profesional para la consulta de decisiones judiciales. Este proyecto utiliza Flask y TailwindCSS para ofrecer una experiencia de usuario rápida, limpia y corporativa.

## Características

- **Diseño Corporativo (Light Mode)**: Interfaz limpia en tonos pizarra (`slate`) y blanco para máxima legibilidad.
- **Búsqueda Rápida**: Consulta decisiones por NUC (Número Único de Caso).
- **Vista de Tabla**: Resultados organizados en una tabla responsiva con desplazamiento horizontal en móviles.
- **Exportación**: Descarga automática de los resultados en formato JSON para análisis posterior.

## Requisitos

- Python 3.8+
- pip (Gestor de paquetes de Python)

## Instalación

1. **Clonar el repositorio** (si aplica):

    ```bash
    git clone https://github.com/tu-usuario/sistema-decisiones.git
    cd sistema-decisiones
    ```

2. **Crear un entorno virtual** (recomendado):

    ```bash
    # En Windows
    python -m venv venv
    .\venv\Scripts\activate
    
    # En macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3. **Instalar dependencias**:

    ```bash
    pip install -r requirements.txt
    ```

## Uso

1. **Iniciar el servidor**:

    ```bash
    python app.py
    ```

2. **Abrir en el navegador**:
    Visita `http://localhost:5000`

3. **Realizar una búsqueda**:
    Ingresa un NUC válido (ejemplo: `199-2020-ELAB-00094`) y presiona "Explorar".

## Tecnologías

- **Backend**: Python, Flask
- **Frontend**: HTML5, TailwindCSS (vía CDN), FontAwesome
- **Estilos**: Custom CSS (`static/css/custom.css`) con variables CSS para el tema claro.

## Contribuir

Si deseas contribuir, por favor abre un *Issue* o envía un *Pull Request*.
