---
name: Petición de funcionalidad
about: Propone una nueva funcionalidad o una mejora
labels: ['type:feature']
body:
  - type: textarea
    id: problema
    attributes:
      label: Problema a resolver
      description: Qué problema o necesidad motiva esta petición.
    validations:
      required: true
  - type: textarea
    id: solucion
    attributes:
      label: Solución propuesta
      description: Cómo te gustaría que funcionara. Incluye detalles de UI o comportamiento esperado si aplica.
    validations:
      required: true
  - type: textarea
    id: alternativas
    attributes:
      label: Alternativas consideradas
      description: Otras soluciones o enfoques que descartaste y por qué.
    validations:
      required: false
  - type: textarea
    id: contexto-adicional
    attributes:
      label: Contexto adicional
      description: Mockups, referencias o cualquier otro detalle relevante.
    validations:
      required: false
