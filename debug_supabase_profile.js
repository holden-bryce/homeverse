// Run this in the browser console on https://homeverse-frontend.onrender.com

console.log('=== DEBUGGING SUPABASE PROFILE ===');

// Get the Supabase client from the window
async function debugSupabase() {
  try {
    // Check if we have a session
    const sessionResponse = await fetch('https://vzxadsifonqklotzhdpl.supabase.co/auth/v1/user', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDQ0NTAsImV4cCI6MjA2NTA4MDQ1MH0.ZY31NHg6qamLBVeHT5Lo-ud0K_ayPh8DRamK5AUJ6t4',
        'Authorization': 'Bearer ' + (localStorage.getItem('sb-vzxadsifonqklotzhdpl-auth-token') ? JSON.parse(localStorage.getItem('sb-vzxadsifonqklotzhdpl-auth-token')).access_token : 'no-token')
      }
    });
    
    if (sessionResponse.ok) {
      const user = await sessionResponse.json();
      console.log('✅ User authenticated:', user);
      console.log('User ID:', user.id);
      
      // Now check the profile
      const profileResponse = await fetch(`https://vzxadsifonqklotzhdpl.supabase.co/rest/v1/profiles?id=eq.${user.id}&select=*,companies(*)`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDQ0NTAsImV4cCI6MjA2NTA4MDQ1MH0.ZY31NHg6qamLBVeHT5Lo-ud0K_ayPh8DRamK5AUJ6t4',
          'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('sb-vzxadsifonqklotzhdpl-auth-token')).access_token
        }
      });
      
      if (profileResponse.ok) {
        const profiles = await profileResponse.json();
        if (profiles.length > 0) {
          console.log('✅ Profile found:', profiles[0]);
          console.log('Company:', profiles[0].companies);
          console.log('Role:', profiles[0].role);
        } else {
          console.log('❌ No profile found for user');
          console.log('Run this SQL in Supabase to create profile:');
          console.log(`
INSERT INTO profiles (id, full_name, role, company_id)
VALUES (
  '${user.id}',
  '${user.email}',
  'admin',
  (SELECT id FROM companies WHERE key = 'default-company' LIMIT 1)
);`);
        }
      } else {
        console.error('❌ Failed to fetch profile:', await profileResponse.text());
      }
    } else {
      console.log('❌ Not authenticated');
    }
    
    // Check localStorage
    console.log('\n📦 LocalStorage Auth Data:');
    Object.keys(localStorage).filter(k => k.includes('supabase')).forEach(key => {
      console.log(key, ':', localStorage.getItem(key)?.substring(0, 50) + '...');
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugSupabase();

// Also check React state
console.log('\n🔍 Checking React State...');
console.log('Look for profile in React DevTools under SupabaseAuthProvider');