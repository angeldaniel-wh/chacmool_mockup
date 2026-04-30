# EvalPro - Sistema de Evaluación 360° v4

## Problem Statement
Sistema web de evaluación de empleados basado en la lógica real del cliente WispaHub.

## Estado Actual
**MOCKUPS VISUALES v4 COMPLETOS** - Ajustados a documentación del cliente

## Cambios Realizados (v4)

### Matriz 9-Box con Porcentajes
- **Eje Y (VALORES):** 0-60%, 61-80%, 81-100%
- **Eje X (RESULTADOS):** 0-60%, 61-80%, 81-100%
- Clasificaciones basadas en documento "NOTAS JUGADORES.pdf":
  - **A** (81-100% ambos): "Jugador A - Espectaculares. Da resultados. Independientes."
  - **B3** (81-100% valores, 0-60% resultados): "Quiere ser A - Tiene valores pero no da resultados. Puesto incorrecto."
  - **C3** (0-60% valores, 81-100% resultados): "Difícil de Sacar - Genera resultados pero no tiene valores (cáncer). Tóxico."
  - Etc.

### Estructura de Evaluación (basada en CSV del cliente)
**Competencias necesarias para desempeñar su cargo (50%):**
- Liderazgo
- Trabajo en equipo
- Resolución de problemas
- Aprendizaje continuo

**Valores (50%):**
- Hazlo Ahora
- Mejora continua (Ley Boy Scout)
- Autoaprendizaje
- Alertidad
- Amabilidad
- Valor Agregado
- Comunicación Asertiva

### Tipos de Evaluadores
- Superior (30%)
- Subordinados (20%)
- Compañeros (20%)
- Clientes (15%)
- Autoevaluación (15%)

### Escala de Calificación
1. Nunca demuestra esta competencia/valor
2. Rara vez demuestra esta competencia/valor
3. A veces demuestra esta competencia/valor
4. Frecuentemente demuestra esta competencia/valor
5. Siempre demuestra esta competencia/valor

## Funcionalidades Implementadas ✅
- [x] Matriz 9-Box con porcentajes visibles
- [x] Clasificaciones con descripciones del cliente
- [x] Acciones recomendadas por clasificación
- [x] Desglose por tipo de evaluador
- [x] Competencias y Valores del CSV
- [x] Pesos auto-ajustables
- [x] Generación de enlaces públicos (WhatsApp/Email)
- [x] Formulario público escala 1-5
- [x] Panel de detalle al seleccionar empleado
- [x] Dashboard con estadísticas
- [x] Override manual de clasificación

## Testing
- 100% pruebas pasadas (22 funcionalidades verificadas)

## Módulo Vacaciones y Ausencias (Feb 2026)
- [x] CRUD de solicitudes con estados Pendiente/Aprobado/Justificado/Rechazado
- [x] Calendario interactivo multi-selección de días (Calendar360)
- [x] Sub-pestañas: Solicitudes / Bolsa de días / Políticas
- [x] Políticas por antigüedad + Festivos (admin)
- [x] Bolsa de días automática según antigüedad y políticas
- [x] Modal de edición admin con cálculo de saldo restante
- [x] **[Feb 2026]** Validación de bolsa en calendario: bloqueo de selección al exceder días disponibles, con aviso visual y botón de envío deshabilitado
- [x] **[Feb 2026]** Fix: prop `holidays` en EditRequestModal

## Backlog
- [ ] Notificaciones por email al aprobar/rechazar
- [ ] Exportar reportes de vacaciones a Excel/PDF
- [ ] Vista calendario global del equipo
- [ ] Carga desde Excel/CSV
- [ ] Historial de evaluaciones
- [ ] Modularizar VacationsView.jsx (>2000 líneas)

---
*Última actualización: Feb 2026*
*Basado en: NOTAS JUGADORES.pdf, Evaluacion 360 WispaHub CSV, Pros-RH-20.png*
