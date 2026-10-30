import { daysAgo, takaToPoisha, todayDhaka } from '../lib/money.ts'
import { defaultRoutes } from '../lib/routing.ts'
import { quote } from '../lib/pricing.ts'
import type {
  AuditLog,
  Branch,
  CaseItem,
  CodCollection,
  DemoData,
  Handover,
  LedgerEntry,
  Manifest,
  Merchant,
  Parcel,
  ParcelStatus,
  RateCard,
  Rider,
  ServiceType,
  Settlement,
  User,
  Zone,
} from './types.ts'

export const RATE: RateCard = {
  insideBase: takaToPoisha(60),
  insideExtra: takaToPoisha(15),
  subBase: takaToPoisha(80),
  subExtra: takaToPoisha(20),
  outBase: takaToPoisha(120),
  outExtra: takaToPoisha(30),
  deliveryPercent: 1,
  damageControl: takaToPoisha(1),
  codPercent: 1,
  minCodInside: takaToPoisha(10),
  minCodSub: takaToPoisha(10),
  minCodOut: takaToPoisha(15),
  returnInside: takaToPoisha(40),
  returnSub: takaToPoisha(50),
  returnOut: takaToPoisha(80),
}

const branches: Branch[] = [
  { id: 'b-mir', name: 'Mirpur Hub', code: 'DHK-MIR', type: 'hub', network: 'inside_dhaka', district: 'Dhaka', phone: '01710001101', street: 'Mirpur 10', isActive: true },
  { id: 'b-utt', name: 'Uttara Sorting', code: 'DHK-UTT', type: 'sorting_center', network: 'inside_dhaka', district: 'Dhaka', phone: '01710001102', street: 'Uttara Sector 7', isActive: true },
  { id: 'b-gul', name: 'Gulshan Desk', code: 'DHK-GUL', type: 'sub_branch', network: 'inside_dhaka', district: 'Dhaka', phone: '01710001103', street: 'Gulshan 2', isActive: true },
  { id: 'b-dhn', name: 'Dhanmondi Desk', code: 'DHK-DHN', type: 'sub_branch', network: 'inside_dhaka', district: 'Dhaka', phone: '01710001111', street: 'Road 27', isActive: true },
  { id: 'b-gaz', name: 'Gazipur Hub', code: 'GAZ-HUB', type: 'hub', network: 'outside_dhaka', district: 'Gazipur', phone: '01710001113', street: 'Tongi Station Road', isActive: true },
  { id: 'b-nar', name: 'Narayanganj Hub', code: 'NAR-HUB', type: 'hub', network: 'outside_dhaka', district: 'Narayanganj', phone: '01710001114', street: 'Fatullah', isActive: true },
  { id: 'b-ctg', name: 'Chattogram Hub', code: 'CTG-HUB', type: 'hub', network: 'outside_dhaka', district: 'Chattogram', phone: '01810001104', street: 'Agrabad', isActive: true },
  { id: 'b-syl', name: 'Sylhet Hub', code: 'SYL-HUB', type: 'hub', network: 'outside_dhaka', district: 'Sylhet', phone: '01610001105', street: 'Zindabazar', isActive: true },
  { id: 'b-raj', name: 'Rajshahi Hub', code: 'RAJ-HUB', type: 'hub', network: 'outside_dhaka', district: 'Rajshahi', phone: '01710001106', street: 'Shaheb Bazar', isActive: true },
  { id: 'b-khl', name: 'Khulna Hub', code: 'KHL-HUB', type: 'hub', network: 'outside_dhaka', district: 'Khulna', phone: '01710001107', street: 'Sonadanga', isActive: true },
  { id: 'b-bar', name: 'Barishal Desk', code: 'BAR-DSK', type: 'sub_branch', network: 'outside_dhaka', district: 'Barishal', phone: '01710001108', street: 'Sadar Road', isActive: true },
  { id: 'b-com', name: 'Cumilla Hub', code: 'COM-HUB', type: 'hub', network: 'outside_dhaka', district: 'Cumilla', phone: '01710001109', street: 'Kandirpar', isActive: true },
  { id: 'b-mym', name: 'Mymensingh Sorting', code: 'MYM-SRT', type: 'sorting_center', network: 'outside_dhaka', district: 'Mymensingh', phone: '01710001110', street: 'Ganginarpar', isActive: true },
  { id: 'b-rng', name: 'Rangpur Hub', code: 'RNG-HUB', type: 'hub', network: 'outside_dhaka', district: 'Rangpur', phone: '01710001112', street: 'Modern More', isActive: true },
]

const users: User[] = [
  { id: 'u-nadia', name: 'Nadia Rahman', email: 'nadia@nirapod.test', role: 'super_admin', roleLabel: 'Super Admin', job: 'Configures the company and approves payouts', branchId: null, status: 'active', persona: true },
  { id: 'u-imran', name: 'Imran Hossain', email: 'imran@nirapod.test', role: 'operations', roleLabel: 'Operations Manager', job: 'Runs the network, assignments, and exceptions', branchId: null, status: 'active', persona: true },
  { id: 'u-farzana', name: 'Farzana Akter', email: 'farzana@nirapod.test', role: 'branch_manager', roleLabel: 'Branch Manager', job: 'Runs Mirpur pickups and deliveries', branchId: 'b-mir', status: 'active', persona: true },
  { id: 'u-kamal', name: 'Kamal Uddin', email: 'kamal@nirapod.test', role: 'hub_manager', roleLabel: 'Hub Manager', job: 'Receives, sorts, and dispatches at Uttara', branchId: 'b-utt', status: 'active', persona: true },
  { id: 'u-sadia', name: 'Sadia Islam', email: 'sadia@nirapod.test', role: 'booking', roleLabel: 'Booking Staff', job: 'Creates bookings and prints labels', branchId: null, status: 'active', persona: true },
  { id: 'u-tanvir', name: 'Tanvir Ahmed', email: 'tanvir@nirapod.test', role: 'accounts', roleLabel: 'Accounts Manager', job: 'Reconciles COD and prepares settlements', branchId: null, status: 'active', persona: true },
  { id: 'u-rakib', name: 'Rakib Hasan', email: 'rakib@nirapod.test', role: 'hub_manager', roleLabel: 'Hub Staff', job: 'Uttara sorting clerk', branchId: 'b-utt', status: 'active', persona: false },
  { id: 'u-nusrat', name: 'Nusrat Jahan', email: 'nusrat@nirapod.test', role: 'hub_manager', roleLabel: 'Hub Staff', job: 'Uttara dispatch clerk', branchId: 'b-utt', status: 'active', persona: false },
  { id: 'u-jahid', name: 'Jahidul Islam', email: 'jahid@nirapod.test', role: 'branch_manager', roleLabel: 'Branch Staff', job: 'Mirpur desk', branchId: 'b-mir', status: 'active', persona: false },
  { id: 'u-shaila', name: 'Shaila Parvin', email: 'shaila@nirapod.test', role: 'booking', roleLabel: 'Booking Staff', job: 'Mirpur booking desk', branchId: 'b-mir', status: 'inactive', persona: false },
]

const merchants: Merchant[] = [
  { id: 'm-rangpur', businessName: 'Rangpur Crafts', merchantCode: 'M-101', contactName: 'Hasan Ali', phone: '01711110001', email: 'hasan@rangpurcrafts.test', district: 'Dhaka', area: 'Gulshan', street: 'Road 45, Gulshan 2', pickupBranchId: 'b-gul', status: 'active', paymentMethod: 'bkash', createdAt: daysAgo(40), notes: 'Ships handmade textiles.' },
  { id: 'm-bazar', businessName: 'BazarHaat', merchantCode: 'M-102', contactName: 'Lima Chowdhury', phone: '01711110002', email: 'lima@bazarhaat.test', district: 'Dhaka', area: 'Dhanmondi', street: 'Road 8A', pickupBranchId: 'b-dhn', status: 'active', paymentMethod: 'bank', insideBaseOverride: takaToPoisha(50), createdAt: daysAgo(80), notes: 'Pickup is the Dhanmondi desk. Delivery still follows the recipient zone.' },
  { id: 'm-fresh', businessName: 'Dhaka Fresh', merchantCode: 'M-103', contactName: 'Karim Uddin', phone: '01711110003', email: 'karim@dhakafresh.test', district: 'Dhaka', area: 'Mirpur', street: 'Mirpur 11', pickupBranchId: 'b-mir', status: 'active', paymentMethod: 'bkash', createdAt: daysAgo(20), notes: '' },
  { id: 'm-boutique', businessName: 'Gulshan Boutique', merchantCode: 'M-104', contactName: 'Sara Ahmed', phone: '01711110004', email: 'sara@boutique.test', district: 'Dhaka', area: 'Gulshan', street: 'Road 12', pickupBranchId: 'b-gul', status: 'active', paymentMethod: 'nagad', createdAt: daysAgo(15), notes: '' },
  { id: 'm-ctg', businessName: 'CTG Traders', merchantCode: 'M-105', contactName: 'Jamal Hossain', phone: '01811110005', email: 'jamal@ctgtraders.test', district: 'Chattogram', area: 'Agrabad', street: 'Sheikh Mujib Road', pickupBranchId: 'b-ctg', status: 'active', paymentMethod: 'bank', createdAt: daysAgo(30), notes: '' },
  { id: 'm-tea', businessName: 'Sylhet Tea House', merchantCode: 'M-106', contactName: 'Rina Begum', phone: '01611110006', email: 'rina@sylhettea.test', district: 'Sylhet', area: 'Zindabazar', street: 'Court Road', pickupBranchId: 'b-syl', status: 'active', paymentMethod: 'bkash', createdAt: daysAgo(12), notes: '' },
  { id: 'm-new', businessName: 'North Star Gadgets', merchantCode: 'M-107', contactName: 'Ovi Rahman', phone: '01911110007', email: 'ovi@northstar.test', district: 'Dhaka', area: 'Uttara', street: 'Sector 4', pickupBranchId: 'b-utt', status: 'pending', paymentMethod: 'bkash', createdAt: daysAgo(2), notes: 'Waiting for trade license.' },
  { id: 'm-stop', businessName: 'Paused Pantry', merchantCode: 'M-108', contactName: 'Nabila Islam', phone: '01511110008', email: 'nabila@pantry.test', district: 'Dhaka', area: 'Mohammadpur', street: 'Tajmahal Road', pickupBranchId: 'b-mir', status: 'suspended', paymentMethod: 'bank', createdAt: daysAgo(50), notes: 'Suspended after unpaid invoices.' },
]

const riders: Rider[] = [
  { id: 'r-014', riderCode: 'R-014', name: 'Sohel Rana', phone: '01720001014', branchId: 'b-gul', vehicleType: 'motorcycle', licenseNumber: 'DHK-44112', status: 'active', isAvailable: true },
  { id: 'r-002', riderCode: 'R-002', name: 'Mintu Mia', phone: '01720001002', branchId: 'b-mir', vehicleType: 'motorcycle', licenseNumber: 'DHK-22001', status: 'active', isAvailable: true },
  { id: 'r-003', riderCode: 'R-003', name: 'Rubel Ahmed', phone: '01720001003', branchId: 'b-mir', vehicleType: 'bicycle', licenseNumber: 'DHK-22018', status: 'active', isAvailable: true },
  { id: 'r-004', riderCode: 'R-004', name: 'Sumon Das', phone: '01720001004', branchId: 'b-mir', vehicleType: 'motorcycle', licenseNumber: 'DHK-22990', status: 'on_leave', isAvailable: false },
  { id: 'r-005', riderCode: 'R-005', name: 'Tarek Islam', phone: '01720001005', branchId: 'b-utt', vehicleType: 'motorcycle', licenseNumber: 'DHK-33011', status: 'active', isAvailable: true },
  { id: 'r-006', riderCode: 'R-006', name: 'Pavel Chowdhury', phone: '01720001006', branchId: 'b-utt', vehicleType: 'van', licenseNumber: 'DHK-33040', status: 'active', isAvailable: false },
  { id: 'r-007', riderCode: 'R-007', name: 'Nayeem Hasan', phone: '01720001007', branchId: 'b-gul', vehicleType: 'motorcycle', licenseNumber: 'DHK-44190', status: 'active', isAvailable: true },
  { id: 'r-008', riderCode: 'R-008', name: 'Farid Uddin', phone: '01820001008', branchId: 'b-ctg', vehicleType: 'motorcycle', licenseNumber: 'CTG-11021', status: 'active', isAvailable: true },
  { id: 'r-009', riderCode: 'R-009', name: 'Shahin Alam', phone: '01820001009', branchId: 'b-ctg', vehicleType: 'bicycle', licenseNumber: 'CTG-11088', status: 'active', isAvailable: true },
  { id: 'r-010', riderCode: 'R-010', name: 'Liton Roy', phone: '01620001010', branchId: 'b-syl', vehicleType: 'motorcycle', licenseNumber: 'SYL-55012', status: 'active', isAvailable: true },
  { id: 'r-011', riderCode: 'R-011', name: 'Babul Sheikh', phone: '01620001011', branchId: 'b-syl', vehicleType: 'motorcycle', licenseNumber: 'SYL-55019', status: 'inactive', isAvailable: false },
  { id: 'r-012', riderCode: 'R-012', name: 'Anik Sarker', phone: '01720001012', branchId: 'b-mir', vehicleType: 'van', licenseNumber: 'DHK-22801', status: 'active', isAvailable: true },
  { id: 'r-015', riderCode: 'R-015', name: 'Keya Rahman', phone: '01720001015', branchId: 'b-dhn', vehicleType: 'motorcycle', licenseNumber: 'DHK-27014', status: 'active', isAvailable: true },
  { id: 'r-016', riderCode: 'R-016', name: 'Selim Reza', phone: '01720001016', branchId: 'b-gaz', vehicleType: 'motorcycle', licenseNumber: 'GAZ-61002', status: 'active', isAvailable: true },
  { id: 'r-017', riderCode: 'R-017', name: 'Ripon Mia', phone: '01720001017', branchId: 'b-nar', vehicleType: 'motorcycle', licenseNumber: 'NAR-71008', status: 'active', isAvailable: true },
]

const firstNames = ['Ayesha', 'Bilal', 'Champa', 'Dipu', 'Elina', 'Farhan', 'Gulshan', 'Hridoy', 'Ishrat', 'Joya', 'Kamrul', 'Lamia', 'Mahin', 'Nadia', 'Omar', 'Priti', 'Rafi', 'Shanta', 'Tania', 'Urmi', 'Wasim', 'Yamin', 'Zara', 'Arif', 'Borna', 'Choyon', 'Dina', 'Emon', 'Fahim', 'Laboni']
const lastNames = ['Ahmed', 'Akter', 'Hossain', 'Islam', 'Khan', 'Rahman', 'Chowdhury', 'Begum', 'Mia', 'Sarker', 'Uddin', 'Roy', 'Das', 'Karim', 'Noor']
const shopWords = ['Bazar', 'Mart', 'House', 'Studio', 'Corner', 'Gallery', 'Depot', 'Cart', 'Loft', 'Atelier', 'Emporium', 'Outlet']
const areas = [
  { district: 'Dhaka', area: 'Mirpur', branch: 'b-mir' },
  { district: 'Dhaka', area: 'Uttara', branch: 'b-utt' },
  { district: 'Dhaka', area: 'Gulshan', branch: 'b-gul' },
  { district: 'Dhaka', area: 'Dhanmondi', branch: 'b-dhn' },
  { district: 'Dhaka', area: 'Banani', branch: 'b-gul' },
  { district: 'Dhaka', area: 'Mohammadpur', branch: 'b-mir' },
  { district: 'Chattogram', area: 'Agrabad', branch: 'b-ctg' },
  { district: 'Chattogram', area: 'Halishahar', branch: 'b-ctg' },
  { district: 'Sylhet', area: 'Zindabazar', branch: 'b-syl' },
  { district: 'Rajshahi', area: 'Shaheb Bazar', branch: 'b-raj' },
  { district: 'Khulna', area: 'Sonadanga', branch: 'b-khl' },
  { district: 'Barishal', area: 'Sadar', branch: 'b-bar' },
  { district: 'Cumilla', area: 'Kandirpar', branch: 'b-com' },
  { district: 'Mymensingh', area: 'Ganginarpar', branch: 'b-mym' },
  { district: 'Rangpur', area: 'Modern More', branch: 'b-rng' },
  { district: 'Gazipur', area: 'Tongi', branch: 'b-gaz' },
  { district: 'Narayanganj', area: 'Fatullah', branch: 'b-nar' },
]
const vehicles = ['motorcycle', 'motorcycle', 'bicycle', 'van'] as const
const staffRoles = [
  { role: 'booking' as const, label: 'Booking Staff' },
  { role: 'hub_manager' as const, label: 'Hub Staff' },
  { role: 'branch_manager' as const, label: 'Branch Staff' },
  { role: 'operations' as const, label: 'Operations' },
  { role: 'accounts' as const, label: 'Accounts' },
]

for (let index = 0; index < 42; index += 1) {
  const place = areas[index % areas.length]!
  const contact = `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`
  const shop = `${firstNames[(index * 2) % firstNames.length]} ${shopWords[index % shopWords.length]}`
  const status = index % 11 === 0 ? 'pending' : index % 13 === 0 ? 'suspended' : 'active'
  merchants.push({
    id: `m-x-${index + 1}`,
    businessName: shop,
    merchantCode: `M-${200 + index}`,
    contactName: contact,
    phone: `0192${String(1000000 + index).slice(0, 7)}`,
    email: `shop${index + 1}@merchant.test`,
    district: place.district,
    area: place.area,
    street: `Plot ${12 + index}, ${place.area}`,
    pickupBranchId: place.branch,
    status,
    paymentMethod: index % 3 === 0 ? 'bank' : index % 3 === 1 ? 'bkash' : 'nagad',
    createdAt: daysAgo(3 + (index % 90)),
    notes: status === 'pending' ? 'Documents under review.' : '',
  })
}

for (let index = 0; index < 48; index += 1) {
  const place = areas[index % areas.length]!
  const name = `${firstNames[(index + 4) % firstNames.length]} ${lastNames[index % lastNames.length]}`
  const onLeave = index % 9 === 0
  const inactive = index % 14 === 0
  riders.push({
    id: `r-x-${index + 1}`,
    riderCode: `R-${String(20 + index).padStart(3, '0')}`,
    name,
    phone: `0167${String(2000000 + index).slice(0, 7)}`,
    branchId: place.branch,
    vehicleType: vehicles[index % vehicles.length]!,
    licenseNumber: `LIC-${3000 + index}`,
    status: inactive ? 'inactive' : onLeave ? 'on_leave' : 'active',
    isAvailable: !inactive && !onLeave && index % 5 !== 0,
  })
}

for (let index = 0; index < 36; index += 1) {
  const place = areas[index % areas.length]!
  const role = staffRoles[index % staffRoles.length]!
  const name = `${firstNames[(index + 7) % firstNames.length]} ${lastNames[(index + 2) % lastNames.length]}`
  users.push({
    id: `u-x-${index + 1}`,
    name,
    email: `staff${index + 1}@nirapod.test`,
    role: role.role,
    roleLabel: role.label,
    job: `${place.area} desk`,
    branchId: role.role === 'operations' || role.role === 'accounts' ? null : place.branch,
    status: index % 16 === 0 ? 'inactive' : 'active',
    persona: false,
  })
}

interface Spec {
  id: string
  trackingId: string
  merchantId: string
  status: ParcelStatus
  district: string
  area: string
  street: string
  name: string
  phone: string
  origin: string
  dest: string
  current: string
  weight: number
  codTaka: number
  service?: ServiceType
  day: number
  createdBy: string
  pickupRider?: string
  deliveryRider?: string
  attempts?: number
  bag?: string
  printed?: boolean
}

const specs: Spec[] = [
  { id: 'p-utt-receive', trackingId: 'NC-202610-4410', merchantId: 'm-ctg', status: 'PICKED_UP', district: 'Chattogram', area: 'Halishahar', street: 'Block C', name: 'Rafiq Islam', phone: '01815550101', origin: 'b-utt', dest: 'b-ctg', current: 'b-utt', weight: 1.2, codTaka: 1500, day: 1, createdBy: 'u-sadia', pickupRider: 'r-005', printed: true },
  { id: 'p-out-fail', trackingId: 'NC-202610-2201', merchantId: 'm-ctg', status: 'OUT_FOR_DELIVERY', district: 'Chattogram', area: 'Pahartali', street: 'Lane 4', name: 'Mitu Akter', phone: '01815550102', origin: 'b-gul', dest: 'b-ctg', current: 'b-ctg', weight: 0.8, codTaka: 980, day: 2, createdBy: 'u-sadia', deliveryRider: 'r-008', printed: true },
  { id: 'p-third-fail', trackingId: 'NC-202610-3303', merchantId: 'm-fresh', status: 'DELIVERY_FAILED', district: 'Chattogram', area: 'Kotwali', street: 'Station Road', name: 'Habib Khan', phone: '01815550103', origin: 'b-mir', dest: 'b-ctg', current: 'b-ctg', weight: 2, codTaka: 2400, day: 4, createdBy: 'u-sadia', deliveryRider: 'r-009', attempts: 3, printed: true },
  { id: 'p-wrong-addr', trackingId: 'NC-202610-1042', merchantId: 'm-boutique', status: 'DELIVERY_FAILED', district: 'Chattogram', area: 'Chawkbazar', street: 'Unknown lane', name: 'Sadia Noor', phone: '01815550104', origin: 'b-gul', dest: 'b-ctg', current: 'b-ctg', weight: 0.5, codTaka: 0, day: 3, createdBy: 'u-sadia', deliveryRider: 'r-008', attempts: 1, printed: true },
  { id: 'p-bazar-1', trackingId: 'NC-202610-8001', merchantId: 'm-bazar', status: 'DELIVERED', district: 'Dhaka', area: 'Mirpur', street: 'Mirpur 6', name: 'Nusrat Karim', phone: '01715550105', origin: 'b-dhn', dest: 'b-mir', current: 'b-mir', weight: 1, codTaka: 2200, day: 3, createdBy: 'u-sadia', deliveryRider: 'r-002', printed: true },
  { id: 'p-bazar-2', trackingId: 'NC-202610-8002', merchantId: 'm-bazar', status: 'DELIVERED', district: 'Dhaka', area: 'Dhanmondi', street: 'Road 27', name: 'Imtiaz Rahman', phone: '01715550106', origin: 'b-dhn', dest: 'b-dhn', current: 'b-dhn', weight: 1.4, codTaka: 3100, day: 2, createdBy: 'u-sadia', deliveryRider: 'r-015', printed: true },
  { id: 'p-bazar-3', trackingId: 'NC-202610-8003', merchantId: 'm-bazar', status: 'DELIVERED', district: 'Dhaka', area: 'Mohammadpur', street: 'Shankar', name: 'Faria Islam', phone: '01715550107', origin: 'b-dhn', dest: 'b-mir', current: 'b-mir', weight: 0.6, codTaka: 860, day: 1, createdBy: 'u-jahid', deliveryRider: 'r-012', printed: true },
  { id: 'p-cod-hand', trackingId: 'NC-202610-8101', merchantId: 'm-fresh', status: 'DELIVERED', district: 'Dhaka', area: 'Mirpur', street: 'Mirpur 2', name: 'Polash Mia', phone: '01715550108', origin: 'b-mir', dest: 'b-mir', current: 'b-mir', weight: 1, codTaka: 1750, day: 1, createdBy: 'u-sadia', deliveryRider: 'r-003', printed: true },
  { id: 'p-cod-hand-2', trackingId: 'NC-202610-8102', merchantId: 'm-fresh', status: 'DELIVERED', district: 'Dhaka', area: 'Mirpur', street: 'Mirpur 1', name: 'Rokeya Begum', phone: '01715550109', origin: 'b-mir', dest: 'b-mir', current: 'b-mir', weight: 2.2, codTaka: 4200, day: 1, createdBy: 'u-sadia', deliveryRider: 'r-003', printed: true },
]

const fillerStatuses: ParcelStatus[] = [
  'BOOKED', 'BOOKED', 'BOOKED', 'PICKUP_ASSIGNED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'AT_ORIGIN_HUB', 'AT_ORIGIN_HUB',
  'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_INITIATED', 'RETURNING', 'RETURNED',
  'CANCELLED', 'BOOKED', 'PICKUP_ASSIGNED', 'AT_ORIGIN_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERED',
  'IN_TRANSIT', 'AT_DESTINATION_HUB', 'PICKED_UP', 'BOOKED', 'RETURN_INITIATED', 'DELIVERED', 'PICKUP_FAILED', 'AT_ORIGIN_HUB',
]

const names = firstNames

function buildParcel(spec: Spec, rate: RateCard): Parcel {
  const merchant = merchants.find((item) => item.id === spec.merchantId)
  const priced = quote({
    district: spec.district,
    area: spec.area,
    weightKg: spec.weight,
    service: spec.service ?? 'standard',
    productPriceTaka: spec.codTaka > 0 ? spec.codTaka : 1000,
    codTaka: spec.codTaka,
    merchant,
    rate,
  })
  const charges = 'error' in priced
    ? { deliveryCharge: 0, damageControl: 0, codFee: 0, returnCharge: 0, totalCharges: 0, payableAmount: 0, productPrice: 0, zone: 'outside_dhaka' as Zone }
    : priced
  const createdAt = daysAgo(spec.day)
  const history = [{ status: 'BOOKED' as ParcelStatus, timestamp: createdAt, actorId: spec.createdBy, branchId: spec.origin, note: 'Booked' }]
  if (spec.status !== 'BOOKED') {
    history.push({ status: spec.status, timestamp: daysAgo(Math.max(spec.day - 1, 0), 16), actorId: 'u-imran', branchId: spec.current, note: 'Status updated' })
  }
  const attempts = Array.from({ length: spec.attempts ?? 0 }, (_, index) => ({
    attemptNumber: index + 1,
    attemptedAt: daysAgo(spec.day, 18),
    riderId: spec.deliveryRider ?? 'r-008',
    reason: index === 0 ? 'wrong_address' : 'customer_unreachable',
    note: 'Customer was not available',
  }))
  return {
    id: spec.id,
    trackingId: spec.trackingId,
    merchantId: spec.merchantId,
    serviceType: spec.service ?? 'standard',
    deliveryZone: 'error' in priced ? 'outside_dhaka' : priced.zone,
    recipient: {
      name: spec.name,
      phone: spec.phone,
      division: spec.district === 'Dhaka' || spec.district === 'Gazipur' || spec.district === 'Narayanganj' ? 'Dhaka' : spec.district,
      district: spec.district,
      area: spec.area,
      street: spec.street,
    },
    weightKg: spec.weight,
    category: 'General',
    description: 'Demo parcel',
    itemsCount: 1,
    codAmount: takaToPoisha(spec.codTaka),
    productPrice: charges.productPrice,
    charges: {
      deliveryCharge: charges.deliveryCharge,
      damageControl: charges.damageControl,
      codFee: charges.codFee,
      returnCharge: charges.returnCharge,
      totalCharges: charges.totalCharges,
    },
    payableAmount: 'error' in priced ? 0 : priced.payableAmount,
    currentStatus: spec.status,
    currentBranchId: spec.current,
    originBranchId: spec.origin,
    destinationBranchId: spec.dest,
    assignedPickupRiderId: spec.pickupRider,
    assignedDeliveryRiderId: spec.deliveryRider,
    bagBranchId: spec.bag,
    statusHistory: history,
    deliveryAttempts: attempts,
    createdBy: spec.createdBy,
    createdAt,
    labelPrinted: spec.printed ?? spec.status !== 'BOOKED',
  }
}

const activeRiders = () => riders.filter((rider) => rider.status === 'active')

function fillerSpec(index: number): Spec {
  const place = areas[index % areas.length]!
  const destPlace = areas[(index * 5 + 3) % areas.length]!
  const status = fillerStatuses[index % fillerStatuses.length]!
  const merchant = merchants[(index + 2) % merchants.length]!
  const pool = activeRiders().filter((rider) => rider.branchId === place.branch)
  const destPool = activeRiders().filter((rider) => rider.branchId === destPlace.branch)
  const rider = (pool[index % Math.max(pool.length, 1)] ?? activeRiders()[index % activeRiders().length])!
  const destRider = (destPool[index % Math.max(destPool.length, 1)] ?? rider)!
  const codLadder = [0, 450, 890, 1200, 1750, 2400, 3600, 5400, 8200]
  const inside = place.district === 'Dhaka' && destPlace.district === 'Dhaka'
  return {
    id: `p-fill-${index + 1}`,
    trackingId: `NC-202610-${String(5000 + index)}`,
    merchantId: merchant.status === 'suspended' ? 'm-fresh' : merchant.id,
    status,
    district: destPlace.district,
    area: destPlace.area,
    street: `House ${index + 3}, Lane ${(index % 12) + 1}`,
    name: `${names[index % names.length]} ${lastNames[index % lastNames.length]}`,
    phone: `017${String(10000000 + index * 17).slice(0, 8)}`,
    origin: place.branch,
    dest: destPlace.branch,
    current: status === 'IN_TRANSIT' || status === 'BOOKED' || status === 'PICKUP_ASSIGNED' || status === 'PICKED_UP' || status === 'AT_ORIGIN_HUB' || status === 'PICKUP_FAILED' ? place.branch : destPlace.branch,
    weight: 0.4 + (index % 8) * 0.45,
    codTaka: codLadder[index % codLadder.length]!,
    service: index % 7 === 0 && inside ? 'same_day' : index % 4 === 0 ? 'express' : 'standard',
    day: index % 21,
    createdBy: index % 3 === 0 ? 'u-sadia' : index % 3 === 1 ? 'u-jahid' : 'u-shaila',
    pickupRider: status === 'BOOKED' || status === 'CANCELLED' ? undefined : rider.id,
    deliveryRider: status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED' || status === 'DELIVERY_FAILED' ? destRider.id : undefined,
    attempts: status === 'DELIVERY_FAILED' ? 1 + (index % 3) : 0,
    printed: status !== 'BOOKED',
  }
}

function collectionsFor(parcels: Parcel[]): CodCollection[] {
  return parcels
    .filter((parcel) => parcel.currentStatus === 'DELIVERED' && parcel.codAmount > 0 && parcel.assignedDeliveryRiderId)
    .map((parcel, index) => {
      const held = parcel.id === 'p-cod-hand' || parcel.id === 'p-cod-hand-2' || parcel.trackingId.endsWith('2')
      const short = !held && parcel.id !== 'p-bazar-1' && index % 8 === 0
      const methods = ['cash', 'bkash', 'nagad'] as const
      return {
        id: `c-${parcel.id}`,
        parcelId: parcel.id,
        riderId: parcel.assignedDeliveryRiderId!,
        expected: parcel.codAmount,
        amountCollected: short ? Math.max(parcel.codAmount - takaToPoisha(50), takaToPoisha(10)) : parcel.codAmount,
        paymentMethod: methods[index % methods.length]!,
        collectedAt: parcel.createdAt,
        handoverStatus: held ? 'pending' as const : 'reconciled' as const,
      }
    })
}

export function createSeed(): DemoData {
  const fixed = specs.map((spec) => buildParcel(spec, RATE))
  const filler = Array.from({ length: 240 }, (_, index) => buildParcel(fillerSpec(index), RATE))
  const parcels = [...fixed, ...filler]
  const collections = collectionsFor(parcels)
  const handovers: Handover[] = [
    {
      id: 'h-pending',
      riderId: 'r-003',
      branchId: 'b-mir',
      amount: collections
        .filter((item) => item.id === 'c-p-cod-hand' || item.id === 'c-p-cod-hand-2')
        .reduce((sum, item) => sum + item.amountCollected, 0),
      collectionIds: ['c-p-cod-hand', 'c-p-cod-hand-2'],
      status: 'pending',
      createdAt: daysAgo(0, 18),
    },
    {
      id: 'h-verified',
      riderId: 'r-002',
      branchId: 'b-mir',
      amount: takaToPoisha(2200),
      collectionIds: ['c-p-bazar-1'],
      status: 'verified',
      createdAt: daysAgo(2, 19),
    },
  ]
  collections.forEach((item) => {
    if (item.id === 'c-p-bazar-1') item.handoverStatus = 'reconciled'
    if (item.id === 'c-p-cod-hand' || item.id === 'c-p-cod-hand-2') item.handoverId = 'h-pending'
  })

  const bazarParcels = ['p-bazar-1', 'p-bazar-2']
  const bazarRows = parcels.filter((parcel) => bazarParcels.includes(parcel.id))
  const cod = bazarRows.reduce((sum, parcel) => sum + parcel.codAmount, 0)
  const delivery = bazarRows.reduce((sum, parcel) => sum + parcel.charges.deliveryCharge, 0)
  const fees = bazarRows.reduce((sum, parcel) => sum + parcel.charges.codFee, 0)
  const settlements: Settlement[] = [
    {
      id: 's-bazar',
      merchantId: 'm-bazar',
      periodStart: daysAgo(7).slice(0, 10),
      periodEnd: todayDhaka(),
      parcelIds: bazarParcels,
      totalCodCollected: cod,
      totalDeliveryCharges: delivery,
      totalCodFees: fees,
      totalAdjustments: 0,
      netPayable: cod - delivery - fees,
      payoutStatus: 'draft',
      preparedBy: 'u-tanvir',
    },
    {
      id: 's-fresh',
      merchantId: 'm-fresh',
      periodStart: daysAgo(14).slice(0, 10),
      periodEnd: daysAgo(7).slice(0, 10),
      parcelIds: ['p-cod-hand'],
      totalCodCollected: takaToPoisha(1750),
      totalDeliveryCharges: parcels.find((parcel) => parcel.id === 'p-cod-hand')?.charges.deliveryCharge ?? 0,
      totalCodFees: parcels.find((parcel) => parcel.id === 'p-cod-hand')?.charges.codFee ?? 0,
      totalAdjustments: 0,
      netPayable: takaToPoisha(1750) - (parcels.find((parcel) => parcel.id === 'p-cod-hand')?.charges.totalCharges ?? 0),
      payoutStatus: 'pending_approval',
      preparedBy: 'u-tanvir',
    },
  ]

  const ledger: LedgerEntry[] = []

  const cases: CaseItem[] = [
    { id: 'case-1', caseNo: 'CS-1042', type: 'wrong_address', parcelId: 'p-wrong-addr', merchantId: 'm-boutique', ownerId: 'u-imran', priority: 'high', status: 'open', createdAt: daysAgo(1, 11), notes: [{ at: daysAgo(1, 11), actorId: 'u-imran', text: 'Rider reports the lane does not exist.' }] },
    { id: 'case-2', caseNo: 'CS-1048', type: 'merchant_complaint', parcelId: 'p-bazar-3', merchantId: 'm-bazar', ownerId: 'u-farzana', priority: 'normal', status: 'open', createdAt: daysAgo(1, 9), notes: [{ at: daysAgo(1, 9), actorId: 'u-farzana', text: 'Merchant asked for a faster pickup window.' }] },
    { id: 'case-3', caseNo: 'CS-1055', type: 'cod_dispute', parcelId: 'p-cod-hand', merchantId: 'm-fresh', ownerId: 'u-tanvir', priority: 'high', status: 'waiting', createdAt: daysAgo(0, 12), notes: [{ at: daysAgo(0, 12), actorId: 'u-tanvir', text: 'Waiting for rider confirmation.' }] },
    { id: 'case-4', caseNo: 'CS-1060', type: 'lost_damaged', parcelId: 'p-utt-receive', merchantId: 'm-ctg', ownerId: 'u-kamal', priority: 'high', status: 'open', createdAt: daysAgo(0, 8), notes: [{ at: daysAgo(0, 8), actorId: 'u-kamal', text: 'Carton corner crushed at inbound dock. Contents look intact.' }] },
  ]

  const manifests: Manifest[] = [
    { id: 'mf-1', manifestNumber: 'MF-2401', sourceBranchId: 'b-utt', destinationBranchId: 'b-ctg', parcelIds: ['p-fill-9'], status: 'in_transit', dispatchedAt: daysAgo(1, 15), dispatchedBy: 'u-kamal' },
    { id: 'mf-2', manifestNumber: 'MF-2390', sourceBranchId: 'b-mir', destinationBranchId: 'b-syl', parcelIds: ['p-fill-5'], status: 'received', dispatchedAt: daysAgo(4, 14), dispatchedBy: 'u-farzana', receivedAt: daysAgo(3, 11), receivedBy: 'u-imran' },
    { id: 'mf-3', manifestNumber: 'MF-2384', sourceBranchId: 'b-gul', destinationBranchId: 'b-ctg', parcelIds: ['p-fill-4'], status: 'discrepancy', dispatchedAt: daysAgo(5, 13), dispatchedBy: 'u-imran', note: 'One piece missing on arrival' },
  ]

  const caseTypes = ['wrong_address', 'merchant_complaint', 'cod_dispute', 'lost_damaged', 'failed_delivery'] as const
  const caseStatuses = ['open', 'waiting', 'resolved'] as const
  parcels.filter((parcel) => parcel.id.startsWith('p-fill-')).slice(0, 36).forEach((parcel, index) => {
    const status = caseStatuses[index % caseStatuses.length]!
    cases.push({
      id: `case-x-${index + 1}`,
      caseNo: `CS-${2000 + index}`,
      type: caseTypes[index % caseTypes.length]!,
      parcelId: parcel.id,
      merchantId: parcel.merchantId,
      ownerId: index % 2 === 0 ? 'u-imran' : 'u-farzana',
      priority: index % 4 === 0 ? 'high' : 'normal',
      status,
      createdAt: daysAgo(index % 12, 8),
      notes: [{ at: daysAgo(index % 12, 8), actorId: 'u-imran', text: 'Opened from the morning exception queue.' }],
    })
  })

  const transit = parcels.filter((parcel) => parcel.currentStatus === 'IN_TRANSIT' && parcel.id.startsWith('p-fill-'))
  for (let index = 0; index < 18; index += 1) {
    const chunk = transit.slice(index * 2, index * 2 + 2)
    if (chunk.length === 0) break
    const source = chunk[0]!
    manifests.push({
      id: `mf-x-${index + 1}`,
      manifestNumber: `MF-${2500 + index}`,
      sourceBranchId: source.originBranchId,
      destinationBranchId: source.destinationBranchId,
      parcelIds: chunk.map((parcel) => parcel.id),
      status: index % 5 === 0 ? 'discrepancy' : index % 3 === 0 ? 'received' : 'in_transit',
      dispatchedAt: daysAgo(index % 8, 14),
      dispatchedBy: 'u-kamal',
      receivedAt: index % 3 === 0 ? daysAgo(Math.max((index % 8) - 1, 0), 18) : undefined,
      receivedBy: index % 3 === 0 ? 'u-imran' : undefined,
    })
  }

  const pendingByBranch = new Map<string, CodCollection[]>()
  collections.forEach((item) => {
    if (item.handoverStatus !== 'pending' || item.handoverId) return
    const branchId = riders.find((rider) => rider.id === item.riderId)?.branchId
    if (!branchId || branchId === 'b-mir') return
    const list = pendingByBranch.get(branchId) ?? []
    list.push(item)
    pendingByBranch.set(branchId, list)
  })
  ;[...pendingByBranch.entries()].forEach(([branchId, items], index) => {
    const status = index % 7 === 0 ? 'disputed' as const : index % 3 === 0 ? 'verified' as const : 'pending' as const
    const id = `h-x-${index + 1}`
    handovers.push({
      id,
      riderId: items[0]!.riderId,
      branchId,
      amount: items.reduce((sum, item) => sum + item.amountCollected, 0),
      collectionIds: items.map((item) => item.id),
      status,
      note: status === 'disputed' ? 'Desk count is short of the rider slip.' : undefined,
      createdAt: daysAgo(index % 6, 16),
    })
    items.forEach((item) => {
      item.handoverId = id
      if (status !== 'pending') item.handoverStatus = 'reconciled'
    })
  })

  const payoutStatuses = ['draft', 'pending_approval', 'approved', 'disbursed'] as const
  const merchantsByBranch = new Map<string, typeof merchants>()
  merchants.forEach((merchant) => {
    if (merchant.status !== 'active' || merchant.id === 'm-bazar' || merchant.id === 'm-fresh') return
    const list = merchantsByBranch.get(merchant.pickupBranchId) ?? []
    list.push(merchant)
    merchantsByBranch.set(merchant.pickupBranchId, list)
  })
  let settlementIndex = 0
  merchantsByBranch.forEach((group) => {
    group.slice(0, 2).forEach((merchant) => {
      const owned = parcels.filter((parcel) => parcel.merchantId === merchant.id && parcel.currentStatus === 'DELIVERED' && parcel.codAmount > 0).slice(0, 4)
      if (owned.length === 0) return
      const totalCod = owned.reduce((sum, parcel) => sum + parcel.codAmount, 0)
      const charges = owned.reduce((sum, parcel) => sum + parcel.charges.deliveryCharge, 0)
      const fees = owned.reduce((sum, parcel) => sum + parcel.charges.codFee, 0)
      const status = payoutStatuses[settlementIndex % payoutStatuses.length]!
      settlements.push({
        id: `s-x-${settlementIndex + 1}`,
        merchantId: merchant.id,
        periodStart: daysAgo(21).slice(0, 10),
        periodEnd: daysAgo(7).slice(0, 10),
        parcelIds: owned.map((parcel) => parcel.id),
        totalCodCollected: totalCod,
        totalDeliveryCharges: charges,
        totalCodFees: fees,
        totalAdjustments: 0,
        netPayable: totalCod - charges - fees,
        payoutStatus: status,
        preparedBy: 'u-tanvir',
        approvedBy: status === 'approved' || status === 'disbursed' ? 'u-nadia' : undefined,
        paymentReference: status === 'disbursed' ? `BKASH-OLD-${300 + settlementIndex}` : undefined,
        paymentMethod: status === 'disbursed' ? 'bkash' : undefined,
      })
      settlementIndex += 1
    })
  })

  collections.filter((item) => item.handoverStatus === 'reconciled' && item.amountCollected === item.expected).forEach((item, index) => {
    const parcel = parcels.find((row) => row.id === item.parcelId)
    if (!parcel || parcel.payableAmount < 0) return
    const batch = `seed-cod-${index + 1}`
    ledger.push(
      { id: `lx-d-${index}`, batchId: batch, accountType: 'cod_receivable', type: 'DEBIT', amount: parcel.codAmount, description: `COD ${parcel.trackingId}`, parcelId: parcel.id, createdAt: parcel.createdAt, createdBy: 'u-tanvir' },
      { id: `lx-p-${index}`, batchId: batch, accountType: 'merchant_payable', type: 'CREDIT', amount: parcel.payableAmount, description: `Payable ${parcel.trackingId}`, parcelId: parcel.id, createdAt: parcel.createdAt, createdBy: 'u-tanvir' },
      { id: `lx-r-${index}`, batchId: batch, accountType: 'courier_revenue', type: 'CREDIT', amount: parcel.charges.totalCharges, description: `Charges ${parcel.trackingId}`, parcelId: parcel.id, createdAt: parcel.createdAt, createdBy: 'u-tanvir' },
    )
  })
  settlements.filter((item) => item.payoutStatus === 'disbursed').forEach((item, index) => {
    const parcelId = item.parcelIds[0]
    const batch = `seed-pay-${index + 1}`
    ledger.push(
      { id: `lp-d-${index}`, batchId: batch, accountType: 'merchant_payable', type: 'DEBIT', amount: item.netPayable, description: `Disbursed ${item.paymentReference}`, parcelId, createdAt: daysAgo(2, 12), createdBy: 'u-tanvir' },
      { id: `lp-c-${index}`, batchId: batch, accountType: 'cash_in_hand', type: 'CREDIT', amount: item.netPayable, description: `Paid ${item.paymentReference}`, parcelId, createdAt: daysAgo(2, 12), createdBy: 'u-tanvir' },
    )
  })

  const audit: AuditLog[] = Array.from({ length: 48 }, (_, index) => ({
    id: `a-${index + 1}`,
    timestamp: daysAgo(index % 20, 8 + (index % 8)),
    actorId: ['u-imran', 'u-nadia', 'u-farzana', 'u-kamal', 'u-tanvir', 'u-sadia'][index % 6]!,
    action: ['PARCEL_STATUS_UPDATE', 'USER_SIGN_IN', 'MERCHANT_STATUS', 'HANDOVER', 'SETTLEMENT_SUBMITTED'][index % 5]!,
    entity: parcels[index % parcels.length]?.trackingId ?? 'session',
    summary: ['Morning status sweep', 'Staff signed in', 'Merchant reviewed', 'Cash counted at the desk', 'Settlement drafted'][index % 5]!,
  }))

  return {
    users,
    branches,
    merchants,
    riders,
    parcels,
    collections,
    handovers,
    settlements,
    ledger,
    adjustments: [
      { id: 'adj-1', amount: takaToPoisha(100), description: 'Goodwill credit for BazarHaat', status: 'pending', createdBy: 'u-tanvir', createdAt: daysAgo(1, 11) },
      { id: 'adj-2', amount: takaToPoisha(250), description: 'Damaged carton allowance, Dhaka Fresh', status: 'approved', createdBy: 'u-tanvir', createdAt: daysAgo(4, 10) },
      { id: 'adj-3', amount: takaToPoisha(80), description: 'Short COD waiver, CTG Traders', status: 'pending', createdBy: 'u-tanvir', createdAt: daysAgo(2, 15) },
      { id: 'adj-4', amount: takaToPoisha(150), description: 'Sylhet Tea House late delivery credit', status: 'approved', createdBy: 'u-tanvir', createdAt: daysAgo(6, 9) },
    ],
    cases,
    manifests,
    audit,
    alerts: [
      { id: 'al-1', roles: ['operations', 'super_admin', 'branch_manager'], title: 'Delivery failed', body: 'NC-202610-2201 is still out for delivery after a missed attempt.', href: '/app/deliveries' },
      { id: 'al-2', roles: ['operations', 'hub_manager', 'super_admin'], title: 'Manifest discrepancy', body: 'MF-2384 arrived short at Chattogram.', href: '/app/manifests/mf-3' },
      { id: 'al-3', roles: ['accounts', 'super_admin'], title: 'Settlement waiting', body: 'Dhaka Fresh batch is pending approval.', href: '/app/finance/settlements/s-fresh' },
      { id: 'al-4', roles: ['accounts'], title: 'Handover to verify', body: 'Rubel Ahmed handed cash in at Mirpur.', href: '/app/finance/handovers' },
      { id: 'al-5', roles: ['operations', 'super_admin'], title: 'Pickups still open', body: 'Several bookings are waiting for a rider this morning.', href: '/app/pickups' },
      { id: 'al-6', roles: ['hub_manager', 'operations'], title: 'Bags ready', body: 'Uttara has parcels sorted and waiting to dispatch.', href: '/app/hub/dispatch' },
      { id: 'al-7', roles: ['accounts', 'super_admin'], title: 'Draft settlements', body: 'Merchant drafts are ready to submit.', href: '/app/finance/settlements' },
      { id: 'al-8', roles: ['branch_manager', 'operations'], title: 'Returns in motion', body: 'Mirpur has parcels on the way back to merchants.', href: '/app/returns' },
      { id: 'al-9', roles: ['booking'], title: 'Labels waiting', body: 'Today’s bookings still need a printed label.', href: '/app/labels' },
    ],
    settings: { name: 'Nirapod Courier', phone: '09600000000', labelFooter: 'Handle with care · nirapod.test' },
    rate: RATE,
    routes: defaultRoutes(),
  }
}
