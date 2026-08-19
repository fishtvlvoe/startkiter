import { getStatus } from "./procedures/get-status";
import { provisionServer } from "./procedures/provision-server";
import { submitCredential } from "./procedures/submit-credential";

export const deploymentRouter = {
	status: getStatus,
	provision: provisionServer,
	submitCredential,
};
