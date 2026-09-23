import { findOrganization } from "./procedures/find-organization";
import { listOrganizations } from "./procedures/list-organizations";
import { listUsers } from "./procedures/list-users";
import { exportOrdersSpreadsheet } from "./procedures/export-orders-spreadsheet";
import { exportRevenueSpreadsheet } from "./procedures/export-revenue-spreadsheet";
import { setInstructorRole } from "./procedures/set-instructor-role";

export const adminRouter = {
	users: {
		list: listUsers,
		setInstructorRole,
	},
	organizations: {
		list: listOrganizations,
		find: findOrganization,
	},
	exports: {
		orders: exportOrdersSpreadsheet,
		revenue: exportRevenueSpreadsheet,
	},
};
