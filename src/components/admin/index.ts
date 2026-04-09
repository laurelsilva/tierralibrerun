export { RegistrationStatusBadge } from './registration-status-badge'
export { UserDeleteAction } from './user-delete-action'
export { ApplicationDeleteAction } from './application-delete-action'
export { MentorApplicationDeleteAction } from './mentor-application-delete-action'
export { ApplicationDeleteWithRedirect } from './application-delete-with-redirect'
export { MentorApplicationDeleteWithRedirect } from './mentor-application-delete-with-redirect'
export { RaceDetailsDisplay } from './race-details-display'

export { AdminPageHeader } from './admin-page-header'
export { AdminDataTable } from './admin-data-table'
export { AdminStatsGrid } from './admin-stats'
export { ActivityLogSection } from './activity-log-section'
export { EmailLogs } from './email-logs'
export { default as EmailSender } from './email-sender'
export { WorkflowEventList } from './workflow-event-list'
export {
	FundAdminStatusBadge,
	WorkflowStageBadge,
} from './workflow-stage-badge'
export { WorkflowActionPanel } from './workflow-action-panel'

/**
 * Detects if the current admin session is in read-only mode.
 * Safe to call from client components only (checks DOM).
 */
export function isAdminReadOnlyClient(): boolean {
	if (typeof window === 'undefined' || typeof document === 'undefined')
		return false
	return !!document.querySelector('[data-admin-mode="readonly"]')
}
