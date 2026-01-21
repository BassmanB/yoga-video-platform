/**
 * Environment variables validation
 *
 * Checks if required environment variables are set and provides helpful error messages
 */

export function checkEnvVariables() {
  const requiredVars = {
    PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  };

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error("\n📖 Please create a .env file in the project root.");
    console.error("📖 See ENV_SETUP.md for detailed instructions.\n");
    return false;
  }

  return true;
}
