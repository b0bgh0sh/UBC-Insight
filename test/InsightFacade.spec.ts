import {expect} from "chai";

import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {RoomFormatter} from "../src/controller/RoomFormatter";

// This should match the JSON schema described in test/query.schema.json
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: string | string[];
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the Before All hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        test1: "./test/data/test1.zip",
        test2: "./test/data/test2.zip",
        test3: "./test/data/test3.zip",
        test4: "./test/data/test4.zip",
        test5: "./test/data/test5.zip",
        test6: "./test/data/test6.zip",
        test7: "./test/data/test7.zip",
        test8: "./test/data/test8.zip",
        test9: "./test/data/test9.zip",
        test10: "./test/data/test10.zip",
        test11: "./test/data/test11.zip",
        test12: "./test/data/test12.zip",
        test13: "./test/data/test13.zip",
        // roomsError: "./test/data/roomsError.zip",
        rooms: "./test/data/rooms.zip",
        courses2: "./test/data/courses2.zip"
    };

    let insightFacade: InsightFacade;
    let datasets: { [id: string]: string };

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToLoad)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return {[Object.keys(datasetsToLoad)[i]]: buf.toString("base64")};
            });
            datasets = Object.assign({}, ...loadedDatasets);
            expect(Object.keys(datasets)).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should add a valid dataset", async () => {
        const id: string = "courses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });
    it("Should add a second valid dataset", async () => {
        const id: string = "courses";
        const id2: string = "courses2";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id, id2]);
        }
    });
    it("Should remove the second valid dataset", async () => {
        const id: string = "courses2";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });

    // Test to see if the list of database is correct.
    it("Should list the added database correctly", async () => {
        const iD: string = "courses";
        const dts: InsightDataset[] = [{id: iD, kind: InsightDatasetKind.Courses, numRows: 64612}];
        let response: any[];

        try {
            response = await insightFacade.listDatasets();
        } finally {
            expect(response).to.deep.equal(dts);
        }
    });
    it("Should not be able to add the same dataset", async () => {
        const id: string = "courses";
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should be able to add same dataset with a different name", async  () => {
        let response: string[];
        const id: string = "test6";
        const dts: string[] = ["courses", "test6"];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(dts);
        }
    });

    it("Should be able to remove the valid dataset with different id", async () => {
        const id: string = "test6";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
    // Test to see if the list of database is correct.
    it("Should still list the courses dataset correctly", async () => {
        const iD: string = "courses";
        const dts: InsightDataset[] = [{id: iD, kind: InsightDatasetKind.Courses, numRows: 64612}];
        let response: InsightDataset[];

        try {
            response = await insightFacade.listDatasets();
        } finally {
            expect(response).to.deep.equal(dts);
        }
    });

    // Can't remove a dataset with invalid id.
    it("Should not remove, instead reject with InsightError because of invalid (empty) id", async () => {
        const id: string = "";
        let response: any;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // This is an example of a pending test. Add a callback function to make the test run.
    it("Should remove the courses dataset", async () => {
        const id: string = "courses";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
    it("Should not be able to add an empty dataset", async () => {
        const id: string = "test1";
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("Should not be able to add an invalid dataset with only one invalid course", async () => {
        const id: string = "test2";
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should not be able to add an invalid dataset with no json files", async () => {
        const id: string = "test3";
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("Should be able to add dataset with multiple valid dataset", async () => {
        const id: string = "test4";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });

    it("Should remove the test4 dataset", async () => {
        const id: string = "test4";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
    it("Should be able to add dataset of a course with multiple section and one with no sections", async () => {
        const id: string = "test5";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });
    it("Should remove the test5 dataset", async () => {
        const id: string = "test5";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
    it("Shouldn't be able to add a dataset with no valid sections", async () => {
        const id: string = "test7";
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("Should not be able to add dataset with no courses folder", async () => {
        const id: string = "test8";
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("Should be able to add dataset with one valid course and rest not valid", async () => {
       const id: string = "test9";
       let response: string[];

       try {
           response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
       } catch (err) {
           response = err;
       } finally {
           expect(response).to.deep.equal([id]);
       }
    });
    it("Should be able to remove test9", async () => {
        const id: string = "test9";
        let response: any;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
    it("Should not be able to add dataset with empty json courses", async () => {
        const id: string = "test10";
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("Should not be able to add dataset with two empty json files and one txt file", async () => {
        const id: string = "test11";
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    it("Should be able to add dataset with one valid json course and rest txt files", async () => {
        const id: string = "test12";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });

    it ("Should be able to remove test12 dataset", async () => {
       const id: string = "test12";
       let response: string;

       try {
           response = await insightFacade.removeDataset(id);
       } catch (err) {
           response = err;
       } finally {
           expect(response).to.deep.equal(id);
       }
    });
    // To test the list of datasets present after removal.
    it("Should return an empty list of InsightDataset", async () => {
        let dts: InsightDataset[] = [];
        let response: InsightDataset[];

        try {
            response = await insightFacade.listDatasets();
        } finally {
            expect(response).to.deep.equal(dts);
        }
    });
    // Can't remove an already removed dataset.
    it("Should reject with NotFoundError because it's not present (any longer or otherwise)",
        async () => {
        const id: string = "courses";
        let response: any;
        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });
    // Can't add a NULL dataset.
    it("Should not be able to add a NULL dataset", async () => {
        let id: any = null;
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // Can't add an undefined dataset.
    it("Should not be able to add an UNDEFINED dataset", async () => {
        let id: any;
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // Can't add a dataset whose id is an empty string
    it("Should not be able to add an empty string id dataset", async () => {
        const id: string = "";
        let response: any[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    /*
    // Can't add a dataset whose kind is different dataset type is courses but param is rooms
    it("Should not be able to add a dataset with a different kind", async () => {
       const id: string = "roomsError";
       let response: any[];

       try {
           response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
       } catch (err) {
           response = err;
       } finally {
           expect(response).to.be.instanceOf(InsightError);
       }
    });
    */
    // Can't remove a NULL dataset
    it("Should not be able to remove a NULL dataset", async () => {
        let id: any = null;
        let response: any;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // Can't remove an UNDEFINED dataset
    it("Should not be able to remove an UNDEFINED dataset", async () => {
        let id: any;
        let response: any;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // Can't remove a dataset that was not added
    it("Shouldn't be able to remove a dataset that wasn't added", async () => {
        const id: string = "test13";
        let response: any;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // Can't remove a dataset that's not present
    it("Shouldn't be able to remove a dataset that's not present", async () => {
        const id: string = "testinvalid";
        let response: any;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });
    // Should be able to add rooms dataset
    it ("Should be able to add rooms dataset", async () => {
        const id: string = "rooms";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });
    // Should be able to list the added room dataset
    it ("Should be able to list the room dataset", async () => {
        const iD: string = "rooms";
        const dts: InsightDataset = {id: iD, kind: InsightDatasetKind.Rooms, numRows: 364};
        let response: InsightDataset[];
        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([dts]);
        }
    } );
    // Should be able to remove the rooms dataset
    it ("Should be able to remove rooms dataset", async () => {
        const id: string = "rooms";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });
    it ("Should be able to give the correct lat lon", async () => {
       const latlon: string = "6245 Agronomy Road V6T 1Z4";
       let response: number[];

       try {
           response = await RoomFormatter.getGeo(latlon);
       } catch (err) {
           response = err;
       } finally {
           expect(response).to.deep.equal([49.26125, -123.24807]);
       }
    });

    it ("Should not be able to give correct lat lon", async () => {
        const latlon: string = "6245 Agronomy Road V6T 1Z44";
        let response: number[];

        try {
            response = await RoomFormatter.getGeo(latlon);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([0, 0]);
        }
    });
});

// This test suite dynamically generates tests from the JSON files in test/queries.
// You should not need to modify it; instead, add additional files to the queries directory.
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        // courses2: "./test/data/courses2.zip",
        rooms: "./test/data/rooms.zip"
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];
    // Create a new instance of InsightFacade, read in the test queries from test/queries and
    // add the datasets specified in datasetsToQuery.
    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = await TestUtil.readTestQueries();
            expect(testQueries).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Fail if there is a problem reading ANY dataset.
        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToQuery)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToQuery)[i]]: buf.toString("base64") };
            });
            expect(loadedDatasets).to.have.length.greaterThan(0);

            const responsePromises: Array<Promise<string[]>> = [];
            const datasets: { [id: string]: string } = Object.assign({}, ...loadedDatasets);
            for (const [id, content] of Object.entries(datasets)) {
                if (id === "rooms") {
                responsePromises.push(insightFacade.addDataset(id, content, InsightDatasetKind.Rooms));
            } else {
                    responsePromises.push(insightFacade.addDataset(id, content, InsightDatasetKind.Courses));
                }}

            // This try/catch is a hack to let your dynamic tests execute even if the addDataset method fails.
            // In D1, you should remove this try/catch to ensure your datasets load successfully before trying
            // to run you queries.
            try {
                const responses: string[][] = await Promise.all(responsePromises);
                responses.forEach((response) => expect(response).to.be.an("array"));
            } catch (err) {
                Log.warn(`Ignoring addDataset errors. For D1, you should allow errors to fail the Before All hook.`);
            }
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    it("Should run test queries", () => {
        describe("Dynamic InsightFacade PerformQuery tests", () => {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, async () => {
                    let response: any[];

                    try {
                        response = await insightFacade.performQuery(test.query);
                    } catch (err) {
                        response = err;
                    } finally {
                        if (test.isQueryValid) {
                            expect(response).to.deep.equal(test.result);
                        } else {
                            expect(response).to.be.instanceOf(InsightError);
                        }
                    }
                });
            }
        });
    });
});
