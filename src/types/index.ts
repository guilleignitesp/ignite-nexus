// Tipos compartidos de la plataforma

export type Role = 'student' | 'worker' | 'admin'
export type Locale = 'es' | 'en' | 'ca'

export type SessionStatus = 'pending' | 'completed' | 'suspended' | 'holiday' | 'unknown' | 'excused'
export type TrafficLight = 'green' | 'yellow' | 'orange' | 'red'
export type AbsenceStatus = 'pending' | 'approved' | 'rejected'
export type TimesheetType = 'in' | 'out'
export type AssignmentType = 'permanent' | 'substitute'
export type HolderType = 'location' | 'worker'
export type PlanningProjectStatus = 'pending' | 'validated' | 'modified'

export type MaterialType = string // libre, gestionado por admin
