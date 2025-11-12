import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'staff',
    office_id: '',
  });
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleCounts, setRoleCounts] = useState({
    admin: 0,
    supply_officer: 0,
    staff: 0
  });
  const { register, user } = useAuth();
  const navigate = useNavigate();

  // Fetch offices for dropdown
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await fetch('/api/offices');
        const data = await response.json();
        setOffices(data.data || []);
      } catch (error) {
        console.error('Error fetching offices:', error);
      }
    };
    fetchOffices();
  }, []);

  // Fetch existing user counts by role
  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        const response = await fetch('/api/users/role-counts');
        const data = await response.json();
        setRoleCounts(data);
      } catch (error) {
        console.error('Error fetching user counts:', error);
      }
    };
    fetchUserCounts();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (formData.password !== formData.password_confirmation) {
    alert('Passwords do not match');
    return;
  }

  // Double-check role availability before submitting
  if (!isRoleAvailable(formData.role)) {
    alert(`A ${getRoleLabel(formData.role)} already exists. Only one ${getRoleLabel(formData.role)} is allowed.`);
    return;
  }

  setLoading(true);

  const result = await register(formData);
  
  if (!result.success) {
    // Handle validation errors from backend
    if (result.errors && result.errors.role) {
      alert(result.errors.role[0]); // Show the specific role error
    } else {
      alert(result.error || 'Registration failed');
    }
  } else {
    alert('Registration successful! Please login with your credentials.');
    navigate('/login');
  }

  setLoading(false);
};

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: 'Administrator',
      supply_officer: 'Supply Officer',
      staff: 'Staff Member'
    };
    return roleLabels[role] || role;
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      admin: 'Full system access',
      supply_officer: 'Manages inventory and approvals',
      staff: 'Basic system access for daily operations'
    };
    return descriptions[role] || '';
  };

  // Check if role is available
  const isRoleAvailable = (role) => {
    if (role === 'admin') {
      return roleCounts.admin === 0;
    }
    if (role === 'supply_officer') {
      return roleCounts.supply_officer === 0;
    }
    return true; // Staff role is always available
  };

  // Get available roles for dropdown
  const availableRoles = [
    { value: 'staff', label: 'Staff Member', available: true },
    { value: 'supply_officer', label: 'Supply Officer', available: isRoleAvailable('supply_officer') },
    { value: 'admin', label: 'Administrator', available: isRoleAvailable('admin') }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              sign in to your existing account
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={formData.role}
                onChange={handleChange}
              >
                {availableRoles.map((role) => (
                  <option 
                    key={role.value} 
                    value={role.value}
                    disabled={!role.available}
                  >
                    {role.label} {!role.available ? '(Already exists)' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {getRoleLabel(formData.role)} - {getRoleDescription(formData.role)}
                {!isRoleAvailable(formData.role) && (
                  <span className="text-red-500 font-medium"> - This role already exists and cannot be assigned again</span>
                )}
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength="8"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password (min. 8 characters)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                required
                minLength="8"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your password"
                value={formData.password_confirmation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isRoleAvailable(formData.role)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;