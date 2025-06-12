-- Performance Optimization: Database Views and Indexes
-- Run this in Supabase SQL Editor

-- Create materialized view for user statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_statistics_view AS
SELECT 
  p.id as user_id,
  p.company_id,
  p.role,
  COUNT(DISTINCT a.id) as total_applicants,
  COUNT(DISTINCT pr.id) as total_projects,
  COUNT(DISTINCT m.id) as total_matches,
  COALESCE(AVG(m.score), 0) as avg_match_score,
  JSON_BUILD_OBJECT(
    'pending', COUNT(a.id) FILTER (WHERE a.status = 'pending'),
    'approved', COUNT(a.id) FILTER (WHERE a.status = 'approved'),
    'rejected', COUNT(a.id) FILTER (WHERE a.status = 'rejected')
  ) as application_stats,
  JSON_BUILD_OBJECT(
    'total', COUNT(DISTINCT pr.id),
    'active', COUNT(DISTINCT pr.id) FILTER (WHERE pr.status = 'active'),
    'planning', COUNT(DISTINCT pr.id) FILTER (WHERE pr.status = 'planning'),
    'completed', COUNT(DISTINCT pr.id) FILTER (WHERE pr.status = 'completed')
  ) as project_stats
FROM 
  profiles p
  LEFT JOIN applicants a ON a.user_id = p.id AND a.company_id = p.company_id
  LEFT JOIN projects pr ON pr.user_id = p.id AND pr.company_id = p.company_id
  LEFT JOIN matches m ON m.applicant_id = a.id
GROUP BY p.id, p.company_id, p.role;

-- Create indexes for the view
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_statistics_view(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_company_id ON user_statistics_view(company_id);

-- Create company statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS company_statistics_view AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT a.id) as total_applicants,
  COUNT(DISTINCT pr.id) as total_projects,
  COUNT(DISTINCT m.id) as total_matches,
  JSON_BUILD_OBJECT(
    'admin', COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'admin'),
    'developer', COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'developer'),
    'lender', COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'lender'),
    'buyer', COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'buyer'),
    'applicant', COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'applicant')
  ) as users_by_role,
  JSON_BUILD_OBJECT(
    'pending', COUNT(a.id) FILTER (WHERE a.status = 'pending'),
    'approved', COUNT(a.id) FILTER (WHERE a.status = 'approved'),
    'rejected', COUNT(a.id) FILTER (WHERE a.status = 'rejected')
  ) as applicants_by_status,
  COALESCE(AVG(m.score), 0) as avg_match_score
FROM 
  companies c
  LEFT JOIN profiles p ON p.company_id = c.id
  LEFT JOIN applicants a ON a.company_id = c.id
  LEFT JOIN projects pr ON pr.company_id = c.id
  LEFT JOIN matches m ON m.applicant_id = a.id
GROUP BY c.id, c.name;

-- Create index for company stats
CREATE INDEX IF NOT EXISTS idx_company_stats_id ON company_statistics_view(company_id);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_statistics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_statistics_view;
  REFRESH MATERIALIZED VIEW CONCURRENTLY company_statistics_view;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to refresh views every hour (requires pg_cron extension)
-- Note: pg_cron must be enabled in Supabase dashboard
-- SELECT cron.schedule('refresh-stats', '0 * * * *', 'SELECT refresh_statistics_views();');

-- Create additional performance indexes
CREATE INDEX IF NOT EXISTS idx_applicants_company_created 
  ON applicants(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_company_created 
  ON projects(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_score 
  ON matches(score DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, read, created_at DESC);

-- Create a function for fast applicant search
CREATE OR REPLACE FUNCTION search_applicants(
  search_term TEXT,
  company_id_param UUID
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.first_name,
    a.last_name,
    a.email,
    a.phone,
    a.status,
    ts_rank(
      to_tsvector('english', 
        COALESCE(a.first_name, '') || ' ' || 
        COALESCE(a.last_name, '') || ' ' || 
        COALESCE(a.email, '')
      ),
      plainto_tsquery('english', search_term)
    ) as score
  FROM applicants a
  WHERE 
    a.company_id = company_id_param
    AND to_tsvector('english', 
      COALESCE(a.first_name, '') || ' ' || 
      COALESCE(a.last_name, '') || ' ' || 
      COALESCE(a.email, '')
    ) @@ plainto_tsquery('english', search_term)
  ORDER BY score DESC, a.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON user_statistics_view TO authenticated;
GRANT SELECT ON company_statistics_view TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_statistics_views() TO authenticated;
GRANT EXECUTE ON FUNCTION search_applicants(TEXT, UUID) TO authenticated;