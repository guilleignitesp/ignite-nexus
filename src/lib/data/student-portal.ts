import { createClient } from '@/lib/supabase-server'

// XP thresholds for global/branch levels (scope='global' or 'branch' in level_thresholds table)
const LEVEL_THRESHOLDS: [number, number][] = [
  [1, 0],
  [2, 500],
  [3, 1200],
  [4, 2500],
  [5, 4500],
  [6, 7500],
  [7, 11500],
  [8, 17000],
  [9, 24000],
  [10, 33000],
]

const NIVEL_NAMES: Record<number, string> = {
  1: 'Explorador',
  2: 'Aprendiz',
  3: 'Aventurero',
  4: 'Especialista',
  5: 'Experto',
  6: 'Maestro',
  7: 'Campeón',
  8: 'Leyenda',
  9: 'Héroe',
  10: 'Igniter',
}

function calcLevel(xp: number): {
  level: number
  xpCurrent: number
  xpNext: number | null
  pct: number
} {
  let level = 1
  let xpCurrent = 0
  let xpNext: number | null = LEVEL_THRESHOLDS[1]?.[1] ?? null

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i][1]) {
      level = LEVEL_THRESHOLDS[i][0]
      xpCurrent = LEVEL_THRESHOLDS[i][1]
      xpNext = LEVEL_THRESHOLDS[i + 1]?.[1] ?? null
    } else {
      break
    }
  }

  const pct =
    xpNext === null
      ? 100
      : Math.min(100, Math.round(((xp - xpCurrent) / (xpNext - xpCurrent)) * 100))

  return { level, xpCurrent, xpNext, pct }
}

function localName(
  item: { name_es: string; name_en: string; name_ca: string },
  locale: string
): string {
  if (locale === 'en') return item.name_en
  if (locale === 'ca') return item.name_ca
  return item.name_es
}

// ─── Raw DB types ─────────────────────────────────────────────────────────────

type RawBranch = {
  code: string
  name_es: string
  name_en: string
  name_ca: string
  color: string
}

type RawSkillXP = {
  total_xp: number
  level: number
  skills: {
    id: string
    name_es: string
    name_en: string
    name_ca: string
    description: string | null
    branches: RawBranch | null
  } | null
}

type RawSkillEval = {
  xp_awarded: number
  skills: {
    name_es: string
    name_en: string
    name_ca: string
    branches: { code: string } | null
  } | null
}

type RawProjectEval = {
  id: string
  evaluated_at: string
  xp_multiplier_pct: number
  projects: {
    id: string
    name: string
    description: string | null
    material_type: string | null
  } | null
  skill_evaluations: RawSkillEval[]
}

type RawGroupEnrollment = {
  is_active: boolean
  groups: {
    name: string
    schools: { name: string } | null
  } | null
}

type RawStudent = {
  id: string
  first_name: string
  last_name: string
  group_enrollments: RawGroupEnrollment[]
  student_xp: RawSkillXP[]
  project_evaluations: RawProjectEval[]
}

type RawAttitudeLog = {
  id: string
  xp_awarded: number
  recorded_at: string
  attitude_actions: {
    name_es: string
    name_en: string
    name_ca: string
    xp_value: number
  } | null
}

type RawPlanningProjectLog = {
  id: string
  project_id: string | null
  status: string | null
  projects: {
    id: string
    name: string
    description: string | null
    material_type: string | null
    project_skills: {
      rank: number
      skills: {
        id: string
        name_es: string
        name_en: string
        name_ca: string
        base_xp: number
        branches: RawBranch | null
      } | null
    }[]
  } | null
}

type RawEnrollmentMision = {
  group_id: string
  groups: {
    plannings: {
      id: string
      is_active: boolean
      planning_project_log: RawPlanningProjectLog[]
    }[]
  } | null
}

type RawAttendanceSession = {
  session_id: string
  attended: boolean
  sessions: {
    project_id: string | null
    session_date: string
    planning_id: string | null
  } | null
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface StudentPortalData {
  studentId: string
  nombre: string
  apellido: string
  nivelGlobal: number
  nombreNivel: string
  xpTotal: number
  xpParaSiguienteNivel: number
  porcentajeNivel: number
  ramas: {
    [branchCode: string]: {
      nombre: string
      color: string
      lv: number
      xp: number
      progPct: number
      habilidades: {
        skillId: string
        nombre: string
        descripcion: string | null
        xp: number
        lv: number
      }[]
    }
  }
  proyectos: {
    id: string
    nombre: string
    descripcion: string | null
    materialType: string | null
    evaluadoEn: string
    fechaInicio: string | null
    fechaFin: string | null
    multiplicador: number
    habilidades: {
      nombre: string
      xpAward: number
      branchCode: string
    }[]
    xpTotal: number
  }[]
  actitud: {
    id: string
    nombre: string
    xp: number
    tipo: 'positiva' | 'negativa'
    fecha: string
  }[]
  grupo: string | null
  colegio: string | null
  misionActiva: {
    id: string
    nombre: string
    descripcion: string | null
    materialType: string | null
    habilidades: {
      nombre: string
      xpBase: number
      branchCode: string
      branchColor: string
    }[]
    xpMaximo: number
    fechaInicio: string | null
    sesionesContadas: number
  } | null
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function getStudentPortalData(
  studentId: string,
  locale: string
): Promise<StudentPortalData | null> {
  const supabase = await createClient()

  const [studentResult, logsResult, enrollmentResult, attendanceResult] = await Promise.all([
    supabase
      .from('students')
      .select(`
        id, first_name, last_name,
        group_enrollments(
          is_active,
          groups(name, schools(name))
        ),
        student_xp(
          total_xp, level,
          skills(id, name_es, name_en, name_ca, description, branches(code, name_es, name_en, name_ca, color))
        ),
        project_evaluations(
          id, evaluated_at, xp_multiplier_pct,
          projects(id, name, description, material_type),
          skill_evaluations(xp_awarded, skills(name_es, name_en, name_ca, branches(code)))
        )
      `)
      .eq('id', studentId)
      .single(),
    supabase
      .from('attitude_logs')
      .select('id, xp_awarded, recorded_at, attitude_actions(name_es, name_en, name_ca, xp_value)')
      .eq('student_id', studentId)
      .order('recorded_at', { ascending: false })
      .limit(50),
    supabase
      .from('group_enrollments')
      .select(`
        group_id,
        groups(
          plannings(
            id, is_active,
            planning_project_log(
              id, project_id, status,
              projects(
                id, name, description, material_type,
                project_skills(
                  rank,
                  skills(
                    id, name_es, name_en, name_ca, base_xp,
                    branches(code, name_es, name_en, name_ca, color)
                  )
                )
              )
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('session_attendances')
      .select('session_id, attended, sessions!inner(project_id, session_date, planning_id)')
      .eq('student_id', studentId)
      .eq('attended', true)
      .not('sessions.project_id', 'is', null),
  ])

  if (studentResult.error || !studentResult.data) return null

  const raw = studentResult.data as unknown as RawStudent
  const logs = (logsResult.data ?? []) as unknown as RawAttitudeLog[]

  // ── Global XP ──────────────────────────────────────────────────────────────
  const xpTotal = (raw.student_xp ?? []).reduce((sum, e) => sum + e.total_xp, 0)
  const { level: nivelGlobal, xpNext, pct: porcentajeNivel } = calcLevel(xpTotal)
  const nombreNivel = NIVEL_NAMES[nivelGlobal] ?? 'Explorador'
  const xpParaSiguienteNivel = xpNext !== null ? Math.max(0, xpNext - xpTotal) : 0

  // ── Ramas ──────────────────────────────────────────────────────────────────
  const ramaMap: StudentPortalData['ramas'] = {}

  for (const xpEntry of raw.student_xp ?? []) {
    const skill = xpEntry.skills
    const branch = skill?.branches
    if (!skill || !branch) continue

    const code = branch.code
    if (!ramaMap[code]) {
      ramaMap[code] = {
        nombre: localName(branch, locale),
        color: branch.color,
        lv: 0,
        xp: 0,
        progPct: 0,
        habilidades: [],
      }
    }

    ramaMap[code].xp += xpEntry.total_xp
    ramaMap[code].habilidades.push({
      skillId: skill.id,
      nombre: localName(skill, locale),
      descripcion: skill.description ?? null,
      xp: xpEntry.total_xp,
      lv: xpEntry.level,
    })
  }

  // Calculate branch level from branch XP and filter branches with no XP
  const ramas: StudentPortalData['ramas'] = {}
  for (const [code, rama] of Object.entries(ramaMap)) {
    if (rama.xp === 0) continue
    const { level, pct } = calcLevel(rama.xp)
    rama.lv = level
    rama.progPct = pct
    ramas[code] = rama
  }

  // ── Session dates map ──────────────────────────────────────────────────────
  const sessionAttendances = (attendanceResult.data ?? []) as unknown as RawAttendanceSession[]
  type SessionDatesEntry = { first: string; last: string; count: number }
  const sessionDatesMap = new Map<string, SessionDatesEntry>()

  for (const att of sessionAttendances) {
    const projectId = att.sessions?.project_id
    const sessionDate = att.sessions?.session_date
    if (!projectId || !sessionDate) continue
    const existing = sessionDatesMap.get(projectId)
    if (!existing) {
      sessionDatesMap.set(projectId, { first: sessionDate, last: sessionDate, count: 1 })
    } else {
      sessionDatesMap.set(projectId, {
        first: sessionDate < existing.first ? sessionDate : existing.first,
        last: sessionDate > existing.last ? sessionDate : existing.last,
        count: existing.count + 1,
      })
    }
  }

  // ── Proyectos ──────────────────────────────────────────────────────────────
  const proyectos = (raw.project_evaluations ?? [])
    .sort(
      (a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime()
    )
    .map((pe) => {
      const skillEvals = pe.skill_evaluations ?? []
      const evalXpTotal = skillEvals.reduce((sum, se) => sum + se.xp_awarded, 0)
      const projectId = pe.projects?.id ?? ''
      const sessionDates = sessionDatesMap.get(projectId)
      return {
        id: pe.id,
        nombre: pe.projects?.name ?? '—',
        descripcion: pe.projects?.description ?? null,
        materialType: pe.projects?.material_type ?? null,
        evaluadoEn: pe.evaluated_at,
        fechaInicio: sessionDates?.first ?? null,
        fechaFin: sessionDates?.last ?? null,
        multiplicador: pe.xp_multiplier_pct,
        habilidades: skillEvals.map((se) => ({
          nombre: localName(
            se.skills ?? { name_es: '—', name_en: '—', name_ca: '—' },
            locale
          ),
          xpAward: se.xp_awarded,
          branchCode: se.skills?.branches?.code ?? '',
        })),
        xpTotal: evalXpTotal,
      }
    })

  // ── Actitud ────────────────────────────────────────────────────────────────
  const actitud = logs.map((log) => ({
    id: log.id,
    nombre: localName(
      log.attitude_actions ?? { name_es: '—', name_en: '—', name_ca: '—' },
      locale
    ),
    xp: log.xp_awarded,
    tipo: (log.attitude_actions?.xp_value ?? 1) < 0
      ? ('negativa' as const)
      : ('positiva' as const),
    fecha: log.recorded_at,
  }))

  // ── Grupo activo ───────────────────────────────────────────────────────────
  const activeEnrollment = (raw.group_enrollments ?? []).find((e) => e.is_active)
  const grupo = activeEnrollment?.groups?.name ?? null
  const colegio = activeEnrollment?.groups?.schools?.name ?? null

  // ── Misión activa ──────────────────────────────────────────────────────────
  const evaluatedProjectIds = new Set(
    (raw.project_evaluations ?? [])
      .map((pe) => pe.projects?.id)
      .filter((id): id is string => id != null)
  )

  let misionActiva: StudentPortalData['misionActiva'] = null
  const rawEnrollment = enrollmentResult.data as unknown as RawEnrollmentMision | null

  if (rawEnrollment?.groups?.plannings) {
    const activePlanning = rawEnrollment.groups.plannings.find((p) => p.is_active)
    if (activePlanning) {
      const activeLog = (activePlanning.planning_project_log ?? []).find(
        (log) => log.status === 'pending' && log.project_id != null && !evaluatedProjectIds.has(log.project_id)
      )
      if (activeLog?.projects) {
        const proj = activeLog.projects
        const habilidades = (proj.project_skills ?? [])
          .filter((ps) => ps.skills != null)
          .map((ps) => ({
            nombre: localName(ps.skills!, locale),
            xpBase: ps.skills!.base_xp,
            branchCode: ps.skills!.branches?.code ?? '',
            branchColor: ps.skills!.branches?.color ?? '#7CB8F5',
          }))
        const activeSessionDates = activeLog.project_id ? sessionDatesMap.get(activeLog.project_id) : null
        misionActiva = {
          id: proj.id,
          nombre: proj.name,
          descripcion: proj.description ?? null,
          materialType: proj.material_type ?? null,
          habilidades,
          xpMaximo: habilidades.reduce((sum, h) => sum + h.xpBase, 0),
          fechaInicio: activeSessionDates?.first ?? null,
          sesionesContadas: activeSessionDates?.count ?? 0,
        }
      }
    }
  }

  return {
    studentId: raw.id,
    nombre: raw.first_name,
    apellido: raw.last_name,
    nivelGlobal,
    nombreNivel,
    xpTotal,
    xpParaSiguienteNivel,
    porcentajeNivel,
    ramas,
    proyectos,
    actitud,
    grupo,
    colegio,
    misionActiva,
  }
}
