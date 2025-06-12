// Test Supabase applicant creation directly
// Run this in the browser console while logged in

async function testApplicantCreation() {
    console.log('🧪 TESTING APPLICANT CREATION IN SUPABASE');
    
    // Get the Supabase client from the window (if available)
    const { supabase } = await import('/lib/supabase');
    
    // Check current session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session?.user?.email);
    
    if (!session) {
        console.error('❌ Not logged in! Please login first.');
        return;
    }
    
    // Create test applicant data
    const testApplicant = {
        first_name: 'Test',
        last_name: 'Applicant',
        email: `test.applicant.${Date.now()}@example.com`,
        phone: '555-0123',
        household_size: 3,
        income: 45000,
        ami_percent: 60,
        location_preference: 'Downtown',
        latitude: 40.7128,
        longitude: -74.0060,
        // Add required fields
        company_id: session.user.user_metadata?.company_id || null,
        user_id: session.user.id
    };
    
    console.log('Creating applicant:', testApplicant);
    
    try {
        // Insert directly into Supabase
        const { data, error } = await supabase
            .from('applicants')
            .insert([testApplicant])
            .select()
            .single();
            
        if (error) {
            console.error('❌ Error creating applicant:', error);
            return;
        }
        
        console.log('✅ Applicant created successfully!', data);
        
        // Now try to fetch it back
        const { data: fetchedData, error: fetchError } = await supabase
            .from('applicants')
            .select('*')
            .eq('id', data.id)
            .single();
            
        if (fetchError) {
            console.error('❌ Error fetching applicant:', fetchError);
        } else {
            console.log('✅ Fetched applicant:', fetchedData);
        }
        
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

// Instructions
console.log(`
📋 BROWSER CONSOLE TEST INSTRUCTIONS:
1. Make sure you're logged in at http://localhost:3000
2. Open DevTools Console (F12)
3. Copy and paste this entire script
4. Run: testApplicantCreation()
5. Check for errors

If you see RLS errors, it means Row Level Security is blocking the insert.
`);

// Make function available globally
window.testApplicantCreation = testApplicantCreation;