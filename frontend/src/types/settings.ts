export interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  title: string
  department: string
  timezone: string
  language: string
}

export interface CompanySettings {
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  website: string
  description: string
  plan: 'trial' | 'professional' | 'enterprise'
  seats: number
}

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  newMatches: boolean
  projectUpdates: boolean
  applicationUpdates: boolean
  systemMaintenance: boolean
  weeklyReports: boolean
  monthlyReports: boolean
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: string
  passwordExpiry: string
  loginAttempts: string
}

export interface UserSettings {
  notifications: {
    email_new_applications: boolean
    email_status_updates: boolean
    email_weekly_report: boolean
    sms_urgent_updates: boolean
    email_new_matches?: boolean
    email_project_updates?: boolean
    email_application_updates?: boolean
    email_system_maintenance?: boolean
    email_monthly_report?: boolean
  }
  privacy: {
    show_profile: boolean
    allow_messages: boolean
  }
  display: {
    theme: 'light' | 'dark'
    language: string
    timezone: string
  }
}

export interface SettingsFormData {
  userProfile: UserProfile
  companySettings: CompanySettings
  notificationSettings: NotificationSettings
  securitySettings: SecuritySettings
}