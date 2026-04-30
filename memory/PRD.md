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
- [x] Sub-pestañas: Solicitudes / Bolsa de días / Sugeridas / Políticas
- [x] Políticas por antigüedad + Festivos (admin)
- [x] Bolsa de días automática según antigüedad y políticas
- [x] Modal de edición admin con cálculo de saldo restante
- [x] Validación de bolsa en calendario con bloqueo de selección
- [x] Modal centrado "Nueva Solicitud" (no drawer lateral)
- [x] Tabla Solicitudes rediseñada (EMP-XXX, Periodos, Días, Fines Sem, Estado, Acciones con icono doc/approve/reject/edit/trash)
- [x] VacationDocument: formato oficial A4 imprimible con firmas (Empleado/Gerencia/Director)
- [x] Bolsa admin con colores según uso (verde→rojo)
- [x] Políticas como tarjetas con gradientes de madurez
- [x] Nueva bolsa con modal de advertencia (casos especiales)
- [x] **[Feb 2026]** Eliminadas KPI cards de Solicitudes
- [x] **[Feb 2026]** Sistema de notificaciones proactivas de renovación (urgente/próximo/cercano/lejano) basado en hireDate
- [x] **[Feb 2026]** Bolsa admin ordenada por proximidad de renovación + filtros por nivel + búsqueda
- [x] **[Feb 2026]** Barra semáforo de uso (verde → amarillo → naranja → rojo)
- [x] **[Feb 2026]** Alerta proactiva en vista empleado para renovación próxima
- [x] **[Feb 2026]** Nueva tab "Sugeridas" — CRUD de rangos predefinidos con color + calendario
- [x] **[Feb 2026]** Select "Vacaciones sugeridas" en modal de Nueva Solicitud que autopobla días

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
