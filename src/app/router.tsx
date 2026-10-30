import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Shell } from '../components/shell/Shell.tsx'
import { LoginPage } from '../features/auth/LoginPage.tsx'
import { PricingPage, SettingsPage } from '../features/admin/AdminPages.tsx'
import { BranchDetailPage, BranchListPage, CaseDetailPage, CaseListPage, MerchantDetailPage, MerchantListPage, NewMerchantPage, RecipientDetailPage, RecipientListPage, RiderDetailPage, RiderListPage, RolesPage, StaffDetailPage, StaffPage } from '../features/crm/CrmPages.tsx'
import { RoutingPage } from '../features/network/RoutingPages.tsx'
import { HomePage } from '../features/dashboard/HomePage.tsx'
import { AdjustmentsPage, AuditPage, CodPage, FinanceOverviewPage, HandoverPage, LedgerPage, SettlementDetailPage, SettlementListPage } from '../features/finance/FinancePages.tsx'
import { DispatchPage, FloorPage, ManifestDetailPage, ManifestListPage, ReceivePage, SortPage } from '../features/hub/HubPages.tsx'
import { DeliveriesPage, PickupsPage, ReturnsPage } from '../features/ops/OpsPages.tsx'
import { BookingPage, BookingsPage, FindPage, LabelPage, LabelsPage, ParcelDetailPage, ParcelListPage } from '../features/parcels/ParcelPages.tsx'

function CaseTypeRoute() {
  const { type = '' } = useParams()
  return <CaseListPage status="all" type={type} />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app/parcels/:trackingId/label" element={<LabelPage />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="find" element={<FindPage />} />
        <Route path="alerts" element={<FindPage />} />
        <Route path="branches/zones" element={<RoutingPage kind="dhaka_zone" />} />
        <Route path="branches/cities" element={<RoutingPage kind="outside_city" />} />
        <Route path="branches" element={<BranchListPage />} />
        <Route path="branches/hubs" element={<BranchListPage kind="hub" />} />
        <Route path="branches/sorting" element={<BranchListPage kind="sorting_center" />} />
        <Route path="branches/desks" element={<BranchListPage kind="sub_branch" />} />
        <Route path="branches/:code" element={<BranchDetailPage section="overview" />} />
        <Route path="branches/:code/parcels" element={<BranchDetailPage section="parcels" />} />
        <Route path="branches/:code/staff" element={<BranchDetailPage section="staff" />} />
        <Route path="branches/:code/riders" element={<BranchDetailPage section="riders" />} />
        <Route path="branches/:code/manifests" element={<BranchDetailPage section="manifests" />} />
        <Route path="branches/:code/cod" element={<BranchDetailPage section="cod" />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="staff/active" element={<StaffPage view="active" />} />
        <Route path="staff/inactive" element={<StaffPage view="inactive" />} />
        <Route path="staff/booking" element={<StaffPage view="booking" />} />
        <Route path="staff/hub" element={<StaffPage view="hub" />} />
        <Route path="staff/branch" element={<StaffPage view="branch" />} />
        <Route path="staff/roles" element={<RolesPage />} />
        <Route path="staff/:id" element={<StaffDetailPage />} />
        <Route path="merchants" element={<MerchantListPage />} />
        <Route path="merchants/new" element={<NewMerchantPage />} />
        <Route path="merchants/:code" element={<MerchantDetailPage />} />
        <Route path="riders" element={<RiderListPage />} />
        <Route path="riders/on-duty" element={<RiderListPage view="duty" />} />
        <Route path="riders/off-duty" element={<RiderListPage view="off" />} />
        <Route path="riders/leave" element={<RiderListPage view="leave" />} />
        <Route path="riders/cash" element={<RiderListPage view="cash" />} />
        <Route path="riders/:code" element={<RiderDetailPage />} />
        <Route path="recipients" element={<RecipientListPage />} />
        <Route path="recipients/repeat" element={<RecipientListPage view="repeat" />} />
        <Route path="recipients/failed" element={<RecipientListPage view="failed" />} />
        <Route path="recipients/:phone" element={<RecipientDetailPage />} />
        <Route path="cases/open" element={<CaseListPage status="open" />} />
        <Route path="cases/waiting" element={<CaseListPage status="waiting" />} />
        <Route path="cases/resolved" element={<CaseListPage status="resolved" />} />
        <Route path="cases/type/:type" element={<CaseTypeRoute />} />
        <Route path="cases/:caseNo" element={<CaseDetailPage />} />
        <Route path="parcels" element={<ParcelListPage />} />
        <Route path="parcels/network" element={<ParcelListPage view="network" />} />
        <Route path="parcels/delivered" element={<ParcelListPage view="delivered" />} />
        <Route path="parcels/cod" element={<ParcelListPage view="cod" />} />
        <Route path="parcels/inside" element={<ParcelListPage view="inside" />} />
        <Route path="parcels/sub" element={<ParcelListPage view="sub" />} />
        <Route path="parcels/outside" element={<ParcelListPage view="outside" />} />
        <Route path="parcels/new" element={<BookingPage listPath="/app/parcels" />} />
        <Route path="parcels/:trackingId" element={<ParcelDetailPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="bookings/week" element={<BookingsPage view="week" />} />
        <Route path="bookings/cod" element={<BookingsPage view="cod" />} />
        <Route path="bookings/unprinted" element={<BookingsPage view="unprinted" />} />
        <Route path="bookings/new" element={<BookingPage listPath="/app/bookings" />} />
        <Route path="labels" element={<LabelsPage />} />
        <Route path="labels/printed" element={<LabelsPage view="printed" />} />
        <Route path="labels/cod" element={<LabelsPage view="cod" />} />
        <Route path="pickups" element={<PickupsPage mode="unassigned" />} />
        <Route path="pickups/assigned" element={<PickupsPage mode="assigned" />} />
        <Route path="pickups/failed" element={<PickupsPage mode="failed" />} />
        <Route path="pickups/aging" element={<PickupsPage mode="aging" />} />
        <Route path="deliveries" element={<DeliveriesPage mode="out" />} />
        <Route path="deliveries/ready" element={<DeliveriesPage mode="ready" />} />
        <Route path="deliveries/failed" element={<DeliveriesPage mode="failed" />} />
        <Route path="deliveries/repeat" element={<DeliveriesPage mode="repeat" />} />
        <Route path="returns" element={<ReturnsPage stage="initiated" />} />
        <Route path="returns/returning" element={<ReturnsPage stage="returning" />} />
        <Route path="returns/returned" element={<ReturnsPage stage="returned" />} />
        <Route path="hub" element={<ReceivePage />} />
        <Route path="hub/floor" element={<FloorPage />} />
        <Route path="hub/sort" element={<SortPage />} />
        <Route path="hub/dispatch" element={<DispatchPage />} />
        <Route path="manifests" element={<ManifestListPage filter="all" />} />
        <Route path="manifests/transit" element={<ManifestListPage filter="in_transit" />} />
        <Route path="manifests/received" element={<ManifestListPage filter="received" />} />
        <Route path="manifests/discrepancy" element={<ManifestListPage filter="discrepancy" />} />
        <Route path="manifests/:manifestNo" element={<ManifestDetailPage />} />
        <Route path="finance" element={<FinanceOverviewPage />} />
        <Route path="finance/cod" element={<CodPage />} />
        <Route path="finance/cod/pending" element={<CodPage view="pending" />} />
        <Route path="finance/cod/short" element={<CodPage view="short" />} />
        <Route path="finance/cod/reconciled" element={<CodPage view="reconciled" />} />
        <Route path="finance/handovers" element={<HandoverPage />} />
        <Route path="finance/handovers/verified" element={<HandoverPage view="verified" />} />
        <Route path="finance/handovers/disputed" element={<HandoverPage view="disputed" />} />
        <Route path="finance/settlements" element={<SettlementListPage />} />
        <Route path="finance/settlements/drafts" element={<SettlementListPage view="draft" />} />
        <Route path="finance/settlements/pending" element={<SettlementListPage view="pending_approval" />} />
        <Route path="finance/settlements/approved" element={<SettlementListPage view="approved" />} />
        <Route path="finance/settlements/disbursed" element={<SettlementListPage view="disbursed" />} />
        <Route path="finance/settlements/:id" element={<SettlementDetailPage />} />
        <Route path="finance/ledger" element={<LedgerPage />} />
        <Route path="finance/adjustments" element={<AdjustmentsPage />} />
        <Route path="finance/audit" element={<AuditPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/audit" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
