// Fix for auth and logout functionality

// 1. Update the loadProfile function in supabase-auth-provider.tsx to ensure profile is loaded with company_id:

const loadProfile = async (userId: string, forceReload: boolean = false) => {
  try {
    // First try to get the profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .single()
    
    if (profileError || !profileData?.company_id) {
      console.log('Profile missing or incomplete, fixing...')
      
      // Get or create default company
      const { data: defaultCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('key', 'default-company')
        .single()
      
      let companyId = defaultCompany?.id
      
      if (!companyId) {
        // Create default company
        const { data: newCompany } = await supabase
          .from('companies')
          .insert({
            name: 'Default Company',
            key: 'default-company',
            plan: 'trial',
            seats: 100
          })
          .select()
          .single()
        
        companyId = newCompany?.id
      }
      
      // Create or update profile
      if (!profileData) {
        // Get user metadata
        const { data: { user } } = await supabase.auth.getUser()
        
        // Create profile
        await supabase
          .from('profiles')
          .insert({
            id: userId,
            company_id: companyId,
            role: user?.user_metadata?.role || 'buyer',
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
          })
      } else {
        // Update existing profile with company_id
        await supabase
          .from('profiles')
          .update({ company_id: companyId })
          .eq('id', userId)
      }
      
      // Reload profile
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', userId)
        .single()
      
      console.log('Fixed profile:', updatedProfile)
      setProfile(updatedProfile)
      return updatedProfile
    }
    
    console.log('Loaded profile:', profileData)
    setProfile(profileData)
    return profileData
  } catch (error) {
    console.error('Error in loadProfile:', error)
    return null
  }
}

// 2. Fix the signOut function to properly clear state and redirect:

const signOut = async () => {
  try {
    // Clear local state first
    setUser(null)
    setProfile(null)
    setSession(null)
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Signout error:', error)
    }
    
    // Clear any persisted auth state
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.removeItem('supabase.auth.token')
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
    
    // Force redirect to login
    window.location.href = '/auth/login'
  } catch (error) {
    console.error('Error during signout:', error)
    // Force redirect even if there's an error
    window.location.href = '/auth/login'
  }
}

// 3. Add a refresh function after signin to ensure profile is loaded:

const signIn = async (email: string, password: string, redirectUrl?: string) => {
  console.log('SignIn called with:', email)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Supabase auth error:', error)
    throw error
  }

  if (data.user && data.session) {
    console.log('Login successful, loading profile...')
    
    // Ensure profile is loaded and has company_id
    await loadProfile(data.user.id, true)
    
    // Get the user's role for redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    
    // Redirect based on role
    const roleRedirects = {
      developer: '/dashboard',
      lender: '/dashboard/lenders',
      buyer: '/dashboard/buyers',
      applicant: '/dashboard',
      admin: '/dashboard'
    }
    
    const targetUrl = redirectUrl || roleRedirects[profile?.role] || '/dashboard'
    window.location.href = targetUrl
  }
}