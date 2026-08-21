import { findOrganization } from "./procedures/find-organization";
import { listOrganizations } from "./procedures/list-organizations";
import { listUsers } from "./procedures/list-users";
import { exportOrdersSpreadsheet } from "./procedures/export-orders-spreadsheet";
import { exportRevenueSpreadsheet } from "./procedures/export-revenue-spreadsheet";

export const adminRouter = {
	users: {
		list: listUsers,
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
