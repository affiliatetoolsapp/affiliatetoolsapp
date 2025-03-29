// Get the base URL for postbacks based on environment
export const getPostbackBaseUrl = () => {
  // Check if we're in the browser
  const isBrowser = typeof window !== 'undefined';
  
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_POSTBACK_URL) {
    return process.env.NEXT_PUBLIC_POSTBACK_URL;
  }
  
  // If in browser, use current domain
  if (isBrowser) {
    return `${window.location.origin}/api/postbacks`;
  }
  
  // Default fallback for server-side rendering
  return '/api/postbacks';
};

// Generate a postback URL with parameters
export const generatePostbackUrl = (type: 'conversion' | 'lead' | 'sale', params: Record<string, string> = {}) => {
  const baseUrl = getPostbackBaseUrl();
  const queryParams = new URLSearchParams();
  
  // Always add click_id as required parameter
  queryParams.append('click_id', '{click_id}');
  
  // Add type parameter
  queryParams.append('type', type);
  
  // Add any additional parameters
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, value);
  });
  
  return `${baseUrl}?${queryParams.toString()}`;
};

// Get example postback URLs for documentation
export const getExamplePostbacks = () => {
  const baseUrl = getPostbackBaseUrl();
  return {
    lead: `${baseUrl}?click_id=abc123&type=lead&payout=5`,
    leadNumeric: `${baseUrl}?click_id=abc123&type=1&payout=5`,
    sale: `${baseUrl}?click_id=abc123&type=sale&payout=25`
  };
}; 