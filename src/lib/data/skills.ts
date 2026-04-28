import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export interface SkillItem {
  id: string
  branch_id: string
  name_es: string
  name_en: string
  name_ca: string
  description: string | null
  is_active: boolean
}

export interface BranchWithSkills {
  id: string
  code: string
  name_es: string
  name_en: string
  name_ca: string
  color: string
  skills: SkillItem[]
}

type RawSkill = {
  id: string
  branch_id: string
  name_es: string
  name_en: string
  name_ca: string
  description: string | null
  is_active: boolean
}

type RawBranch = {
  id: string
  code: string
  name_es: string
  name_en: string
  name_ca: string
  color: string
  skills: RawSkill[]
}

export const getBranchesWithSkills = unstable_cache(
  async (): Promise<BranchWithSkills[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from('branches')
      .select(
        'id, code, name_es, name_en, name_ca, color, skills(id, branch_id, name_es, name_en, name_ca, description, is_active)'
      )
      .order('code')
    if (error) throw new Error(error.message)

    return (data ?? []).map((branch: RawBranch) => ({
      id: branch.id,
      code: branch.code,
      name_es: branch.name_es,
      name_en: branch.name_en,
      name_ca: branch.name_ca,
      color: branch.color,
      skills: (branch.skills ?? []).sort((x, y) => {
        if (x.is_active !== y.is_active) return x.is_active ? -1 : 1
        return x.name_es.localeCompare(y.name_es)
      }),
    }))
  },
  ['skills'],
  { tags: ['skills'], revalidate: false }
)
