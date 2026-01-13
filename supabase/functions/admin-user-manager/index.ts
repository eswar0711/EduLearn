// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 🟢 FIX: This tells VS Code to stop screaming about "Cannot find name Deno"
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🟢 FIX: Added ': Request' type
serve(async (req: Request) => {
  // Handle CORS (Cross-Origin Resource Sharing)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create the Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Authorization Check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Parse the Request
    const { action, payload } = await req.json()
    let result;

    // 4. Handle Actions
    if (action === 'create_user') {
      // --- CREATE LOGIC ---
      const { email, password, full_name, role } = payload
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      const userId = authData.user.id
      
      // 🟢 IMPROVEMENT: Default to 'student' if role is missing
      const userRole = role || 'student';

      // Insert into Public Tables
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({ id: userId, email, full_name, role: userRole, is_active: true, is_blocked: false })
      if (profileError) throw profileError

      const { error: usersError } = await supabaseAdmin
        .from('users')
        .insert({ id: userId, email, full_name, role: userRole, is_active: true, is_blocked: false, created_at: new Date().toISOString() })
      if (usersError) throw usersError

      result = { success: true, user: authData.user }

    } else if (action === 'delete_user') {
      // --- DELETE LOGIC ---
      const { userId } = payload

      // A. Delete from Public Tables First
      await supabaseAdmin.from('user_profiles').delete().eq('id', userId)
      await supabaseAdmin.from('users').delete().eq('id', userId)

      // B. Delete from Auth
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error
      
      result = { success: true, message: 'User deleted' }
    
    } else {
      throw new Error('Invalid action')
    }

    // 5. Return Success
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) { // 🟢 FIX: Added ': any' type
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})