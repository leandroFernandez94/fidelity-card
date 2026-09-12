---
name: Reporte de bug
about: Reporta un comportamiento incorrecto o inesperado
labels: ['type:bug']
body:
  - type: textarea
    id: descripcion
    attributes:
      label: Descripción
      description: Descripción clara y concisa del problema.
      placeholder: Qué pasó, dónde y con qué impacto.
    validations:
      required: true
  - type: textarea
    id: pasos
    attributes:
      label: Pasos para reproducir
      description: Lista mínima de pasos para reproducir el problema.
      placeholder: |
        1. Ir a '...'
        2. Hacer clic en '...'
        3. Observar el error
    validations:
      required: true
  - type: textarea
    id: comportamiento-esperado
    attributes:
      label: Comportamiento esperado
      description: Qué debería ocurrir si todo funcionara correctamente.
    validations:
      required: true
  - type: textarea
    id: comportamiento-actual
    attributes:
      label: Comportamiento actual
      description: Qué ocurre realmente, incluyendo mensajes de error si los hay.
    validations:
      required: true
  - type: dropdown
    id: navegador
    attributes:
      label: Entorno - Navegador
      description: Navegador donde se reprodujo el problema.
      options:
        - Chrome
        - Firefox
        - Safari
        - Edge
        - Otro
        - No aplica (backend)
    validations:
      required: true
  - type: dropdown
    id: sistema-operativo
    attributes:
      label: Entorno - Sistema operativo
      options:
        - Android
        - iOS
        - Windows
        - macOS
        - Linux
        - Otro
    validations:
      required: true
  - type: textarea
    id: contexto-adicional
    attributes:
      label: Contexto adicional
      description: Capturas de pantalla, logs, pasos previos o cualquier otro detalle relevante.
    validations:
      required: false
