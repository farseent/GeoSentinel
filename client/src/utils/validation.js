// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters long`
    };
  }

  if (!hasUpperCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  if (!hasLowerCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  if (!hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }

  return {
    isValid: true,
    message: 'Password is valid'
  };
};

// Name validation
export const validateName = (name) => {
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'Name must be at least 2 characters long'
    };
  }

  if (trimmedName.length > 50) {
    return {
      isValid: false,
      message: 'Name must be less than 50 characters'
    };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    };
  }

  return {
    isValid: true,
    message: 'Name is valid'
  };
};

// Generic form field validation
export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    return {
      isValid: false,
      message: `${fieldName} is required`
    };
  }
  
  return {
    isValid: true,
    message: ''
  };
};

// Password confirmation validation
export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Passwords do not match'
    };
  }
  
  return {
    isValid: true,
    message: 'Passwords match'
  };
};