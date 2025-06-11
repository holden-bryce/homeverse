// Debug script - Run this in browser console on the HomeVerse site

console.log('=== SUPABASE PROFILE DEBUG ===');

// Check Supabase client
if (typeof window.supabase !== 'undefined') {
  console.log('✅ Supabase client found');
} else {
  console.log('❌ Supabase client not found in window');
}

// Get current session
async function debugProfile() {
  try {
    // Try to access Supabase from React context
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseAnonKey);
    
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session);
    
    if (session?.user) {
      console.log('User ID:', session.user.id);
      console.log('User Email:', session.user.email);
      
      // Try to fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        
        // Check if it's RLS error
        if (profileError.code === 'PGRST116') {
          console.log('⚠️ No profile found - needs to be created');
        } else if (profileError.message?.includes('row-level security')) {
          console.log('⚠️ RLS policy issue - check Supabase dashboard');
        }
      } else {
        console.log('✅ Profile found:', profile);
      }
      
      // Check companies table access
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);
        
      if (companyError) {
        console.error('❌ Cannot access companies:', companyError);
      } else {
        console.log('✅ Can access companies table');
        if (companies.length > 0) {
          console.log('Default company:', companies[0]);
        }
      }
      
    } else {
      console.log('❌ No active session');
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

// Run the debug
debugProfile();

console.log('\n📝 To fix profile issues:');
console.log('1. Go to Supabase Dashboard');
console.log('2. Run the SQL from quick_frontend_fix.md');
console.log('3. Refresh this page');