import { HttpService } from "../../core/httpService";
import { BuilderService } from "./builderService";
import { DeployService } from "./deployService";

export class BuilderClient {
    builderService: BuilderService;
    deployService: DeployService;

    constructor(httpService: HttpService) {
        this.builderService = new BuilderService(httpService);
        this.deployService = new DeployService(httpService);
    }
}