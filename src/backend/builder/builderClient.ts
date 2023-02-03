import { HttpService } from "../../core/httpService";
import { BuilderService } from "./builderService";
import { DeployService } from "./deployService";
import { TestService } from "./testService";

export class BuilderClient {
    builderService: BuilderService;
    deployService: DeployService;
    testService: TestService;

    constructor(httpService: HttpService) {
        this.builderService = new BuilderService(httpService);
        this.deployService = new DeployService(httpService);
        this.testService = new TestService(httpService);
    }
}