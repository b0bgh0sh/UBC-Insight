import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as fs from "fs";
import * as JSZip from "jszip";
import * as parse5 from "parse5";
import {DataEntry} from "./DataEnrty";
import {CourseFormatter} from "./CourseFormatter";
import {IData} from "./Data";
import {RoomFormatter} from "./RoomFormatter";
import QueryHelper from "./QueryHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    // data structure to store dataset
    private datasets: InsightDataset[];
    private path: string = "./data/";
    private filename: string = "./data/dataEntries.json";
    private filename2: string = "./data/datasets.json";
    private filename3: string = "./data/listDataset.txt";
    // use to store json data - a course will take 1 entry
    private dataEntries: DataEntry[];
    private lDataset: string[];
    private roomnames: string[];
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        // if path exists
        if (fs.existsSync(this.filename) && fs.existsSync(this.filename2)
            && fs.existsSync(this.filename3)) {
            this.dataEntries = JSON.parse(fs.readFileSync(this.filename, "utf8"));
            this.datasets = JSON.parse(fs.readFileSync(this.filename2, "utf8"));
            let text = fs.readFileSync(this.filename3, "utf8");
            this.lDataset = text.split(",");
        }
        if (fs.existsSync(this.path)) {
            this.datasets = [];
            this.dataEntries = [];
            this.lDataset = [];
            this.roomnames = [];
        } else {
            fs.mkdirSync(this.path);
            this.datasets = [];
            this.dataEntries = [];
            this.lDataset = [];
            this.roomnames = [];
        }
    }
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // GLOBALS
        let that = this;
        // how do I know whether kind is courses
        return new Promise<string[]>(function (resolve, reject) {
            let Id = id;
            let Kind = kind;
            let coursesString = "courses";
            let roomsString = "rooms";
            try {
                if (kind !== coursesString && kind !== roomsString) {
                    return reject(new InsightError("Invalid Kind: Spec Error"));
                }

                // duplicated id (already exists) - InsightError
                if (that.datasets.length > 0) {
                    for (let insightOfDataset of that.datasets) {
                        if (id === insightOfDataset.id) {
                            return reject(new InsightError("A Dataset With The Same ID Already Exists"));
                        }
                    }
                }
                if (id.length === 0 || typeof(id) === "undefined" || id === null) {
                    return reject(new InsightError("Invalid ID: Spec Error"));
                }
                // At this point, there shouldnt be any invalid cases
                // how to use JSZIP http://stuk.github.io/jszip/documentation/examples.html
                // https://piazza.com/class/jllqzswlx9l1jg?cid=624
                if (kind === "courses" && content.length > 0) {
                    let total: number = 0;
                    let ids: string[] = [];
                    JSZip().loadAsync(content, {base64: true}).then(function (zipdt) {
                        // go to "courses" folder of a zip dataset
                        let coursesFolder = zipdt.folder("courses");
                        // holds promises
                        let promisedArray: any[] = [];
                        // total number of section in the zip dataset file
                        // check the text of the files
                        coursesFolder.forEach(function (relativePath, file) {
                                if (!file.name.includes(".")) {
                                    promisedArray.push(file.async("text"));
                                }
                            }
                        );
                        // make sure all the files resolve
                        Promise.all(promisedArray).then(function (results: string[]) {
                            if (results.length < 1) {
                                return reject(new InsightError("No Valid Files Found In The Dataset"));
                            }
                            results.forEach(function (course: string) {    // each coursefile is a file in courses
                                // each file is a string of JSON we want to get
                                // format JSON through helper and push each section to dataEntries
                                if (course.length > 0) {
                                    let c: IData = CourseFormatter.formatCourseString(id, course, kind,
                                        that.dataEntries);
                                    total += c.num;
                                    that.dataEntries = c.dts;
                                }
                            });
                            if (total === 0) {
                                return reject(new InsightError("No Valid Sections Found In The Dataset"));
                            } else {
                                const dataset: InsightDataset = {
                                    id: Id, kind: Kind, numRows: total
                                };
                                that.datasets.push(dataset);
                                for (let dts of that.datasets) {
                                    ids.push(dts.id);
                                }
                                if (! that.lDataset.includes(id)) {
                                    that.lDataset.push(id);
                                    fs.writeFileSync(that.filename3, that.lDataset, "utf8");
                                }
                                fs.writeFileSync(that.filename, JSON.stringify(that.dataEntries),
                                    "utf8");
                                fs.writeFileSync(that.filename2, JSON.stringify(that.datasets),
                                    "utf8");
                                resolve(ids);
                            }
                        }).catch(function (err: any) {
                            err = new InsightError("No Valid Information Found In The Dataset");
                            return reject(err);
                        });
                    }).catch(function (err: any) {
                        err = new InsightError("Invalid Dataset Zip File");
                        return reject(err);
                    });
                }
                if (kind === "rooms" && content.length > 0) {
                    let filenames: string[] = [];
                    let ids: string[] = [];
                    JSZip.loadAsync(content, {base64: true}).then(function (zipdt) {
                        let index = zipdt.file(/index.htm/);
                        if (index.length === 0) {
                            return reject (new InsightError("Invalid Index File For Kind Room Dataset"));
                        } else {
                            let path = index[0].name;
                            zipdt.files[path].async("text").then(function (data: string) {
                                let result = parse5.parse(data);
                                that.roomnames = RoomFormatter.recurseHTML(result, that.roomnames);
                                filenames = that.roomnames;
                                let roomsFolder = zipdt.folder("campus/discover/buildings-and-classrooms");
                                let promisedArray: any[] = [];
                                let newParray: any[] = [];
                                roomsFolder.forEach(function (relativePath, file) {
                                    if (filenames.includes("./" + file.name)) {
                                        promisedArray.push(file.async("text"));
                                        }
                                    }
                                );
                                Promise.all(promisedArray).then( function (results: string[]) {
                                    if (results.length < 1) {
                                        return reject(new InsightError("No Valid Files In The Dataset"));
                                    }
                                    results.forEach( function (rooms: string) {
                                        if (rooms.length > 0) {
                                     newParray.push(RoomFormatter.formatRoomString(id, rooms, kind, that.dataEntries)
                                         .then((Tot: IData) => {
                                             that.dataEntries = Tot.dts;
                                             return Tot.num;
                                            }
                                            )
                                     );
                                    }
                                    }
                                    );
                                    Promise.all(newParray).then(function (Total: number[]) {
                                        let tot: number = 0;
                                        for (let i of Total) {
                                            tot += i;
                                        }
                                        if (tot === 0) {
                                        return reject(new InsightError("No Valid Sections In The Dataset"));
                                    } else {
                                        const dataset: InsightDataset = {
                                            id: Id, kind: Kind, numRows: tot
                                        };
                                        that.datasets.push(dataset);
                                        for (let dts of that.datasets) {
                                            ids.push(dts.id);
                                        }
                                        if (!that.lDataset.includes(id)) {
                                            that.lDataset.push(id);
                                            fs.writeFileSync(that.filename3, that.lDataset, "utf8");
                                        }
                                        fs.writeFileSync(that.filename, JSON.stringify(that.dataEntries),
                                            "utf8");
                                        fs.writeFileSync(that.filename2, JSON.stringify(that.datasets),
                                            "utf8");
                                        resolve(ids);
                                    }});
                                } ).catch(function (err: any) {
                                    err = new InsightError("No Valid Information In The Dataset");
                                    return reject(err);
                                });
                            });
                        }
                    }).catch(function (err: any) {
                        err = new InsightError("Invalid Dataset Zip File");
                        return reject(err);
                    });
                }
                return resolve;
            } catch (error) {
                return reject(new InsightError("Error Adding The Dataset"));
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        let that = this;
        let n = 0;
        return new Promise<string>(function (resolve, reject) {
                try {
                    if (typeof (id) !== "undefined" || id !== null) {
                        if (that.datasets.length > 0 && id.length > 0) {
                            for (let dataset of that.datasets) {
                                if (dataset.id === id) {
                                    that.datasets.splice(that.datasets.indexOf(dataset), 1);
                                    n++;
                                    break;
                                }
                            }
                            for (let de of that.dataEntries) {
                                if (id === de.dataID) {
                                    that.dataEntries.splice(that.dataEntries.indexOf(de), 1);
                                    break;
                                }
                            }
                            for (let ld of that.lDataset) {
                                if (ld.includes(id)) {
                                    n++;
                                    break;
                                }
                            }
                            if (n === 2) {
                                fs.writeFileSync(that.filename2, JSON.stringify(that.datasets),
                                    "utf8");
                                fs.writeFileSync(that.filename, JSON.stringify(that.dataEntries),
                                    "utf8");
                                return resolve(id);
                            }
                            if (n === 0) {
                                return reject(new InsightError("Dataset Cannot Be Removed"));
                            }
                            if (n === 1) {
                                return reject(new NotFoundError("Dataset Not Found"));
                            }
                        }
                        if (id.length > 0 && typeof (id) !== "undefined" && id !== null) {
                            if (that.lDataset.length > 0) {
                                if (that.lDataset.includes(id)) {
                                    return reject(new NotFoundError("Dataset Not Found"));
                                } else {
                                    return reject(new InsightError("Dataset Cannot Be Removed"));
                                }
                            } else {
                                return reject(new NotFoundError("Dataset Not Found"));
                            }
                        } else {
                            return reject(new InsightError("Dataset Cannot Be Removed"));
                        }
                    } else {
                        return reject(new InsightError("Dataset Cannot Be Removed"));
                    }
                } catch (error) {
                    return reject(new InsightError("Dataset Cannot Be Removed"));
                }
            }
        );
    }
    public performQuery(query: any): Promise<any[]> {
        // Read Bob's reply and run just the first it test (add dataset test), look at result
        /* High level plan
           Declare any required variables - sort of know this
           Check for whether query is structured correctly  //
           Get the ID of a dataset to search on - I know this  // does order matter?  // how far should I go?
           Do query***
                Vague - ask TA
           If there's ORDER, sort***
         */
        // Declare VARIABLES, GLOBALS/CONSTANTS
        // binding
        let that = this;
        const qHelper: QueryHelper = new QueryHelper(that.datasets, that.dataEntries);
        //
        return new Promise<any[]>(function (resolve, reject) {
            // NOTE
            // Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS
            // GROUPS can have keys not in COLUMNS
            // all VK are either from COLUMNS or APPLY
            if (that.datasets.length === 0) {
                return reject(new InsightError("No Dataset Present"));
            }
            try {
                // see if it's an object
                JSON.stringify(query);
            } catch (err) {
                return reject(new InsightError("Query isn't JSON object"));     // can't turn it into string
            }
            // query has to have WHERE and OPTIONS (TRANSFORMATIONS is optional)
            if (!qHelper.querySize(query)) {
                return reject(new InsightError("Not correct number of keys in query"));
            }
            // OPTIONS must have COLUMNS, (ORDER is optional)
            if (!qHelper.isOptionsValid(query)) {
                return reject(new InsightError("OPTIONS is invalid"));
            }
            // search for applykeys
            let applyKeys: string[] = [];
            let apply;
            let group;
            try {
                apply = query["TRANSFORMATIONS"]["APPLY"];
                group = query["TRANSFORMATIONS"]["GROUP"];
            } catch {
                // do nth - no APPLY
            }
            // GROUP and APPLY both need to exists
            if (group === undefined && apply !== undefined) {
                return reject(new InsightError("APPLY exists but GROUP doesn't"));
            }
            if (group !== undefined && apply === undefined) {
                return reject(new InsightError("GROUP exists but Apply doesn't"));
            }
            // if there is an array of applyKeys, check if the contents are valid
            if (apply !== undefined) {
                // check whether GROUP exists
                if (group === undefined) {
                    return reject(new InsightError("Apply exists but GROUP doesn't"));
                }
                // TODO
                if (! qHelper.validApplyKeys(applyKeys)) {
                    return reject (new InsightError("Apply keys contains underscore"));
                }
                // let a = apply
                for (let appObj of apply) {
                    let key = Object.keys(appObj)[0];
                    applyKeys.push(key);
                }
            }
            if (!qHelper.validColumns(query, applyKeys)) {
                return reject(new InsightError("COLUMNS is invalid"));
            }
            if (!qHelper.validOrder(query, applyKeys)) {
                return reject(new InsightError("ORDER is invalid"));
            }
            // check whether all keys in WHERE and COLUMNS are the same
            // in COLUMNS
            let columnsVKs = query["OPTIONS"]["COLUMNS"];
            if (!qHelper.correctDatasetIDs(columnsVKs, applyKeys)) {
                return reject(new InsightError("Dataset IDs in COLUMNS are inconsistent"));
            }
            // By this point, ID of all VKs are the same
            // (potential) ID of the dataset to search for
            let firstValidID = columnsVKs[0].split("_")[0];
            // list of all added dataset ID - it's dataEntries or datasets
            let json = that.datasets;
            let idArray = [];
            for (let dataset of json) {
                idArray.push(dataset["id"]);
            }
            if (!idArray.includes(firstValidID)) {
                return reject(new InsightError("Dataset with id: " + firstValidID + " isn't added"));
            }
            // assume that COLUMNS ID is the dataset ID
            // read dataset with ID firstValidID result
            let resultJson = that.dataEntries;
            let result: any[] = [];
            let j;
            // kind of dataset that we are searching in
            let kind;

            for (let course of resultJson) {
                if (firstValidID === course["dataID"]) {
                    for (let section of course["data"]) {
                        j = course;
                        kind = course["kind"];
                        let w = query["WHERE"];
                        try {
                            // TODO
                            if (qHelper.isSectionSatisfied(w, section, firstValidID)) {
                                if (!result.includes(section)) {
                                    result.push(section);
                                }
                            }
                        } catch (err) {
                            return reject(new InsightError("Something is wrong with filtering results"));
                        }
                    }
                }
            }

            // select COLUMNS to return http://wiki.analytica.com/Object_Manipulation_Typescript_Commands
            // list all keys - order matters
            // TODO - make a function for picking fields for COURSES and ROOMS
            let finalResult: any[] | PromiseLike<any[]> = [];
            // check KIND
            if (kind === "courses") {
                try {
                    // TODO - include applyKey as well
                    let c: string[] = [];
                    for (let i of that.datasets) {
                        c.push(i.kind);
                    }
                    if (c.includes("courses")) {
                        finalResult = qHelper.selectCouresFields(query, result, finalResult, apply);
                    } else {
                        return reject(new InsightError("No Courses Dataset Found"));
                    }
                } catch (err) {
                    // catches InsightError
                    return reject(new InsightError("Something is wrong with selecting courses fields"));
                }
            } else {
                // TODO
                try {
                    let r: string[] = [];
                    for (let i of that.datasets) {
                        r.push(i.kind);
                    }
                    if (r.includes("rooms")) {
                        finalResult = qHelper.selectRoomsFields(query, result, finalResult, apply);
                    } else {
                        return reject(new InsightError("No Rooms Dataset Found"));
                    }
                } catch (err) {
                    // catches InsightError
                    return reject(err);
                }
            }
            // remove 1900 year if it has condition concerning year
            // https://stackoverflow.com/questions/46794232/group-objects-by-multiple-properties-in-
            // array-then-sum-up-their-values
            let sortedResult: any[];
            if (group !== undefined && apply !== undefined) {
                // TODO qd2_2GroupsAVG.json - abstract to method
                // throw new Error();
                //
                let groupNames = qHelper.generateGroupNames(apply, group, finalResult);
                // create an array where each entry is an object containing conditions to be in each entry
                // TODO explain
                let groupedResult = qHelper.performGroup(finalResult, columnsVKs, groupNames, apply);
                // get all the entries that contribute to each row of groupResult
                let members = qHelper.getMembers(groupedResult, finalResult, apply, columnsVKs);
                // results of group after calculating aggregated values
                let groupWithAggegrates = qHelper.addAggregated(groupedResult, members, columnsVKs, apply);
                // ORDER for D2 seems to act differently
                // if there's ORDER -sort increasing ORDER
                if (query["OPTIONS"]["ORDER"] !== undefined) {
                    // simple sort - based on string
                    let columns = query["OPTIONS"]["COLUMNS"];
                    let order = query["OPTIONS"]["ORDER"];
                    if (typeof order === "string") {
                        // sort based on ORDER
                        // TODO - use comparator
                        sortedResult = groupWithAggegrates.sort(qHelper.sortMultipleKeys(columns, "UP"));
                    } else {
                        // obj
                        if (query["OPTIONS"]["ORDER"]["keys"].length === 0) {
                            return reject(new InsightError("No key in ORDER keys Object"));
                        } else if (query["OPTIONS"]["ORDER"]["keys"].length === 1) {
                            if (query["OPTIONS"]["ORDER"]["dir"] === "UP") {
                                let key = query["OPTIONS"]["ORDER"]["keys"][0];
                                sortedResult = groupWithAggegrates.sort(function (a: any, b: any) {
                                    if (typeof a[key] === "number") {
                                        return a[key] - b[key];
                                    } else if (typeof a[key] === "string") {
                                        return a[key] > b[key] ? 1 : -1;
                                    }
                                });
                            } else if (query["OPTIONS"]["ORDER"]["dir"] === "DOWN") {
                                let key = query["OPTIONS"]["ORDER"]["keys"][0];
                                sortedResult = groupWithAggegrates.sort(function (a: any, b: any) {
                                    if (typeof a[key] === "number") {
                                        return b[key] - a[key];
                                    } else if (typeof a[key] === "string") {
                                        return b[key] > a[key] ? 1 : -1;
                                    }
                                });
                            }
                        } else {
                            // TODO - many key case
                            if (query["OPTIONS"]["ORDER"]["dir"] === "UP") {
                                let keys = query["OPTIONS"]["ORDER"]["keys"];
                                sortedResult = groupWithAggegrates.sort(qHelper.sortMultipleKeys(keys, "UP"));
                            } else if (query["OPTIONS"]["ORDER"]["dir"] === "DOWN") {
                                let keys = query["OPTIONS"]["ORDER"]["keys"];
                                sortedResult = groupWithAggegrates.sort(qHelper.sortMultipleKeys(keys, "DOWN"));
                            }
                        }
                    }
                } else {
                    // default behavior when there's no ORDER - sort based on first VK
                    if (group.length > 1) {
                        // this case was picked up during generateGroup
                        sortedResult = groupWithAggegrates;
                    } else {
                        let firstKey = query["OPTIONS"]["COLUMNS"][0];
                        sortedResult = groupWithAggegrates.sort(qHelper.dynamicSort(firstKey, "UP"));
                    }
                }
            } else {
                // ORDER https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
                // when there's no ORDER, pick the first VK from COLUMNS
                // if there's ORDER -sort increasing ORDER
                if (query["OPTIONS"]["ORDER"] !== undefined) {
                    // simple sort - based on string
                    let order = query["OPTIONS"]["ORDER"];
                    if (typeof order === "string") {
                        // sort based on ORDER
                        // TODO change to use comparator - apparently D1 sorts differently
                        sortedResult = finalResult.sort(qHelper.dynamicSort(order, "UP"));
                    } else { // obj
                        if (query["OPTIONS"]["ORDER"]["keys"].length === 0) {
                            return reject(new InsightError("No key in ORDER keys Object"));
                        } else if (query["OPTIONS"]["ORDER"]["keys"].length === 1) {
                            if (query["OPTIONS"]["ORDER"]["dir"] === "UP") {
                                let key = query["OPTIONS"]["ORDER"]["keys"][0];
                                sortedResult = finalResult.sort(qHelper.dynamicSort(key, "UP"));
                            } else if (query["OPTIONS"]["ORDER"]["dir"] === "DOWN") {
                                let key = query["OPTIONS"]["ORDER"]["keys"][0];
                                sortedResult = finalResult.sort(qHelper.dynamicSort(key, "DOWN"));
                            }
                        } else {
                            // TODO - many key case
                            if (query["OPTIONS"]["ORDER"]["dir"] === "UP") {
                                let keys = query["OPTIONS"]["ORDER"]["keys"];
                                sortedResult = finalResult.sort(qHelper.sortMultipleKeys(keys, "UP"));
                            } else if (query["OPTIONS"]["ORDER"]["dir"] === "DOWN") {
                                let keys = query["OPTIONS"]["ORDER"]["keys"];
                                sortedResult = finalResult.sort(qHelper.sortMultipleKeys(keys, "DOWN"));
                            }
                        }
                    }
                } else {
                    // default behavior when there's no ORDER - sort based on first VK
                    sortedResult = finalResult.sort(qHelper.dynamicSort(query["OPTIONS"]["COLUMNS"][0], "UP"));
                }
            }
            // Check size if over 5000
            if (5000 >= sortedResult.length) {
                return resolve(sortedResult);
            } else {
                return reject(new InsightError("Query is over 5000 in length"));
            }
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let that = this;
        return Promise.resolve(that.datasets);
    }
}
