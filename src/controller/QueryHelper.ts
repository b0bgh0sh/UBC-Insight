import {InsightDataset, InsightError} from "./IInsightFacade";
import {DataEntry} from "./DataEnrty";
import {Decimal} from "decimal.js";
import * as fs from "fs";

export default class QueryHelper {
    public datasets: InsightDataset[] = [];
    public dataEntries: DataEntry[] = [];
    constructor(dts: InsightDataset[], de: DataEntry[]) {
        this.datasets = dts;
        this.dataEntries = de;
    }
    // HELPERS for performQuery
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // UTILITY HELPERS
    // https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
    // Check whether an object is empty - check with WHERE mostly
    public isEmpty(obj: any) {
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                return false;
            }
        }
        return true;
    }

    // used to sort objects based on key
    // https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
    public dynamicSort(property: string, dir: string) {
        let sortOrder = 1;
        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        if (dir === "UP") {
            return function (a: any, b: any) {
                let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            };
        }
        if (dir === "DOWN") {
            return function (a: any, b: any) {
                let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return -1 * result * sortOrder;
            };
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // STRUCTURAL HELPER
    public querySize(query: any) {
        // NOTE
        // check if there are more than 2 keys
        // - https://stackoverflow.com/questions/38074410/object-length-in-typescript
        if (Object.keys(query).length === 2) {
            // check if the first key is WHERE and second key is OPTIONS
            if (Object.keys(query)[0] !== "WHERE" || Object.keys(query)[1] !== "OPTIONS") {
                return false;
            } else {
                return true;
            }
        } else if (Object.keys(query).length === 3) {
            // TODO - D2
            if (Object.keys(query)[0] !== "WHERE" || Object.keys(query)[1] !== "OPTIONS"
                || Object.keys(query)[2] !== "TRANSFORMATIONS") {
                return false;
            } else {
                return true;
            }
        }
        return true;
        // TODO - expand for D2
    }

    public isOptionsValid(query: any) {
        let optionsValue = query.OPTIONS;
        // length of optionsValue - if 1 the key must be COLUMNS
        if (Object.keys(optionsValue).length === 1) {
            if (Object.keys(optionsValue)[0] !== "COLUMNS") {
                return false;
            } //  if 2 keys,  1st key must be COLUMNS and 2nd key must be ORDER
        } else if (Object.keys(optionsValue).length === 2) {
            if (Object.keys(optionsValue)[0] !== "COLUMNS" || Object.keys(optionsValue)[1] !== "ORDER") {
                return false;
            }
        } else {
            return false;
        }
        return true;
    }

    // Check if there are WHERE & OPTIONS (TRANSFORMATIONS)*
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // FILTER HELPER
    // Does the section satisfies the conditions in WHERE
    // return false if comparison isn't one of
    //  GT, LT, EQ, IS, AND, OR, NOT
    public isSectionSatisfied(obj: any, section: any, firstValidID: string) {
        let that = this;
        // empty obj (WHERE on first call) doesn't have condition, so it pass
        if (that.isEmpty(obj)) {
            return true;
        } else if (Object.keys(obj).length > 0) {
            let comparison = Object.keys(obj)[0];                 // one of AND, OR , IS, GT, LT, EQ
            switch (comparison) {
                case "GT": {
                    return that.comparison("GT", obj, section, firstValidID);
                }
                case "LT": {
                    return that.comparison("LT", obj, section, firstValidID);
                }
                case "EQ": {
                    return that.comparison("EQ", obj, section, firstValidID);
                }
                case "IS": {
                    return that.comparison("IS", obj, section, firstValidID);
                }
                // harder cases - logic
                case "AND": {
                    // q11.json helps
                    let result = true;
                    // rest of Object - an array
                    for (let object of obj[comparison]) {
                        try {
                            result = result && that.solveLogical(object, section, firstValidID);
                        } catch (e) {
                            return new InsightError("solveLogical returns error for AND");
                        }
                    }
                    let a = 1;
                    return result;
                }
                case "OR": {
                    let result = false;
                    // rest of Object - an array
                    for (let object of obj[comparison]) {
                        try {
                            result = result || that.solveLogical(object, section, firstValidID);
                        } catch (e) {
                            return new InsightError("solveLogical returns error for OR");
                        }
                    }
                    return result;
                }
                case "NOT": {
                    // return !
                    let object = obj;
                    return that.solveLogical(object, section, firstValidID);
                }
                // incorrect keys
                default: {
                    return new InsightError("Wrong comparison");
                }
            }
        } else {
            return new InsightError("Invalid WHERE");
        }
        // Solve for keys = IS, NOT, GT, LT, EQ
    }
    // handle string
    public solveString(value: string, content: string) {
        // starts or end with **
        if (value.substr(0, 2) === "**" || value.substr(value.length - 2, value.length) === "**") {
            return new InsightError("String starts or end with **");
        } else if (value.substring(1, value.length - 1).includes("*")) {
            return new InsightError("String includes * between characters");
        }
        // *xx* - contains xx
        if (value.substr(0, 1) === "*" && value.substr(value.length - 1, value.length) === "*") {
            return content.includes(value.substring(1, value.length - 1));
        } else if (value.substr(0, 1) === "*") {                                 // *x - ends with x
            return content.includes(value.substring(1, value.length));
        } else if (value.substr(value.length - 1, value.length) === "*") {              // xx* - starts with xx
            return content.includes(value.substring(0, value.length - 1));
        } else {                                                                              // normal string
            return value === content;
        }
    }
    public comparison(comparison: string, obj: any, section: any, firstValidID: string) {
        let that = this;
        // https://github.com/ubccpsc/310/blob/2018sept/project/Deliverable1.md
        // search for <key>
        // one of Avg, Year (string),
        let o = obj;
        let datasetID = Object.keys(obj[comparison])[0].split("_")[0];
        if (datasetID !== firstValidID) {
            return new InsightError("Wrong dataset ID within WHERE");
        }
        let key = Object.keys(obj[comparison])[0].split("_")[1];
        let w = obj;
        let value = Object.values(obj[comparison])[0];
        let sect  = section.Section;

        switch (comparison) {
            // only numbers
            case "GT": {
                if (typeof value === "number") {
                    if (key === "avg") {
                        let a = 1;
                        return section.Avg > value;
                    } else if (key === "pass") {
                        return section.Pass > value;
                    } else if (key === "fail") {
                        return section.Fail > value;
                    } else if (key === "audit") {
                        return section.Audit > value;
                    } else if (key === "year") {
                        return section.Year > Number(value);
                    } else if (key === "seats") {
                        return section.seats > Number(value);
                    } else if (key === "lat") {
                        return section.lat > Number(value);
                    } else if (key === "lon") {
                        return section.lon > Number(value);
                    } else {
                        return new InsightError("Wrong key GT");
                    }
                } else {
                    return new InsightError("Type of value isn't number GT ");
                }
            }
            case "LT": {
                if (typeof value === "number") {
                    if (key === "avg") {
                        return Number(section.Avg) < Number(value);
                    } else if (key === "pass") {
                        return Number(section.Pass) < Number(value);
                    } else if (key === "fail") {
                        return Number(section.Fail) < Number(value);
                    } else if (key === "audit") {
                        return Number(section.Audit) < Number(value);
                    } else if (key === "year") {
                        return Number(section.Year) < Number(value);
                    } else if (key === "seats") {
                        return Number(section.seats) < Number(value);
                    } else if (key === "lat") {
                        return Number(section.lat) < Number(value);
                    } else if (key === "lon") {
                        return Number(section.lon) < Number(value);
                    } else {
                        return new InsightError("Wrong key LT");
                    }
                } else {
                    return new InsightError("Type of value isn't number LT");
                }
            }
            case "EQ": {
                if (typeof value === "number") {
                    if (key === "avg") {
                        return Number(section.Avg) === Number(value);
                    } else if (key === "pass") {
                        return Number(section.Pass) === Number(value);
                    } else if (key === "fail") {
                        return Number(section.Fail) === Number(value);
                    } else if (key === "audit") {
                        return Number(section.Audit) === Number(value);
                    } else if (key === "year") {
                        return Number(section.Year) === Number(value);
                    } else if (key === "seats") {
                        return Number(section.seats) === Number(value);
                    } else if (key === "lat") {
                        return Number(section.lat) === Number(value);
                    } else if (key === "lon") {
                        return section.lon === Number(value);
                    } else {
                        return new InsightError("Wrong key EQ");
                    }
                } else {
                    return new InsightError("Type of value isn't number EQ");
                }
            }
            // only string TODO - wildcards
            case "IS": {
                if (typeof value === "string") {
                    if (key === "dept") {
                        return that.solveString(String(value), String(section.Subject));
                    } else if (key === "id") {
                        return that.solveString(String(value), String(section.Course));
                    } else if (key === "instructor") {
                        // TODO
                        return that.solveString(String(value), String(section.Professor));
                    } else if (key === "title") {
                        return that.solveString(String(value), String(section.Title));
                    } else if (key === "uuid") {
                        return that.solveString(String(value), String(section.id));
                    } else if (key === "fullname") {
                        return that.solveString(String(value), String(section.fname));
                    } else if (key === "shortname") {
                        return that.solveString(String(value), String(section.sname));
                    } else if (key === "address") {
                        return that.solveString(String(value), String(section.addr));
                    } else if (key === "name") {
                        return that.solveString(String(value), String(section.name));
                    } else if (key === "number") {
                        return that.solveString(String(value), String(section.number));
                    } else if (key === "type") {
                        return that.solveString(String(value), String(section.type));
                    } else if (key === "furniture") {
                        return that.solveString(String(value), String(section.furn));
                    } else if (key === "href") {
                        return that.solveString(String(value), String(section.href));
                    } else {
                        return new InsightError("Wrong key IS");
                    }
                } else {
                    return new InsightError("Type of value isn't string IS");
                }
            }
            // shouldnt even need this but ok
            default: {
                return false;
            }
        }
    }
    // handles AND, OR and NOT
    // @ts-ignore
    public solveLogical(input: any, section: any, firstValidID: string) {
        let that = this;
        let comparison = Object.keys(input)[0];
        // AND or OR case
        switch (comparison) {
            case "LT": {
                return that.comparison("LT", input, section, firstValidID);
            }
            case "GT": {
                return that.comparison("GT", input, section, firstValidID);
            }
            case "EQ": {
                return that.comparison("EQ", input, section, firstValidID);
            }
            case "IS": {
                return that.comparison("IS", input, section, firstValidID);
            }
            case "AND": {
                let andObject1 = input[comparison][0];
                let andObject2 = input[comparison][1];
                if (that.isEmpty(andObject1) || that.isEmpty(andObject2)) {
                    return new InsightError("And object cant be empty");
                }
                return that.solveLogical(andObject1, section, firstValidID) &&
                    that.solveLogical(andObject2, section, firstValidID);
            }
            case "OR": {
                let orObject1 = input[comparison][0];
                let orObject2 = input[comparison][1];
                if (that.isEmpty(orObject1) || that.isEmpty(orObject1)) {
                    return new InsightError("Or object cant be empty");
                }
                let a = 1;
                return that.solveLogical(orObject1, section, firstValidID) ||
                    that.solveLogical(orObject2, section, firstValidID);
            }
            case "NOT": {
                // key of the first sub node
                let notKey = Object.keys(input)[0];
                let notObject = input[notKey];
                if (that.isEmpty(notObject)) {
                    return new InsightError("Not object cant be empty");
                }
                return !that.solveLogical(notObject, section, firstValidID);
            }
            default: {
                return new InsightError("Error in solve logical");
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // VALIDITY HELPER
    public areKeysValidRooms(arrayOfVKs: string[], obj: any) {
        // TODO - expand for check with apply keys
        let that = this;
        let keys = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type", "furniture",
            "href"];
        // Check each key
        for (let validKey of arrayOfVKs) {
            let split = validKey.split("_");
            let ID = split[0];
            let key = split[1];
            // remove keys that already exist
            if (!obj.includes(ID)) {
                return false;
            } else if (!keys.includes(key)) {
                return false;
            }
        }
        return true;
    }
    public areKeysValidCourses(arrayOfVKs: string[], obj: any) {
        // TODO - expand for check with apply keys
        let that = this;
        let keys = ["dept", "id", "instructor", "title", "pass", "fail", "audit", "uuid", "avg", "year"];
        // Check each key
        for (let validKey of arrayOfVKs) {
            let split = validKey.split("_");
            let ID = split[0];
            let key = split[1];
            // remove keys that already exist
            if (!obj.includes(ID)) {
                return false;
            } else if (!keys.includes(key)) {
                return false;
            }
        }
        return true;
    }
    // Check whether all keys in columns are valid
    // (XXX_YYY)
    //  ID part (XXX) must be added already
    //  Key part (YYY) must be valid
    // no duplication
    public areKeysValid(arrayOfKeys: string[]) {
        let that = this;
        // get IDs of datasets added
        let datasetIDs = that.datasets;
        let json = datasetIDs;
        let idArray = [];
        for (let dataset of json) {
            idArray.push(dataset["id"]);
        }
        let potentialID = arrayOfKeys[0].split("_")[0];
        let kind;
        for (let dataset of json) {
            if (potentialID === dataset["id"]) {
                kind = dataset["kind"];
            }
        }
        if (kind === "courses") {
            return that.areKeysValidCourses(arrayOfKeys, idArray);
        } else if (kind === "rooms") {
            return that.areKeysValidRooms(arrayOfKeys, idArray);
        } else {
            return false;
        }
    }

    public validColumns(query: any, applyKeys: string[]) {
        // TODO
        let that = this;
        // divide into WHERE and OPTIONS values
        // Both shouldn't return any error if valid
        let columnsValue = query["OPTIONS"]["COLUMNS"];
        // check if all keys in COLUMNS are valid
        if (query["OPTIONS"]["COLUMNS"].length < 1) {
           return false;
        }
        if (that.areKeysValid(columnsValue)) {
            return true;
        } else {
            // if NOT all keys are valid, the invalid ones must be in
            // check that the keys in columnsValue are in applyKeys
            let inApplyKeys;
            for (let key of columnsValue) {
                if (applyKeys.length > 0) {
                    if (applyKeys.includes(key)) {
                        return true;
                    }
                }
            }
            return false;
        }
    }

    // Helper for checking for validStructure
    // Helper for checking for validStructure
    // Does it have a WHERE?
    // Does it have a OPTIONS?
    // Does it have a COLUMNS
    // etc
    // Doesn't check whether keys in WHERE are valid
    //
    // USED to check whether all keys in COLUMNS has the same dataset ID
    public correctDatasetIDs(columns: string[], applyKeys: string[]) {
        let firstValidKey = columns[0];
        for (let key of columns) {
            let firstID = firstValidKey.split("_");
            if (firstID[0] !== key.split("_")[0] && !applyKeys.includes(key)) {
                return false;
            }
        }
        return true;
    }

    // Check for validity of keys in APPLY
    // no _
    public validApplyKeys(applyKeys: string[]) {
        for (let key of applyKeys) {
            if (key.includes("_")) {
                return false;
            }
        }
        return true;
    }
    // check whether ORDER (object is valid)
    public validOrderObject(query: any, applyKeys: string[]) {
        let that = this;
        let orderValue = query["OPTIONS"]["ORDER"];
        let columnsValue = query["OPTIONS"]["COLUMNS"];
        if (orderValue["dir"] === "UP" || orderValue["dir"] === "DOWN") {               // valid dir value
            // check if all the keys are valid and are either in COLUMNS or are one of applykey, or group
            for (let key of query["OPTIONS"]["ORDER"]["keys"]) {
                if (typeof key === "string")  {
                    if (applyKeys.length === 0) {
                        // must be in COLUMNS
                        if (! columnsValue.includes(key)) {
                            return false;
                        }
                    } else {
                        if (!columnsValue.includes(key) && !applyKeys.includes(key)) {
                            return false;
                        }
                    }
                } else {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }
    // Check if ORDER is valid
    // two cases - simple and object value type
    public validOrder(query: any, applykeys: string[]) {
        let that = this;
        // this is either a string
        // or an object with keys dir and keys
        let orderValue = query["OPTIONS"]["ORDER"];
        let columnsValue = query["OPTIONS"]["COLUMNS"];
        // if there's VK in ORDER
        // how many keys in ORDER? -> 1
        // if we have ORDER value
        if (orderValue !== undefined) {
            // simpe query - string
            if (typeof orderValue === "string") {
                if (!columnsValue.includes(orderValue)) {
                    return false;
                }
                // refactor else case to a function TODO
            } else if (orderValue["dir"] !== undefined && orderValue["keys"].length > 0) { // check for dir and keys\
                let a = 1;
                return that.validOrderObject(query, applykeys);
            } else {
                return false;
            }
        }
        return true;
    }
    // https://stackoverflow.com/questions/46794232/group-objects-
    // by-multiple-properties-in-array-then-sum-up-their-values
    // return combinations of all the unique values based on GROUP
    public generateGroupNames(apply: any[], group: any, finalResult: any[]) {
        // PREP any Aggregation here because order matters? - TODO
        // Get all the names of the groups condition1_condition2_...
        let that = this;
        let groupNameArray: string[] = [];
        if (apply !== undefined && group !== undefined) {
            for (let section of finalResult) {
                let groupName = "";
                for (let name of group) {
                    groupName += section[name] + "_";
                }
                groupNameArray.push(groupName.substring(0, groupName.length - 1));
            }
        }
        let uniqueNameArray: string[] = [];
        for (let groupName of groupNameArray) {
            if (!uniqueNameArray.includes(groupName)) {
                uniqueNameArray.push(groupName);
            }
        }
        // returns the name of each group
        return uniqueNameArray;
    }

    // creating an Array with length = #
    // each entry is an object with combination of group unique key values
    // https://stackoverflow.com/questions/46794232/group-objects-by-multiple-properties-in-array-
    // then-sum-up-their-values
    public performGroup(input: any[], columns: string[], uniqueNameArray: string[], apply: any) {
        let that = this;
        let groups: any = {};
        let i = 0;
        let result = input.reduce(function (accumulator, current) {
            for (let key of uniqueNameArray) {
                if (!groups[key]) {
                    // TODO
                    let k = key.split("_");
                    // creating obj to push
                    let o: any = {};
                    let index = 0;
                    for (let c of columns) {
                        // check if it's VK or not - VK contains _
                        if (c.split("_").length > 1) {
                            // TODO - check if the value should be numeric
                            if (that.isNumberic(c.split("_")[1])) {
                                o[c] = Number(key.split("_")[index]);
                            } else {
                                o[c] = key.split("_")[index];
                            }
                            index++;
                        }
                    }
                    groups[key] = o;
                    accumulator.push(groups[key]);
                }
            }
            return accumulator;
        }, []);
        return result;
    }

    // returns true if the type should be numeric
    public isNumberic(key: string) {
        return key === "avg" || key === "fail" || key === "pass" || key === "audit" || key === "year" || key === "lat"
            || key === "lon" || key === "seats";
    }

    // add all aggregation to the end of the array
    public getMembers(groupedResult: any[], finalResults: any[], apply: any, columns: string[]) {
        let store: any = {};
        // if an object in finalResult = group, push it in to store before doing aggregation

        let g1 = groupedResult[1];
        let f1 = finalResults[1];
        let k;
        for (let group of groupedResult) {
            let array: any[] = [];
            for (let result of finalResults) {
                let allEQ = true;
                for (let key of Object.keys(group)) {
                    let g = group[key];
                    let r = result[key];
                    if (!(group[key] === result[key])) {
                        allEQ = false;
                        break;
                    }
                    let c = 2;
                }
                if (allEQ === true) {
                    array.push(result);
                }
            }
            let groupName = Object.values(group);
            let name = "";
            for (let v of groupName) {
                name += v + "_";
            }
            store[name.substring(0, name.length - 1)] = array;
        }
        return store;
    }

    public addAggregated(groupedResult: any[], members: any, columns: string[], apply: any[]) {
        let that = this;
        for (let group of groupedResult) {
            // find all members of group g
            let groupName = "";
            for (let value of Object.values(group)) {
                groupName += String(value) + "_";
            }
            groupName = groupName.substring(0, groupName.length - 1);
            // entries is array of objects
            let entries = members[groupName];
            // find out the aggregation needed
            for (let aggreObj of apply) {
                // name of the new column in obj
                let newName = Object.keys(aggreObj)[0];
                let aggreInfo = aggreObj[newName];
                // AVG, MIN, MAX, ....
                let functionName = Object.keys(aggreInfo)[0];
                let keyForAggre = aggreInfo[functionName];
                // a number of avg, min,... from sets of object
                let aggregateValue = that.doAggregation(functionName, entries, keyForAggre);
                group[newName] = aggregateValue;
            }
        }
        return groupedResult;
    }

    public selectRoomsFields(query: any, result: any[], finalResult: any[], apply: any) {
        let that = this;
        let datasetIDs: any[] = [];
        for (let i of that.datasets) {
            datasetIDs.push(i.id);
        }
        for (let entry of result) {
            let obj: any = {};
            for (let VK of query["OPTIONS"]["COLUMNS"]) {
                let key = VK.split("_")[1];
                // VK keys
                if (that.areKeysValidRooms([VK], datasetIDs)) {
                    switch (key) {
                        case "fullname": {
                            obj[VK] = String(entry.fname);
                            break;
                        }
                        case "shortname": {
                            obj[VK] = String(entry.sname);
                            break;
                        }
                        case "number": {
                            obj[VK] = String(entry.number);
                            break;
                        }
                        case "name": {
                            obj[VK] = String(entry.name);
                            break;
                        }
                        case "address": {
                            obj[VK] = String(entry.addr);
                            break;
                        }
                        case "lat": {
                            obj[VK] = Number(entry.lat);
                            break;
                        }
                        case "lon": {
                            obj[VK] = Number(entry.lon);
                            break;
                        }
                        case "seats": {
                            obj[VK] = Number(entry.seats);
                            break;
                        }
                        case "type": {
                            obj[VK] = String(entry.type);
                            break;
                        }
                        case "furniture": {
                            obj[VK] = String(entry.furn);
                            break;
                        }
                        case "href": {
                            obj[VK] = String(entry.href);
                            break;
                        }
                    }
                }
            }
            // key is from apply - used to put fields to be used with aggre functions
            // obj[VK]
            if (apply !== undefined) {
                for (let rqField of apply) {
                    let newName = Object.keys(rqField)[0];
                    let requiredObj = rqField[newName];
                    let requiredObjKey = Object.keys(requiredObj)[0];
                    let VK = requiredObj[requiredObjKey];
                    let key = VK.split("_")[1];
                    switch (key) {
                        case "fullname": {
                            obj[VK] = String(entry.fname);
                            break;
                        }
                        case "shortname": {
                            obj[VK] = String(entry.sname);
                            break;
                        }
                        case "number": {
                            obj[VK] = String(entry.number);
                            break;
                        }
                        case "name": {
                            obj[VK] = String(entry.name);
                            break;
                        }
                        case "address": {
                            obj[VK] = String(entry.addr);
                            break;
                        }
                        case "lat": {
                            obj[VK] = Number(entry.lat);
                            break;
                        }
                        case "lon": {
                            obj[VK] = Number(entry.lon);
                            break;
                        }
                        case "seats": {
                            obj[VK] = Number(entry.seats);
                            break;
                        }
                        case "type": {
                            obj[VK] = String(entry.type);
                            break;
                        }
                        case "furniture": {
                            obj[VK] = String(entry.furn);
                            break;
                        }
                        case "href": {
                            obj[VK] = String(entry.href);
                            break;
                        }
                    }
                }
            }
            // let requiredField =
            // switch () {
            finalResult.push(obj);
        }
        return finalResult;
    }
    // also add extraneous fields to do aggregation later
    public selectCouresFields(query: any, result: any[], finalResult: any[], apply: any) {
        let that = this;
        let datasetIDs: any[] = [];
        for (let i of that.datasets) {
            datasetIDs.push(i.id);
        }
        for (let section of result) {
            let obj: any = {};
            // finalResult.push(obj);
            for (let VK of query["OPTIONS"]["COLUMNS"]) {
                let key = VK.split("_")[1];
                // if key is VK -
                if (that.areKeysValidCourses([VK], datasetIDs)) {
                    switch (key) {
                        case "avg": {
                            obj[VK] = Number(section.Avg);
                            break;
                        }
                        case "dept": {
                            obj[VK] = String(section.Subject);
                            break;
                        }
                        case "id": {
                            obj[VK] = String(section.Course);
                            break;
                        }
                        case "instructor": {
                            obj[VK] = String(section.Professor);
                            break;
                        }
                        case "title": {
                            obj[VK] = String(section.Title);
                            break;
                        }
                        case "pass": {
                            obj[VK] = Number(section.Pass);
                            break;
                        }
                        case "fail": {
                            obj[VK] = Number(section.Fail);
                            break;
                        }
                        case "audit": {
                            obj[VK] = Number(section.Audit);
                            break;
                        }
                        case "uuid": {
                            obj[VK] = String(section.id);
                            break;
                        }
                        case "year": {
                            // obj[VK] = Number(section.Year);
                            if (section.Section === "overall") {
                                obj[VK] = 1900;
                            } else {
                                obj[VK] = Number(section.Year);
                            }

                            // obj[VK] = Number(section.Year);
                            break;
                        }
                    }
                }
            }
            // key is from apply - used to put fields to be used with aggre functions
            // obj[VK]
            if (apply !== undefined) {
                for (let rqField of apply) {
                    let newName = Object.keys(rqField)[0];
                    let requiredObj = rqField[newName];
                    let requiredObjKey = Object.keys(requiredObj)[0];
                    let VK = requiredObj[requiredObjKey];
                    let key = VK.split("_")[1];
                    switch (key) {
                        case "avg": {
                            obj[VK] = Number(section.Avg);
                            break;
                        }
                        case "dept": {
                            obj[VK] = String(section.Subject);
                            break;
                        }
                        case "id": {
                            obj[VK] = String(section.Course);
                            break;
                        }
                        case "instructor": {
                            obj[VK] = String(section.Professor);
                            break;
                        }
                        case "title": {
                            obj[VK] = String(section.Title);
                            break;
                        }
                        case "pass": {
                            obj[VK] = Number(section.Pass);
                            break;
                        }
                        case "fail": {
                            obj[VK] = Number(section.Fail);
                            break;
                        }
                        case "audit": {
                            obj[VK] = Number(section.Audit);
                            break;
                        }
                        case "uuid": {
                            obj[VK] = String(section.id);
                            break;
                        }
                        case "year": {
                            if (section.Section === "overall") {
                                obj[VK] = 1900;
                            } else {
                                obj[VK] = Number(section.Year);
                            }
                            break;
                        }
                    }
                }
            }
            // let requiredField =
            // switch () {
            finalResult.push(obj);
        }
        return finalResult;
    }

    // perform sort for mutiple keys
    // https://stackoverflow.com/questions/4576714/sort-by-two-values-prioritizing-on-one-of-them
    public sortMultipleKeys(listOfKeys: string[], dir: string): any {
        let that = this;
        let firstKey: string = listOfKeys[0];
        let restOfKeys: string[] = [];
        for (let i = 1; i < listOfKeys.length; i++) {
            restOfKeys.push(listOfKeys[i]);
        }
        return function (x: any, y: any) {
            // INCREASING ORDER
            if (listOfKeys.length === 1) {
                return that.comparatorEnd(firstKey, dir, x, y);
            } else {
                return that.comparatorIterate(listOfKeys, dir, x, y);
            }
        };
    }

    public comparatorEnd(key: string, dir: string, x: any, y: any) {
        if (dir === "UP") {
            if (typeof x[key] === "number") {
                let n = x[key] - y[key];
                if (n !== 0) {
                    return n;
                } else {
                    return 1;
                }
            }
            if (typeof x[key] === "string") {
                let n = x[key] > y[key];
                if (n) {
                    return 1;
                } else {
                    return 0;
                }
            }
        } else if (dir === "DOWN") {
            if (typeof x[key] === "number") {
                let n = y[key] - x[key];
                if (n !== 0) {
                    return n;
                } else {
                    return 1;
                }
            }
            if (typeof x[key] === "string") {
                let n = x[key] > y[key];
                if (n) {
                    return -1;
                } else {
                    return 1;
                }
            }
        }
    }

    public comparatorIterate(keys: string[], dir: string, x: any, y: any): number {
        let that = this;
        let firstKey: string = keys[0];
        let restOfKeys: string[] = [];
        for (let i = 1; i < keys.length; i++) {
            restOfKeys.push(keys[i]);
        }
        if (keys.length === 1) {
            return that.comparatorEnd(firstKey, dir, x, y);
        } else {
            if (dir === "UP") {
                if (typeof x[firstKey] === "number") {
                    let n = x[firstKey] - y[firstKey];
                    if (n !== 0) {
                        return n;
                    } else {
                        return that.comparatorIterate(restOfKeys, dir, x, y);
                    }
                }
                if (typeof x[firstKey] === "string") {
                    let n = x[firstKey] > y[firstKey];
                    let eq = x[firstKey] === y[firstKey];
                    if (!eq) {
                        if (n) {
                            return 1;
                        } else {
                            return -1;
                        }
                    } else {
                        // return
                        return that.comparatorIterate(restOfKeys, dir, x, y);
                    }
                }
            } else if (dir === "DOWN") {
                if (typeof x[firstKey] === "number") {
                    let n = y[firstKey] - x[firstKey];
                    if (n !== 0) {
                        return n;
                    } else {
                        return that.comparatorIterate(restOfKeys, dir, x, y);
                    }
                }
                if (typeof x[firstKey] === "string") {
                    let n = x[firstKey] > y[firstKey];
                    let eq = x[firstKey] === y[firstKey];
                    if (!eq) {
                        if (n) {
                            return -1;
                        } else {
                            return 1;
                        }
                    } else {
                        return that.comparatorIterate(restOfKeys, dir, x, y);
                    }
                }
            }
        }
    }
    public doAggregation(funct: string, subsets: any[], VK: string) {
        let that = this;
        let result: any;
        switch (funct) {
            case "AVG": {
                result = that.avgOfResult(subsets, VK);
                break;
            }
            case "MAX": {
                result = that.maxOfResult(subsets, VK);
                break;
            }
            case "MIN": {
                result = that.minOfResult(subsets, VK);
                break;
            }
            case "COUNT": {
                result = that.countOfResult(subsets, VK);
                break;
            }
            case "SUM": {
                result = that.sumOfResult(subsets, VK);
                break;
            }
        }
        return result;

    }

    // Other JS/Typescript considerations
    // USED after selecting the fields so the ID is in COLUMNS
    // Given a result and a key, return the max value with field key from all objects in result
    public maxOfResult(result: any, key: string) {
        let max = -1 * Number.MAX_VALUE;
        for (let section of result) {
            if (typeof section[key] === "number") {
                if (section[key] > max) {
                    max = section[key];
                }
            } else {
                return new InsightError("Type not number in SUM");
            }
        }
        return max;
    }

    // Given a result and a key, return the min value with field key from all objects in result
    public minOfResult(result: any, key: string) {
        let min = Number.MAX_VALUE;
        for (let section of result) {
            if (typeof section[key] === "number") {
                if (section[key] < min) {
                    min = section[key];
                }
            } else {
                return new InsightError("Type not number in SUM");
            }
        }
        return min;
    }

    // Given a result and a key, return the avg value with field key from all objects in result
    public avgOfResult(result: any, key: string) {
        let total = new Decimal(0.0);
        for (let section of result) {
            if (typeof section[key] === "number") {
                total = total.add(section[key]);
            } else {
                return new InsightError("Type not number in SUM");
            }
        }
        let avg = total.toNumber() / result.length;
        return Number(avg.toFixed(2));
    }

    // Given a result and a key, return the count value with field key from all objects in result
    // qd2count_test
    // all row has 0 fail so COUNT is 1 (1 value of fail)
    public countOfResult(result: any[], key: string) {
        let count = 0;
        let uniqueValues: any[] = [];
        for (let section of result) {
            if (!uniqueValues.includes(section[key])) {
                uniqueValues.push(section[key]);
                count++;
            }
            // do nth for non-unique value
        }
        return count;
    }

    // Given a result and a key, return the sum value with field key from all objects in result
    public sumOfResult(result: any[], key: string) {
        let total = new Decimal(0.0);
        for (let section of result) {
            if (typeof section[key] === "number") {
                total = total.add(section[key]);
            } else {
                return new InsightError("Type not number in SUM");
            }
        }
        return Number(total.toNumber().toFixed(2));
    }
}
