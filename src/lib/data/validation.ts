import { createClient } from '@/lib/supabase-server'

export interface ValidationItem {
  id: string
  planningId: string
  projectId: string
  projectName: string
  materialType: string | null
  assignedAt: string
  validatedAt: string | null
  status: 'pending' | 'validated' | 'modified'
  assignedById: string | null
  assignedByName: string
  validatedByName: string | null
  groupId: string
  groupName: string
  schoolId: string
  schoolName: string
}

export interface SessionEntry {
  id: string
  sessionDate: string
  status: string
  trafficLight: string | null
  teacherComment: string | null
  projectName: string | null
}

type RawValidationItem = {
  id: string
  assigned_at: string
  validated_at: string | null
  status: 'pending' | 'validated' | 'modified'
  plannings: {
    id: string
    groups: {
      id: string
      name: string
      schools: { id: string; name: string } | null
    } | null
  } | null
  projects: { id: string; name: string; material_type: string | null } | null
  assigner: { id: string; first_name: string; last_name: string } | null
  validator: { id: string; first_name: string; last_name: string } | null
}

export async function getValidationList(): Promise<ValidationItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('planning_project_log')
    .select(
      `id, assigned_at, validated_at, status,
      plannings!inner(id, groups!inner(id, name, schools!inner(id, name))),
      projects!inner(id, name, material_type),
      assigner:workers!assigned_by(id, first_name, last_name),
      validator:workers!validated_by(id, first_name, last_name)`
    )
    .order('assigned_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as RawValidationItem[]).map((r) => ({
    id: r.id,
    planningId: r.plannings?.id ?? '',
    projectId: r.projects?.id ?? '',
    projectName: r.projects?.name ?? '',
    materialType: r.projects?.material_type ?? null,
    assignedAt: r.assigned_at,
    validatedAt: r.validated_at,
    status: r.status,
    assignedById: r.assigner?.id ?? null,
    assignedByName: r.assigner
      ? `${r.assigner.first_name} ${r.assigner.last_name}`
      : '—',
    validatedByName: r.validator
      ? `${r.validator.first_name} ${r.validator.last_name}`
      : null,
    groupId: r.plannings?.groups?.id ?? '',
    groupName: r.plannings?.groups?.name ?? '',
    schoolId: r.plannings?.groups?.schools?.id ?? '',
    schoolName: r.plannings?.groups?.schools?.name ?? '',
  }))
}
