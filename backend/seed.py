import asyncio
import os
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

# Add parent directory to path to import utils
sys.path.append(str(Path(__file__).parent))

from utils.auth import get_password_hash

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "evalpro_db")

async def seed_database():
    """Seed database with initial data"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🌱 Seeding database...")
    
    # Clear existing data
    print("Clearing existing data...")
    await db.users.delete_many({})
    await db.employees.delete_many({})
    await db.aciertos_desaciertos.delete_many({})
    await db.kpi_templates.delete_many({})
    await db.kpi_assignments.delete_many({})
    await db.kpi_evaluations.delete_many({})
    await db.eval360_templates.delete_many({})
    await db.evaluation_plans.delete_many({})
    await db.evaluation_results.delete_many({})
    await db.pdis.delete_many({})
    await db.empleado_a_plans.delete_many({})
    await db.empleado_a_autoevaluaciones.delete_many({})
    
    # Seed Employees FIRST (para referenciarlos en users)
    print("Creating employees...")
    employees = [
        {"id": "1", "name": "María García López", "position": "Tech Lead", "department": "Tecnología", "area": "Tecnología", "email": "maria@empresa.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria", "hireDate": "2018-03-15", "evaluations": {"superior": 90, "subordinados": 88, "companeros": 85, "cliente": 92}, "kpis_score": 88, "eval_360_score": 89, "category": "A", "created_at": datetime.now()},
        {"id": "2", "name": "Juan Rodríguez", "position": "Senior Developer", "department": "Desarrollo", "area": "Desarrollo", "email": "juan@empresa.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan", "hireDate": "2020-06-01", "evaluations": {"superior": 82, "subordinados": 80, "companeros": 78}, "kpis_score": 82, "eval_360_score": 80, "category": "B1", "created_at": datetime.now()},
        {"id": "3", "name": "Laura Sánchez", "position": "Sales Manager", "department": "Ventas", "area": "Ventas", "email": "laura@empresa.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura", "hireDate": "2017-09-10", "evaluations": {"superior": 75, "companeros": 80}, "kpis_score": 72, "eval_360_score": 77, "category": "B2", "created_at": datetime.now()},
        {"id": "4", "name": "Carlos Mendoza", "position": "Developer", "department": "Tecnología", "area": "Tecnología", "email": "carlos@empresa.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos", "hireDate": "2022-01-20", "evaluations": {"superior": 88, "companeros": 85}, "kpis_score": 85, "eval_360_score": 87, "category": "A", "created_at": datetime.now()},
        {"id": "5", "name": "Ana Martínez", "position": "Junior Developer", "department": "Tecnología", "area": "Tecnología", "email": "ana@empresa.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana", "hireDate": "2024-08-05", "evaluations": {"superior": 70, "companeros": 75}, "kpis_score": 68, "eval_360_score": 72, "category": "B2", "created_at": datetime.now()},
        {"id": "6", "name": "Roberto Fernández", "position": "Operations Manager", "department": "Operaciones", "area": "Operaciones", "email": "roberto@empresa.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto", "hireDate": "2019-11-12", "evaluations": {"superior": 78, "subordinados": 76}, "kpis_score": 80, "eval_360_score": 77, "category": "B1", "created_at": datetime.now()},
        {"id": "7", "name": "Patricia Ruiz", "position": "Sales Representative", "department": "Ventas", "area": "Ventas", "email": "patricia@empresa.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Patricia", "hireDate": "2023-04-18", "evaluations": {"superior": 65}, "kpis_score": 60, "eval_360_score": 65, "category": "C1", "created_at": datetime.now()},
        {"id": "8", "name": "Diego Morales", "position": "Product Manager", "department": "Producto", "area": "Producto", "email": "diego@empresa.com", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Diego", "hireDate": "2021-02-14", "evaluations": {"superior": 85, "companeros": 82}, "kpis_score": 84, "eval_360_score": 83, "category": "B1", "created_at": datetime.now()}
    ]
    await db.employees.insert_many(employees)
    print(f"✅ Created {len(employees)} employees")
    
    # Seed Users (vinculados a empleados reales)
    print("Creating users...")
    users = [
        {
            "id": "admin-1",
            "email": "admin@empresa.com",
            "name": "Admin Usuario",
            "hashed_password": get_password_hash("admin123"),
            "role": "admin",
            "employee_id": None,  # Admin no es empleado
            "department": "Administración",
            "position": "Administrador",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "1",  # Mismo ID que empleado
            "email": "maria@empresa.com",
            "name": "María García López",
            "hashed_password": get_password_hash("maria123"),
            "role": "admin",
            "employee_id": "1",
            "department": "Tecnología",
            "position": "Tech Lead",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "2",
            "email": "juan@empresa.com",
            "name": "Juan Rodríguez",
            "hashed_password": get_password_hash("juan123"),
            "role": "empleado",
            "employee_id": "2",
            "department": "Desarrollo",
            "position": "Senior Developer",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "3",
            "email": "laura@empresa.com",
            "name": "Laura Sánchez",
            "hashed_password": get_password_hash("laura123"),
            "role": "empleado",
            "employee_id": "3",
            "department": "Ventas",
            "position": "Sales Manager",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "4",
            "email": "carlos@empresa.com",
            "name": "Carlos Mendoza",
            "hashed_password": get_password_hash("carlos123"),
            "role": "empleado",
            "employee_id": "4",
            "department": "Tecnología",
            "position": "Developer",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "5",
            "email": "ana@empresa.com",
            "name": "Ana Martínez",
            "hashed_password": get_password_hash("ana123"),
            "role": "empleado",
            "employee_id": "5",
            "department": "Tecnología",
            "position": "Junior Developer",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
            "is_active": True,
            "created_at": datetime.now()
        },
        {
            "id": "6",
            "email": "roberto@empresa.com",
            "name": "Roberto Fernández",
            "hashed_password": get_password_hash("roberto123"),
            "role": "empleado",
            "employee_id": "6",
            "department": "Operaciones",
            "position": "Operations Manager",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto",
            "is_active": True,
            "created_at": datetime.now()
        }
    ]
    await db.users.insert_many(users)
    print(f"✅ Created {len(users)} users")
    
    # Seed Aciertos y Desaciertos
    print("Creating Aciertos y Desaciertos evaluations...")
    aciertos_data = [
        {"id": "ad-1", "evaluatorId": "1", "evaluatorName": "María García López", "evaluatedId": "4", "evaluatedName": "Carlos Mendoza", "department": "Tecnología", "date": "2024-03-15", "month": 3, "year": 2024, "quarter": "Q1 2024", "resultadoVsObjetivo": "Carlos ha mostrado un desempeño superior al esperado este trimestre. Logró completar el proyecto de migración de base de datos 2 semanas antes de lo planeado.", "aciertosColaborador": ["Excelente capacidad técnica", "Proactividad en identificación de bugs", "Mentoría efectiva", "Cumplimiento anticipado"], "desaciertosColaborador": ["Falta de comunicación sobre bloqueos", "Documentación incompleta", "Poca participación en reuniones"], "aciertosEmpresa": ["Provisión de herramientas adecuadas", "Flexibilidad en horarios", "Capacitación continua"], "desaciertosEmpresa": ["Falta de claridad en requisitos", "Cambios frecuentes de prioridades", "Proceso de aprobación lento"], "compromisos": [{"tipo": "colaborador", "compromiso": "Enviar reportes semanales", "fecha": "2024-04-01"}, {"tipo": "empresa", "compromiso": "Definir requisitos completos", "fecha": "2024-04-01"}], "created_at": datetime.now()},
        {"id": "ad-2", "evaluatorId": "director", "evaluatorName": "Director Comercial", "evaluatedId": "3", "evaluatedName": "Laura Sánchez", "department": "Ventas", "date": "2024-03-20", "month": 3, "year": 2024, "quarter": "Q1 2024", "resultadoVsObjetivo": "Laura alcanzó el 85% de su objetivo de ventas del trimestre.", "aciertosColaborador": ["Excelente relación con clientes", "Mejora progresiva", "Actitud positiva"], "desaciertosColaborador": ["Dificultad para cerrar ventas grandes", "Falta de seguimiento sistemático"], "aciertosEmpresa": ["Material de ventas de calidad", "Capacitación en producto"], "desaciertosEmpresa": ["Falta de CRM actualizado", "Proceso de descuentos lento"], "compromisos": [{"tipo": "colaborador", "compromiso": "Completar curso de negociación", "fecha": "2024-05-01"}, {"tipo": "empresa", "compromiso": "Implementar CRM Salesforce", "fecha": "2024-05-15"}], "created_at": datetime.now()},
        {"id": "ad-3", "evaluatorId": "techlead", "evaluatorName": "Tech Lead Senior", "evaluatedId": "2", "evaluatedName": "Juan Rodríguez", "department": "Desarrollo", "date": "2024-02-28", "month": 2, "year": 2024, "quarter": "Q1 2024", "resultadoVsObjetivo": "Juan cumplió con todos los objetivos técnicos del mes.", "aciertosColaborador": ["Código limpio", "Resolución rápida de bugs", "Ayuda proactiva", "Ownership completo"], "desaciertosColaborador": ["Over-engineering de soluciones", "Podría comunicar mejor decisiones"], "aciertosEmpresa": ["Stack moderno", "Buen ambiente", "Code review efectivo"], "desaciertosEmpresa": ["Falta de documentación arquitectónica", "Reuniones frecuentes"], "compromisos": [{"tipo": "colaborador", "compromiso": "Aplicar principio KISS", "fecha": "2024-03-15"}, {"tipo": "empresa", "compromiso": "Crear documentación arquitectónica", "fecha": "2024-04-01"}], "created_at": datetime.now()},
        {"id": "ad-4", "evaluatorId": "1", "evaluatorName": "María García López", "evaluatedId": "5", "evaluatedName": "Ana Martínez", "department": "Tecnología", "date": "2024-01-30", "month": 1, "year": 2024, "quarter": "Q1 2024", "resultadoVsObjetivo": "Ana está en su tercer mes. Ha mostrado rápida curva de aprendizaje.", "aciertosColaborador": ["Rápida adaptación", "Hace muchas preguntas", "Puntualidad"], "desaciertosColaborador": ["Falta de confianza", "Necesita práctica en debugging", "Tarda en pedir ayuda"], "aciertosEmpresa": ["Onboarding estructurado", "Mentor asignado"], "desaciertosEmpresa": ["Documentación desactualizada", "Falta de tiempo para pair programming"], "compromisos": [{"tipo": "colaborador", "compromiso": "Regla de 30 minutos para pedir ayuda", "fecha": "2024-02-01"}, {"tipo": "empresa", "compromiso": "Actualizar documentación", "fecha": "2024-02-28"}], "created_at": datetime.now()},
        {"id": "ad-5", "evaluatorId": "director", "evaluatorName": "Director Operaciones", "evaluatedId": "1", "evaluatedName": "María García López", "department": "Tecnología", "date": "2024-03-10", "month": 3, "year": 2024, "quarter": "Q1 2024", "resultadoVsObjetivo": "María superó objetivos del trimestre. El equipo entregó 3 proyectos sin incidentes.", "aciertosColaborador": ["Liderazgo efectivo", "Excelente planificación", "Desarrollo de talento", "Comunicación clara"], "desaciertosColaborador": ["Demasiado involucrada en tareas operativas", "Podría delegar más", "Muchas horas extra"], "aciertosEmpresa": ["Autonomía en decisiones", "Budget adecuado"], "desaciertosEmpresa": ["Falta de roadmap visible", "Expectativas 24/7"], "compromisos": [{"tipo": "colaborador", "compromiso": "Delegar tareas operativas", "fecha": "2024-04-01"}, {"tipo": "empresa", "compromiso": "Compartir roadmap trimestral", "fecha": "2024-04-15"}], "created_at": datetime.now()},
        {"id": "ad-6", "evaluatorId": "gerente", "evaluatorName": "Gerente RRHH", "evaluatedId": "6", "evaluatedName": "Roberto Fernández", "department": "Operaciones", "date": "2024-02-15", "month": 2, "year": 2024, "quarter": "Q1 2024", "resultadoVsObjetivo": "Roberto alcanzó el 92% de sus KPIs operativos.", "aciertosColaborador": ["Optimización de procesos", "Datos actualizados", "Iniciativa"], "desaciertosColaborador": ["Dificultad para dar feedback", "Falta de seguimiento", "Gestión de conflictos"], "aciertosEmpresa": ["Inversión en software", "Apoyo en mejoras"], "desaciertosEmpresa": ["Falta de capacitación en liderazgo", "Poco tiempo para desarrollo"], "compromisos": [{"tipo": "colaborador", "compromiso": "Taller de liderazgo", "fecha": "2024-03-30"}, {"tipo": "empresa", "compromiso": "Programa de mentoring", "fecha": "2024-03-15"}], "created_at": datetime.now()},
        {"id": "ad-7", "evaluatorId": "director", "evaluatorName": "Director Comercial", "evaluatedId": "7", "evaluatedName": "Patricia Ruiz", "department": "Ventas", "date": "2024-01-25", "month": 1, "year": 2024, "quarter": "Q1 2024", "resultadoVsObjetivo": "Patricia está teniendo dificultades (60% de meta).", "aciertosColaborador": ["Actitud positiva", "Esfuerzo evidente", "Gestión de pipeline"], "desaciertosColaborador": ["Falta de técnicas de cierre", "Dificultad con objeciones", "Conocimiento de producto", "Falta de seguimiento"], "aciertosEmpresa": ["Soporte disponible"], "desaciertosEmpresa": ["Onboarding insuficiente", "Falta de capacitación", "No hay shadowing"], "compromisos": [{"tipo": "colaborador", "compromiso": "Certificación de producto", "fecha": "2024-02-28"}, {"tipo": "empresa", "compromiso": "Asignar mentor senior", "fecha": "2024-02-01"}], "created_at": datetime.now()}
    ]
    await db.aciertos_desaciertos.insert_many(aciertos_data)
    print(f"✅ Created {len(aciertos_data)} Aciertos y Desaciertos evaluations")
    
    # Seed KPI Templates
    print("Creating KPI templates...")
    kpi_templates = [
        {
            "id": "kpi-template-1",
            "nombre": "KPIs Comerciales",
            "descripcion": "Para el área de ventas",
            "area": "ventas",
            "metricas": [
                {"id": "m1", "nombre": "Ventas mensuales", "descripcion": "Meta: 100000 $", "peso": 40, "umbralRojo": 60, "umbralAmarillo": 80, "umbralVerde": 100},
                {"id": "m2", "nombre": "Clientes nuevos", "descripcion": "Meta: 10 clientes", "peso": 30, "umbralRojo": 60, "umbralAmarillo": 80, "umbralVerde": 95},
                {"id": "m3", "nombre": "Retención", "descripcion": "Meta: 95 %", "peso": 30, "umbralRojo": 60, "umbralAmarillo": 80, "umbralVerde": 95}
            ],
            "created_at": datetime.now()
        },
        {
            "id": "kpi-template-2",
            "nombre": "KPIs Soporte",
            "descripcion": "Para el área de soporte técnico",
            "area": "soporte",
            "metricas": [
                {"id": "m1", "nombre": "Tickets resueltos", "descripcion": "Meta: 100 tickets", "peso": 40, "umbralRojo": 60, "umbralAmarillo": 80, "umbralVerde": 100},
                {"id": "m2", "nombre": "Tiempo promedio resolución", "descripcion": "Meta: 4 hrs", "peso": 35, "umbralRojo": 60, "umbralAmarillo": 80, "umbralVerde": 100},
                {"id": "m3", "nombre": "Satisfacción cliente", "descripcion": "Meta: 90 %", "peso": 25, "umbralRojo": 60, "umbralAmarillo": 80, "umbralVerde": 90}
            ],
            "created_at": datetime.now()
        }
    ]
    await db.kpi_templates.insert_many(kpi_templates)
    print(f"✅ Created {len(kpi_templates)} KPI templates")
    
    # Seed Evaluation 360 Templates
    print("Creating Evaluation 360 templates...")
    eval360_templates = [
        {
            "id": "eval360-template-1",
            "name": "Evaluación de Liderazgo",
            "description": "Para jefes y gerentes",
            "generalDescription": "Esta evaluación mide competencias de liderazgo",
            "isActive": True,
            "assignedPositions": ["Tech Lead", "Manager", "Director"],
            "competencies": [
                {
                    "id": "comp1",
                    "title": "Comunicación efectiva",
                    "behavior": "Se comunica de forma clara y oportuna",
                    "description": "Capacidad para transmitir información",
                    "responses": [
                        {"value": 1, "label": "Nunca", "description": "No cumple"},
                        {"value": 2, "label": "A veces", "description": "Cumple parcialmente"},
                        {"value": 3, "label": "Frecuentemente", "description": "Cumple"},
                        {"value": 4, "label": "Siempre", "description": "Supera expectativas"}
                    ]
                },
                {
                    "id": "comp2",
                    "title": "Toma de decisiones",
                    "behavior": "Toma decisiones informadas y oportunas",
                    "description": "Capacidad para decidir bajo presión",
                    "responses": [
                        {"value": 1, "label": "Nunca", "description": "No cumple"},
                        {"value": 2, "label": "A veces", "description": "Cumple parcialmente"},
                        {"value": 3, "label": "Frecuentemente", "description": "Cumple"},
                        {"value": 4, "label": "Siempre", "description": "Supera expectativas"}
                    ]
                }
            ],
            "created_at": datetime.now()
        },
        {
            "id": "eval360-template-2",
            "name": "Evaluación de Desempeño General",
            "description": "Para todos los empleados",
            "generalDescription": "Evaluación general de competencias",
            "isActive": True,
            "assignedPositions": ["Developer", "Designer", "Sales"],
            "competencies": [
                {
                    "id": "comp1",
                    "title": "Trabajo en equipo",
                    "behavior": "Colabora efectivamente con otros",
                    "description": "",
                    "responses": [
                        {"value": 1, "label": "Nunca", "description": "No cumple"},
                        {"value": 2, "label": "A veces", "description": "Cumple parcialmente"},
                        {"value": 3, "label": "Frecuentemente", "description": "Cumple"},
                        {"value": 4, "label": "Siempre", "description": "Supera expectativas"}
                    ]
                },
                {
                    "id": "comp2",
                    "title": "Orientación a resultados",
                    "behavior": "Cumple con objetivos establecidos",
                    "description": "",
                    "responses": [
                        {"value": 1, "label": "Nunca", "description": "No cumple"},
                        {"value": 2, "label": "A veces", "description": "Cumple parcialmente"},
                        {"value": 3, "label": "Frecuentemente", "description": "Cumple"},
                        {"value": 4, "label": "Siempre", "description": "Supera expectativas"}
                    ]
                }
            ],
            "created_at": datetime.now()
        }
    ]
    await db.eval360_templates.insert_many(eval360_templates)
    print(f"✅ Created {len(eval360_templates)} Evaluation 360 templates")
    
    # Seed PDIs
    print("Creating PDIs...")
    pdis = [
        {
            "id": "pdi-1",
            "employeeId": "1",
            "employeeName": "María García López",
            "department": "Tecnología",
            "leader": "Director Operaciones",
            "reviewer": "RRHH",
            "period": "2024",
            "quarters": [
                {
                    "quarter": "Q1",
                    "meta": "Mejorar habilidades de delegación",
                    "realidad": "Actualmente maneja demasiadas tareas operativas",
                    "aprendizajeFormal": "Curso de liderazgo avanzado",
                    "aprendizajeSocial": "Mentoring con otros líderes",
                    "aprendizajeAplicado": "Aplicar técnicas en proyectos reales",
                    "voluntad": "Alta",
                    "evaluaciones": "En progreso"
                },
                {
                    "quarter": "Q2",
                    "meta": "Desarrollar visión estratégica",
                    "realidad": "Foco actual en tácticas",
                    "aprendizajeFormal": "MBA módulo estrategia",
                    "aprendizajeSocial": "Sesiones con C-level",
                    "aprendizajeAplicado": "Crear roadmap anual",
                    "voluntad": "Alta",
                    "evaluaciones": "Pendiente"
                }
            ],
            "created_at": datetime.now()
        }
    ]
    await db.pdis.insert_many(pdis)
    print(f"✅ Created {len(pdis)} PDIs")
    
    # Seed Empleado A Evaluation Plans
    print("Creating Empleado A evaluation plans...")
    empleado_a_plans = [
        {
            "id": "plan-empleado-a-1",
            "employee_id": "1",
            "employee_name": "María García López",
            "employee_email": "maria@empresa.com",
            "employee_avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
            "period": "Q1 2024",
            "status": "activo",
            "evaluators": [
                {"id": "2", "name": "Juan Rodríguez", "email": "juan@empresa.com", "status": "completado"},
                {"id": "4", "name": "Carlos Mendoza", "email": "carlos@empresa.com", "status": "completado"},
                {"id": "5", "name": "Ana Martínez", "email": "ana@empresa.com", "status": "pendiente"}
            ],
            "votes": [
                {
                    "id": "vote-1",
                    "evaluator_id": "2",
                    "evaluator_name": "Juan Rodríguez",
                    "evaluator_email": "juan@empresa.com",
                    "evaluator_avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan",
                    "cuadrante": "A",
                    "valores_score": 90,
                    "resultados_score": 92,
                    "comentarios": "Excelente liderazgo y resultados consistentes",
                    "fecha_evaluacion": "2024-03-15 10:30:00",
                    "created_at": datetime.now()
                },
                {
                    "id": "vote-2",
                    "evaluator_id": "4",
                    "evaluator_name": "Carlos Mendoza",
                    "evaluator_email": "carlos@empresa.com",
                    "evaluator_avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
                    "cuadrante": "A",
                    "valores_score": 88,
                    "resultados_score": 90,
                    "comentarios": "Gran líder, siempre da resultados",
                    "fecha_evaluacion": "2024-03-16 14:20:00",
                    "created_at": datetime.now()
                }
            ],
            "total_evaluadores": 3,
            "evaluaciones_completadas": 2,
            "evaluaciones_pendientes": 1,
            "fecha_creacion": "2024-03-01",
            "fecha_limite": "2024-03-31",
            "created_at": datetime.now()
        },
        {
            "id": "plan-empleado-a-2",
            "employee_id": "4",
            "employee_name": "Carlos Mendoza",
            "employee_email": "carlos@empresa.com",
            "employee_avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
            "period": "Q1 2024",
            "status": "activo",
            "evaluators": [
                {"id": "1", "name": "María García López", "email": "maria@empresa.com", "status": "completado"},
                {"id": "2", "name": "Juan Rodríguez", "email": "juan@empresa.com", "status": "pendiente"}
            ],
            "votes": [
                {
                    "id": "vote-3",
                    "evaluator_id": "1",
                    "evaluator_name": "María García López",
                    "evaluator_email": "maria@empresa.com",
                    "evaluator_avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
                    "cuadrante": "B4",
                    "valores_score": 75,
                    "resultados_score": 88,
                    "comentarios": "Buenos resultados, necesita trabajar en valores de liderazgo",
                    "fecha_evaluacion": "2024-03-14 09:15:00",
                    "created_at": datetime.now()
                }
            ],
            "total_evaluadores": 2,
            "evaluaciones_completadas": 1,
            "evaluaciones_pendientes": 1,
            "fecha_creacion": "2024-03-01",
            "fecha_limite": "2024-03-31",
            "created_at": datetime.now()
        },
        {
            "id": "plan-empleado-a-3",
            "employee_id": "5",
            "employee_name": "Ana Martínez",
            "employee_email": "ana@empresa.com",
            "employee_avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
            "period": "Q1 2024",
            "status": "activo",
            "evaluators": [
                {"id": "1", "name": "María García López", "email": "maria@empresa.com", "status": "pendiente"},
                {"id": "2", "name": "Juan Rodríguez", "email": "juan@empresa.com", "status": "pendiente"},
                {"id": "4", "name": "Carlos Mendoza", "email": "carlos@empresa.com", "status": "pendiente"}
            ],
            "votes": [],
            "total_evaluadores": 3,
            "evaluaciones_completadas": 0,
            "evaluaciones_pendientes": 3,
            "fecha_creacion": "2024-03-01",
            "fecha_limite": "2024-03-31",
            "created_at": datetime.now()
        }
    ]
    await db.empleado_a_plans.insert_many(empleado_a_plans)
    print(f"✅ Created {len(empleado_a_plans)} Empleado A evaluation plans")
    
    # Seed Autoevaluaciones
    print("Creating autoevaluaciones...")
    autoevaluaciones = [
        {
            "id": "autoeval-1",
            "employee_id": "1",
            "employee_name": "María García López",
            "period": "Q1 2024",
            "cuadrante": "A",
            "valores_score": 90,
            "resultados_score": 88,
            "comentarios": "Autoevaluación - Empleado A",
            "fecha_evaluacion": "2024-03-10 10:00:00",
            "created_at": datetime.now()
        },
        {
            "id": "autoeval-2",
            "employee_id": "4",
            "employee_name": "Carlos Mendoza",
            "period": "Q1 2024",
            "cuadrante": "B1",
            "valores_score": 72,
            "resultados_score": 85,
            "comentarios": "Autoevaluación - Performer Sólido",
            "fecha_evaluacion": "2024-03-12 14:30:00",
            "created_at": datetime.now()
        }
    ]
    await db.empleado_a_autoevaluaciones.insert_many(autoevaluaciones)
    print(f"✅ Created {len(autoevaluaciones)} autoevaluaciones")

    # Seed Vacation Policies
    print("Creating vacation policies...")
    await db.vacation_policies.delete_many({})
    policies = [
        {"id": "pol-1", "name": "0 - 1 año", "yearsFrom": 0, "yearsTo": 1, "days": 12, "description": "Empleados con menos de 1 año de antigüedad", "createdAt": datetime.now()},
        {"id": "pol-2", "name": "1 - 3 años", "yearsFrom": 1, "yearsTo": 3, "days": 14, "description": "Empleados con 1 a 3 años de antigüedad", "createdAt": datetime.now()},
        {"id": "pol-3", "name": "3 - 5 años", "yearsFrom": 3, "yearsTo": 5, "days": 16, "description": "Empleados con 3 a 5 años de antigüedad", "createdAt": datetime.now()},
        {"id": "pol-4", "name": "5 - 10 años", "yearsFrom": 5, "yearsTo": 10, "days": 20, "description": "Empleados con 5 a 10 años de antigüedad", "createdAt": datetime.now()},
        {"id": "pol-5", "name": "10+ años", "yearsFrom": 10, "yearsTo": 999, "days": 25, "description": "Empleados senior con más de 10 años", "createdAt": datetime.now()},
    ]
    await db.vacation_policies.insert_many(policies)
    print(f"✅ Created {len(policies)} vacation policies")

    # Seed Vacation Holidays (festivos España + algunos comunes)
    print("Creating vacation holidays...")
    await db.vacation_holidays.delete_many({})
    cy = datetime.now().year
    holidays_seed = [
        {"id": "h1", "date": f"{cy}-01-01", "name": "Año Nuevo", "country": "ES", "recurring": True},
        {"id": "h2", "date": f"{cy}-01-06", "name": "Reyes", "country": "ES", "recurring": True},
        {"id": "h3", "date": f"{cy}-05-01", "name": "Día del Trabajo", "country": "ES", "recurring": True},
        {"id": "h4", "date": f"{cy}-08-15", "name": "Asunción de la Virgen", "country": "ES", "recurring": True},
        {"id": "h5", "date": f"{cy}-10-12", "name": "Fiesta Nacional", "country": "ES", "recurring": True},
        {"id": "h6", "date": f"{cy}-11-01", "name": "Todos los Santos", "country": "ES", "recurring": True},
        {"id": "h7", "date": f"{cy}-12-06", "name": "Día de la Constitución", "country": "ES", "recurring": True},
        {"id": "h8", "date": f"{cy}-12-08", "name": "Inmaculada Concepción", "country": "ES", "recurring": True},
        {"id": "h9", "date": f"{cy}-12-25", "name": "Navidad", "country": "ES", "recurring": True},
    ]
    await db.vacation_holidays.insert_many(holidays_seed)
    print(f"✅ Created {len(holidays_seed)} holidays")

    # Seed Vacation Balances + sample requests
    print("Creating vacation balances and requests...")
    await db.vacation_balances.delete_many({})
    await db.vacation_requests.delete_many({})

    from datetime import date as _date, timedelta as _td

    current_year = datetime.now().year

    # Helper local: calcular antigüedad en años y días según política
    def _seniority_years(hire_date_iso):
        if not hire_date_iso:
            return 0
        try:
            hd = datetime.strptime(hire_date_iso, "%Y-%m-%d").date()
            return (datetime.now().date() - hd).days / 365.25
        except Exception:
            return 0

    def _policy_days(years):
        for p in policies:
            if p["yearsFrom"] <= years < p["yearsTo"]:
                return p["days"]
        return 12

    # Helper local: count business days
    def _bizdays(s, e):
        n = 0
        cur = s
        while cur <= e:
            if cur.weekday() < 5:
                n += 1
            cur += _td(days=1)
        return n

    def _next_biz(d):
        cur = d + _td(days=1)
        while cur.weekday() >= 5:
            cur += _td(days=1)
        return cur

    balances = []
    for emp in employees:
        sen = _seniority_years(emp.get("hireDate"))
        days = _policy_days(sen)
        balances.append({
            "employeeId": emp["id"],
            "employeeName": emp["name"],
            "employeeAvatar": emp["avatar"],
            "employeeDepartment": emp["department"],
            "year": current_year,
            "totalDays": days,
            "daysUsed": 0,
            "daysPending": 0,
            "daysAvailable": days,
        })
    await db.vacation_balances.insert_many(balances)

    today = _date.today()
    sample_requests = []

    def _mk(emp_id, emp_name, emp_avatar, emp_dept, type_, start, end, status, reason, comment=None, days_offset_created=0):
        td = _bizdays(start, end)
        return {
            "id": f"vac-{emp_id}-{start.strftime('%m%d')}",
            "employeeId": emp_id,
            "employeeName": emp_name,
            "employeeAvatar": emp_avatar,
            "employeeDepartment": emp_dept,
            "type": type_,
            "startDate": start.strftime("%Y-%m-%d"),
            "endDate": end.strftime("%Y-%m-%d"),
            "returnDate": _next_biz(end).strftime("%Y-%m-%d"),
            "totalDays": td,
            "status": status,
            "reason": reason,
            "adminComment": comment,
            "attachmentUrl": None,
            "createdAt": datetime.now() - _td(days=days_offset_created),
            "reviewedAt": datetime.now() - _td(days=max(0, days_offset_created - 1)) if status != "Pendiente" else None,
            "reviewedBy": "María García López" if status != "Pendiente" else None,
        }

    # Juan - Aprobado pasado (este año)
    s = today + _td(days=15); e = s + _td(days=4)
    sample_requests.append(_mk("2", "Juan Rodríguez",
                               "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan",
                               "Desarrollo", "Vacaciones", s, e, "Aprobado",
                               "Vacaciones de verano con la familia", "Aprobado, disfruta!", 5))

    # Laura - Pendiente
    s = today + _td(days=20); e = s + _td(days=2)
    sample_requests.append(_mk("3", "Laura Sánchez",
                               "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura",
                               "Ventas", "Asuntos Propios", s, e, "Pendiente",
                               "Trámite personal", None, 1))

    # Carlos - Justificado (enfermedad)
    s = today + _td(days=2); e = s + _td(days=1)
    sample_requests.append(_mk("4", "Carlos Mendoza",
                               "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
                               "Tecnología", "Enfermedad", s, e, "Justificado",
                               "Reposo médico - gripe", "Comprobante recibido", 2))

    # Ana - Rechazado
    s = today + _td(days=10); e = s + _td(days=4)
    sample_requests.append(_mk("5", "Ana Martínez",
                               "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
                               "Tecnología", "Vacaciones", s, e, "Rechazado",
                               "Viaje", "Coincide con cierre de sprint, replantear fechas", 3))

    # Roberto - Pendiente compensatorio
    s = today + _td(days=8); e = s
    sample_requests.append(_mk("6", "Roberto Fernández",
                               "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto",
                               "Operaciones", "Compensatorio", s, e, "Pendiente",
                               "Día compensatorio por trabajo en feriado", None, 0))

    await db.vacation_requests.insert_many(sample_requests)

    # Recalcular balances
    for emp in employees:
        approved = [r for r in sample_requests if r["employeeId"] == emp["id"] and r["status"] == "Aprobado" and r["type"] in {"Vacaciones", "Asuntos Propios", "Compensatorio"}]
        pending = [r for r in sample_requests if r["employeeId"] == emp["id"] and r["status"] == "Pendiente" and r["type"] in {"Vacaciones", "Asuntos Propios", "Compensatorio"}]
        used = sum(r["totalDays"] for r in approved)
        pend = sum(r["totalDays"] for r in pending)
        sen = _seniority_years(emp.get("hireDate"))
        days = _policy_days(sen)
        await db.vacation_balances.update_one(
            {"employeeId": emp["id"], "year": current_year},
            {"$set": {"totalDays": days, "daysUsed": used, "daysPending": pend, "daysAvailable": max(days - used, 0)}}
        )
    print(f"✅ Created {len(balances)} vacation balances and {len(sample_requests)} requests")

    print("\n🎉 Database seeded successfully!")
    print("\n📝 Test Credentials:")
    print("   Admin: admin@empresa.com / admin123")
    print("   María (Admin): maria@empresa.com / maria123")
    print("   Juan (Empleado): juan@empresa.com / juan123")
    print("   Laura (Empleado): laura@empresa.com / laura123")
    print("   Carlos (Empleado): carlos@empresa.com / carlos123")
    print("   Ana (Empleado): ana@empresa.com / ana123")
    print("   Roberto (Empleado): roberto@empresa.com / roberto123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
