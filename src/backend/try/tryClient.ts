import { HttpService } from "../../core/httpService";
import { TryService } from "./tryService"

export class TryClient {
    tryService: TryService;

    constructor(httpService: HttpService) {
        this.tryService = new TryService(httpService);
    }

}