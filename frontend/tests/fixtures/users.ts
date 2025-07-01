export interface TestUser {
  email: string;
  password: string;
  role: string;
  name: string;
  company?: string;
}

export const testUsers: Record<string, TestUser> = {
  superAdmin: {
    email: 'superadmin@test.com',
    password: 'SuperAdmin123!',
    role: 'super_admin',
    name: 'Super Admin'
  },
  companyAdmin: {
    email: 'admin@homeverse-test.com',
    password: 'Admin123!',
    role: 'company_admin',
    name: 'Company Admin',
    company: 'HomeVerse Test Company'
  },
  manager: {
    email: 'manager@homeverse-test.com',
    password: 'Manager123!',
    role: 'manager',
    name: 'Test Manager',
    company: 'HomeVerse Test Company'
  },
  staff: {
    email: 'staff@homeverse-test.com',
    password: 'Staff123!',
    role: 'staff',
    name: 'Test Staff',
    company: 'HomeVerse Test Company'
  },
  applicant: {
    email: 'applicant@test.com',
    password: 'Applicant123!',
    role: 'applicant',
    name: 'Test Applicant'
  },
  developer: {
    email: 'developer@test.com',
    password: 'password123',
    role: 'developer',
    name: 'Test Developer'
  },
  lender: {
    email: 'lender@test.com',
    password: 'password123',
    role: 'lender',
    name: 'Test Lender'
  },
  buyer: {
    email: 'buyer@test.com',
    password: 'password123',
    role: 'buyer',
    name: 'Test Buyer'
  }
};

export const testApplicant = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-0123',
  date_of_birth: '1990-01-01',
  ssn_last_four: '1234',
  annual_income: 50000,
  household_size: 3,
  has_dependents: true,
  employment_status: 'employed',
  employer_name: 'Acme Corp',
  years_employed: 5,
  credit_score_range: '700-750',
  previous_evictions: false,
  criminal_background: false,
  desired_location: 'San Francisco, CA',
  max_rent: 2000,
  move_in_date: '2024-03-01',
  preferred_bedroom_count: 2,
  accessibility_needs: false,
  has_pets: true,
  pet_details: '1 small dog',
  has_voucher: false,
  additional_notes: 'Looking for a quiet neighborhood'
};

export const testProject = {
  name: 'Green Valley Apartments',
  description: 'Modern affordable housing complex with eco-friendly features',
  address: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94105',
  total_units: 100,
  available_units: 25,
  ami_percentage: 80,
  min_income: 30000,
  max_income: 85000,
  bedroom_types: ['1BR', '2BR', '3BR'],
  amenities: ['Laundry', 'Parking', 'Gym', 'Community Room'],
  pet_policy: 'Cats and small dogs allowed',
  application_deadline: '2024-04-01',
  move_in_date: '2024-05-01',
  application_fee: 50,
  security_deposit: 1500,
  utilities_included: ['Water', 'Trash'],
  contact_email: 'leasing@greenvalley.com',
  contact_phone: '555-0100'
};