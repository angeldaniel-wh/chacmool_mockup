#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Sistema web de evaluación de empleados (UI/UX mockups). Combina KPIs y Evaluaciones 360 para clasificar empleados en matriz 9-box personalizada (A, B1-B4, C1-C4). SOLO diseños visuales interactivos, sin backend/DB activo."

frontend:
  - task: "Título 'Empleado A' reemplaza 'Matriz 9-Box'"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Actualizado título de la vista matriz 9-box en líneas 534 y 1792. Ahora muestra 'Empleado A' en lugar de 'Matriz 9-Box'. Las categorías dentro de las celdas mantienen sus nombres correctos (Empleado A, Futuro A, etc.)"

  - task: "Porcentajes dentro de las celdas de la matriz 9-box"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Verificado en líneas 605-613. Los porcentajes de Valores y Resultados están dentro de cada celda en un recuadro semitransparente (V: XX-XX%, R: XX-XX%)"

  - task: "Vista Perfil+Resultados fusionada"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Implementado en líneas 747-960. Muestra categoría calculada vs autoevaluación lado a lado (líneas 815-840), con indicador de diferencia cuando no coinciden"

  - task: "UI para asignación de plantillas KPI"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Implementado en líneas 1430-1700. Incluye pestañas: Plantillas KPI, Asignar a Empleados (con selector y lista de empleados), Evaluar KPIs (con campos de entrada), y Comparativa"

  - task: "Contadores de evaluadores (nombres ocultos para empleados)"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Implementado en líneas 696-722 y 882-909. En modo Admin muestra nombres de evaluadores, en modo Empleado solo muestra contadores (X personas)"

  - task: "General Dashboard con matriz resumida"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Dashboard funcional con métricas y matriz resumida con título 'Empleado A'"

  - task: "Vista Evaluaciones 360° con plantillas"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Vista funcional en /evaluations con plantillas, enlaces públicos y funcionalidades completas"

backend:
  - task: "Módulo de Vacaciones y Ausencias - Backend API"
    implemented: true
    working: "NA"
    file: "/app/backend/routes/vacations.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implementado nuevo módulo HR. Endpoints: GET/POST /api/vacations (lista y creación con validación de fechas pasadas, startDate<=endDate, saldo suficiente, cálculo de totalDays excluyendo fines de semana, returnDate=siguiente día hábil). PATCH /api/vacations/{id}/status (admin: Aprobado/Rechazado/Justificado con comentario). DELETE /api/vacations/{id} (empleado puede cancelar pendientes propias). GET /api/vacations/balance/me, /balance/{employee_id}, /balances. PUT /api/vacations/balance/{id}/adjust. Justificado NO resta saldo, Aprobado SÍ resta (solo tipos Vacaciones/Asuntos Propios/Compensatorio). Lógica de auth: empleados solo ven y modifican lo suyo, admin/manager ve todo. Seed con 5 solicitudes de ejemplo y 8 balances."

  - task: "Backend FastAPI (INACTIVO)"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Backend existe pero no se utiliza. Usuario solo requiere mockups visuales en esta fase"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "Módulo de Vacaciones y Ausencias - Backend API"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Implementadas TODAS las correcciones del feedback del usuario (Mensaje 120). Cambios realizados: 1) Título 'Empleado A' reemplaza 'Matriz 9-Box' (NO reemplaza 'Jugador A' en categorías), 2) Porcentajes dentro de celdas 9-box, 3) Vista perfil+resultados fusionada con comparación de categoría calculada vs autoevaluación, 4) UI completa para asignación y evaluación de KPIs con pestañas, 5) Contadores de evaluadores con lógica Admin/Empleado. Frontend compila exitosamente. Screenshots preliminares muestran todo funcionando correctamente. Requiere testing completo de UI."
  - agent: "main"
    message: "FEATURE NUEVO: Módulo de Gestión de Vacaciones y Ausencias añadido. Backend en /app/backend/routes/vacations.py con CRUD, validaciones de fechas, cálculo de días laborables, balance por empleado. Frontend en /app/frontend/src/pages/VacationsView.jsx con KPI cards, tabla animada (framer-motion), drawer lateral para nuevas solicitudes y revisión admin, filtros por estado y nombre. Ruta /vacaciones, accesible para admin y empleado. Seed actualizado con 5 solicitudes ejemplo. Por favor probar SOLO los endpoints de /api/vacations: 1) Login admin (maria@empresa.com/maria123) y empleado (juan@empresa.com/juan123). 2) GET /api/vacations - admin ve todas, empleado ve solo las suyas. 3) POST /api/vacations - validar fechas pasadas, startDate>endDate, saldo insuficiente, totalDays calculado. 4) PATCH /api/vacations/{id}/status con Aprobado/Rechazado/Justificado y verificar que Aprobado resta del saldo y Justificado NO. 5) DELETE - empleado solo puede cancelar pendientes propias. 6) GET /api/vacations/balance/me y /balances."