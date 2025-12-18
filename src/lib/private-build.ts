/**
 * Private Build Configuration
 * 
 * When PRIVATE_BUILD=true, certain features are disabled:
 * - Telemetry is disabled
 * - Open-source notices are hidden
 * - Internal-only features are enabled
 * 
 * This is a configuration flag only - no runtime license checks.
 */

export function isPrivateBuild(): boolean {
  return process.env.PRIVATE_BUILD === "true";
}

export function shouldShowOpenSourceNotices(): boolean {
  return !isPrivateBuild();
}

export function shouldEnableTelemetry(): boolean {
  // Telemetry is disabled in private builds
  return !isPrivateBuild();
}

