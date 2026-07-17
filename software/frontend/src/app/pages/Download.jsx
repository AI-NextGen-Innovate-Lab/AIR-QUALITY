import { Navigate, useLocation } from 'react-router-dom';

export default function Download() {
  const location = useLocation();
  return <Navigate to={`/user-dashboard?tab=export${location.search ? `&${location.search.slice(1)}` : ''}`} replace />;
}
