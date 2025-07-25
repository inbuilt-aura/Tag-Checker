import { create } from 'zustand'
import { supabase } from './supabase'
import { toast } from 'sonner'
import { validateCodesClientSide } from './client-validation'

export type PromoCode = {
  id: string
  batch_id: string
  code: string
  status: 'valid' | 'invalid' | 'pending'
  message: string | null
  timestamp: string
}

export type PromoBatch = {
  id: string
  user_id: string
  name: string | null
  created_at: string
}

type FilterStatus = 'all' | 'valid' | 'invalid' | 'pending'

interface PromoStore {
  user: any
  batches: PromoBatch[]
  codes: PromoCode[]
  currentBatch: PromoBatch | null
  filter: FilterStatus
  isValidating: boolean
  validationProgress: { current: number; total: number } | null
  
  // Actions
  setUser: (user: any) => void
  setBatches: (batches: PromoBatch[]) => void
  setCodes: (codes: PromoCode[]) => void
  setCurrentBatch: (batch: PromoBatch | null) => void
  setFilter: (filter: FilterStatus) => void
  setIsValidating: (isValidating: boolean) => void
  setValidationProgress: (progress: { current: number; total: number } | null) => void
  
  // Async actions
  fetchBatches: () => Promise<void>
  fetchCodes: (batchId: string) => Promise<void>
  createBatch: (name: string | null) => Promise<PromoBatch | null>
  addCodes: (batchId: string, codes: string[]) => Promise<void>
  validateCodes: (batchId: string) => Promise<void>
  deleteBatch: (batchId: string) => Promise<void>
  
  // Computed
  filteredCodes: () => PromoCode[]
}

export const usePromoStore = create<PromoStore>((set, get) => ({
  user: null,
  batches: [],
  codes: [],
  currentBatch: null,
  filter: 'all',
  isValidating: false,
  validationProgress: null,
  
  setUser: (user) => set({ user }),
  setBatches: (batches) => set({ batches }),
  setCodes: (codes) => set({ codes }),
  setCurrentBatch: (batch) => set({ currentBatch: batch }),
  setFilter: (filter) => set({ filter }),
  setIsValidating: (isValidating) => set({ isValidating }),
  setValidationProgress: (validationProgress) => set({ validationProgress }),
  
  fetchBatches: async () => {
    const { user } = get()
    if (!user) return
    
    const { data, error } = await supabase
      .from('promo_batches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      set({ batches: data })
    }
  },
  
  fetchCodes: async (batchId: string) => {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('batch_id', batchId)
      .order('timestamp', { ascending: false })
    
    if (!error && data) {
      set({ codes: data })
    }
  },
  
  createBatch: async (name: string | null) => {
    const { user } = get()
    if (!user) return null
    
    const { data, error } = await supabase
      .from('promo_batches')
      .insert({
        user_id: user.id,
        name: name || `Batch ${new Date().toLocaleDateString()}`
      })
      .select()
      .single()
    
    if (!error && data) {
      const { batches } = get()
      set({ batches: [data, ...batches], currentBatch: data })
      return data
    }
    return null
  },
  
  addCodes: async (batchId: string, codes: string[]) => {
    const codeInserts = codes.map(code => ({
      batch_id: batchId,
      code: code.trim(),
      status: 'pending' as const
    }))
    
    const { error } = await supabase
      .from('promo_codes')
      .insert(codeInserts)
    
    if (!error) {
      get().fetchCodes(batchId)
    }
  },
  
  validateCodes: async (batchId: string) => {
    console.log('=== STORE VALIDATE DEBUG (CLIENT-SIDE) ===')
    console.log('Validating batch ID:', batchId)
    set({ isValidating: true })
    
    const startTime = Date.now()
    
    try {
      // Get pending codes for this batch
      const { data: codes, error: fetchError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('batch_id', batchId)
        .eq('status', 'pending')
      
      if (fetchError) {
        console.error('Database error:', fetchError)
        toast.error('Failed to fetch codes from database')
        return
      }
      
      if (!codes || codes.length === 0) {
        console.log('No pending codes found')
        toast.info('No pending codes to validate')
        return
      }
      
      console.log(`Starting client-side validation of ${codes.length} codes`)
      
      // Use client-side validation (respects user's VPN)
      const results = await validateCodesClientSide(
        batchId, 
        codes,
        (current, total) => {
          console.log(`Progress: ${current}/${total}`)
          set({ validationProgress: { current, total } })
        }
      )
      
      // Refresh codes from database
      get().fetchCodes(batchId)
      
      // Calculate validation results for toast
      const duration = Math.round((Date.now() - startTime) / 1000)
      const validCount = results.filter(r => r.status === 'valid').length
      const invalidCount = results.filter(r => r.status === 'invalid').length
      
      toast.success(
        `Validation completed! ${validCount} valid, ${invalidCount} invalid codes processed in ${duration} seconds.`
      )
      
    } catch (error) {
      console.error('Client-side validation error:', error)
      toast.error('Validation encountered an error. Please check your connection and try again.')
    } finally {
      set({ isValidating: false, validationProgress: null })
    }
  },
  
  deleteBatch: async (batchId: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('promo_batches')
        .delete()
        .eq('id', batchId)
      
      if (error) throw error
      
      // Update local state
      const { batches, currentBatch, setCurrentBatch, setCodes } = get()
      const updatedBatches = batches.filter(batch => batch.id !== batchId)
      set({ batches: updatedBatches })
      
      // If deleted batch was current, clear current batch and codes
      if (currentBatch?.id === batchId) {
        setCurrentBatch(null)
        setCodes([])
      }
      
      toast.success('Batch deleted successfully!')
    } catch (error) {
      console.error('Error deleting batch:', error)
      toast.error('Failed to delete batch. Please try again.')
    }
  },
  
  filteredCodes: () => {
    const { codes, filter } = get()
    if (filter === 'all') return codes
    return codes.filter(code => code.status === filter)
  }
}))