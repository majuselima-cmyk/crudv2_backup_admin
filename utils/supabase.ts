/**
 * Supabase Utility Functions
 * Helper functions untuk CRUD operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generic CRUD Functions
 */
export const db = {
  /**
   * Get a single record by ID
   */
  async getById<T>(supabase: SupabaseClient, table: string, id: string | number) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as T
  },

  /**
   * Query with filters
   */
  async query<T>(
    supabase: SupabaseClient,
    table: string,
    filters?: Record<string, any>
  ) {
    let query = supabase.from(table).select('*')

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    const { data, error } = await query.single()

    if (error) throw error
    return data as T
  }
}


