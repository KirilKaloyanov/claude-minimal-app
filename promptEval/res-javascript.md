
/**
 * Validates if a given string is a valid GCP service account email
 * Format: SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com
 * 
 * @param {string} email - The email string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidGCPServiceAccountEmail(email) {
  // Check if email is a string
  if (typeof email !== 'string') {
    return false;
  }

  // Regular expression to match GCP service account email format
  // SERVICE_ACCOUNT: alphanumeric, hyphens, can contain dots (but not at start/end)
  // PROJECT_ID: lowercase letters, digits, and hyphens (6-30 chars, must start with letter)
  const gcpServiceAccountRegex = /^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?@[a-z]([a-z0-9\-]{4,28}[a-z0-9])\.iam\.gserviceaccount\.com$/;

  return gcpServiceAccountRegex.test(email);
}

// Alternative implementation with more detailed validation
function isValidGCPServiceAccountEmailDetailed(email) {
  // Check if email is a string
  if (typeof email !== 'string' || !email) {
    return false;
  }

  // Split by @ to separate service account name and domain
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [serviceAccount, domain] = parts;

  // Validate service account name
  // Must start and end with alphanumeric, can contain hyphens and dots
  if (!serviceAccount || serviceAccount.length === 0) {
    return false;
  }
  
  if (!/^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$/.test(serviceAccount)) {
    return false;
  }

  // Validate domain format: PROJECT_ID.iam.gserviceaccount.com
  const domainParts = domain.split('.');
  if (domainParts.length !== 4) {
    return false;
  }

  const [projectId, iam, gserviceaccount, com] = domainParts;

  // Validate project ID
  // Must be 6-30 characters, start with lowercase letter, contain only lowercase letters, digits, and hyphens
  if (!projectId || projectId.length < 6 || projectId.length > 30) {
    return false;
  }

  if (!/^[a-z][a-z0-9\-]*[a-z0-9]$/.test(projectId)) {
    return false;
  }

  // Validate fixed parts of domain
  if (iam !== 'iam' || gserviceaccount !== 'gserviceaccount' || com !== 'com') {
    return false;
  }

  return true;
}

// Test cases
console.log(isValidGCPServiceAccountEmail('my-service-account@my-project-123.iam.gserviceaccount.com')); // true
console.log(isValidGCPServiceAccountEmail('service123@project-id-456.iam.gserviceaccount.com')); // true
console.log(isValidGCPServiceAccountEmail('invalid@project.com')); // false
console.log(isValidGCPServiceAccountEmail('test@.iam.gserviceaccount.com')); // false
console.log(isValidGCPServiceAccountEmail('test@abc.iam.gserviceaccount.com')); // false (project ID too short)
console.log(isValidGCPServiceAccountEmail('')); // false
console.log(isValidGCPServiceAccountEmail(null)); // false
console.log(isValidGCPServiceAccountEmail('no-at-sign.iam.gserviceaccount.com')); // false
console.log(isValidGCPServiceAccountEmail('test@Project-ID.iam.g