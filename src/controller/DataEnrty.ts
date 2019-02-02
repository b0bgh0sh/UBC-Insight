import {InsightDatasetKind} from "./IInsightFacade";

export class DataEntry {
    public dataID: string;
    private kind: InsightDatasetKind;
    public data: string;
    // constructor
    constructor(id: string, k: InsightDatasetKind, d: string) {
        this.dataID = id;
        this.kind = k;
        this.data = d;
    }
}
