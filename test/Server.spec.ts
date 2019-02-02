import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");

import chaiHttp = require("chai-http");
import Log from "../src/Util";
import * as fs from "fs";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    let URL: string = "";

    chai.use(chaiHttp);

    before(async function () {
        facade = new InsightFacade();
        const port = 4321;
        URL = "http://localhost:" + String(port);
        server = new Server(port);
        // TODO: start server here once and handle errors properly
        await server.start(); // Server started
    });

    after(async function () {
        // TODO: stop server here once!
        Log.test(`After: ${this.test.parent.title}`);
        await server.stop(); // Server closed
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // TODO: read your courses and rooms datasets here once!
    const courses = fs.readFileSync(__dirname + "/data/courses.zip");
    const rooms = fs.readFileSync(__dirname + "/data/rooms.zip");
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(URL)
                .put("/dataset" + "/courses" + "/courses")
                .attach("body", courses, "courses.zip")
                .then(function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 200");
                    chai.expect(res.status).to.be.equal(200);
                    Log.trace("Actual: " + String(res.body.result));
                    Log.trace("Expected: courses");
                    chai.expect(String(res.body.result)).to.be.equal("courses");
                })
                .catch(function (err: any) {
                    // some logging here please!
                    chai.expect.fail(err);
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    it("PUT test for rooms dataset", function () {
        try {
            return chai.request(URL)
                .put("/dataset" + "/rooms" + "/rooms")
                .attach("body", rooms, "rooms.zip")
                .then( function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 200");
                    chai.expect(res.status).to.be.equal(200);
                    Log.trace("Actual: " + String(res.body.result));
                    Log.trace("Expected: courses,rooms");
                    chai.expect(String(res.body.result)).to.be.equal("courses,rooms");
                })
                .catch(function (err: any) {
                    chai.expect.fail(err);
                });
        } catch (err) {
            //
        }
    });
    it("GET test for the added datasets", function () {
        try {
            return chai.request(URL)
                .get("/datasets")
                .then( function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 200");
                    chai.expect(res.status).to.be.equal(200);
                    Log.trace("Actual: " + JSON.stringify(res.body.result));
                    Log.trace("Expected: [{\"id\":\"courses\",\"kind\":\"courses\",\"numRows\":64612}," +
                        "{\"id\":\"rooms\",\"kind\":\"rooms\",\"numRows\":364}]");
                    chai.expect(JSON.stringify(res.body.result)).to.be.equal("[{\"id\":\"courses\",\"kind\"" +
                        ":\"courses\",\"numRows\":64612},{\"id\":\"rooms\",\"kind\":\"rooms\",\"numRows\":364}]");
                })
                .catch(function (err: any) {
                    chai.expect.fail(err);
                });
        } catch (err) {
            //
        }
    });
    it ("DELETE test for the courses (added) dataset", function () {
        try {
            return chai.request(URL)
                .del("/dataset/courses")
                .then(function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 200");
                    chai.expect(res.status).to.be.equal(200);
                    Log.trace("Actual: " + String(res.body.result));
                    Log.trace("Expected: courses");
                    chai.expect(String(res.body.result)).to.be.equal("courses");
                }).catch(function (err: any) {
                    chai.expect.fail(err);
                });
        } catch (err) {
            //
        }
    });
    it ("Fail DELETE test for already removed courses dataset", function () {
        try {
            return chai.request(URL)
                .del("/dataset/courses")
                .catch( function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 404");
                    chai.expect(res.status).to.be.equal(404);
                }).catch( function (err: any) {
                    chai.expect.fail(err);
                });
        } catch (err) {
            //
        }
    });
    it ("DELETE test for the rooms (added) dataset", function () {
        try {
            return chai.request(URL)
                .del("/dataset/rooms")
                .then(function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 200");
                    chai.expect(res.status).to.be.equal(200);
                    Log.trace("Actual: " + String(res.body.result));
                    Log.trace("Expected: rooms");
                    chai.expect(String(res.body.result)).to.be.equal("rooms");
                }).catch(function (err: any) {
                    chai.expect.fail(err);
                });
        } catch (err) {
            //
        }
    });
    it ("Fail DELETE test for already removed courses dataset", function () {
        try {
            return chai.request(URL)
                .del("/dataset/testfail")
                .catch( function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 400");
                    chai.expect(res.status).to.be.equal(400);
                }).catch( function (err: any) {
                    chai.expect.fail(err);
                });
        } catch (err) {
            //
        }
    });
    it ("GET an empty list of InsightDataset, successfully", function () {
        try {
            return chai.request(URL)
                .get("/datasets")
                .then(function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 200");
                    chai.expect(res.status).to.be.equal(200);
                    Log.trace("Actual: " + String(res.body.result));
                    Log.trace("Expected: ");
                    chai.expect(String(res.body.result)).to.be.equal("");
                }).catch( function (err: any) {
                    chai.expect.fail(err);
                });
        } catch (err) {
            //
        }
    });
    it ("Fail PUT test for invalid kind", function () {
        try {
            return chai.request(URL)
                .put("/dataset/courses/rooms")
                .attach("body", __dirname + "/data/courses.zip", "courses.zip")
                .catch(function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 400");
                    chai.expect(res.status).to.be.equal(400);
                });
        } catch (err) {
            //
        }
    });
    it ("Fail PUT test for invalid kind for rooms", function () {
        try {
            return chai.request(URL)
                .put("/dataset/rooms/courses")
                .attach("body", __dirname + "/data/rooms.zip", "rooms.zip")
                .catch(function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 400");
                    chai.expect(res.status).to.be.equal(400);
                });
        } catch (err) {
            //
        }
    });
    it ("PUT test for courses", function () {
        try {
            return chai.request(URL)
                .put("/dataset/courses/courses")
                .attach("body", __dirname + "/data/courses.zip", "courses.zip")
                .then(function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 200");
                    chai.expect(res.status).to.be.equal(200);
                });
        } catch (err) {
            //
        }
    });
    it ("PUT test for rooms", function () {
        try {
            return chai.request(URL)
                .put("/dataset/rooms/rooms")
                .attach("body", __dirname + "/data/rooms.zip", "rooms.zip")
                .catch(function (res: ChaiHttp.Response) {
                    Log.trace("Actual: " + String(res.status));
                    Log.trace("Expected: 200");
                    chai.expect(res.status).to.be.equal(200);
                });
        } catch (err) {
            //
        }
    });
    it ("POST a simple query", function () {
        const query = {
            WHERE: {
                EQ: {
                    courses_avg: 98
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_instructor"
                ],
                ORDER: "courses_instructor"
            }
        };
        return chai.request(URL)
            .post("/query")
            .send(query)
            .then(function (res: ChaiHttp.Response) {
                Log.trace("Actual: " + String(res.status));
                Log.trace("Expected: 200");
                chai.expect(res.status).to.be.equal(200);
                Log.trace("Actual: " + JSON.stringify(res.body.result));
                Log.trace("Expected: [{\"courses_dept\":\"crwr\"," +
                    "\"courses_instructor\":\"grady, albert wayne\"},{\"courses_dept\":\"crwr\"," +
                    "\"courses_instructor\":\"grady, albert wayne\"},{\"courses_dept\":\"crwr\"," +
                    "\"courses_instructor\":\"maillard, keith\"},{\"courses_dept\":\"crwr\"," +
                    "\"courses_instructor\":\"maillard, keith\"}]");
                chai.expect(JSON.stringify(res.body.result)).to.be.equal("[{\"courses_dept\":\"crwr\"," +
                    "\"courses_instructor\":\"grady, albert wayne\"},{\"courses_dept\":\"crwr\"," +
                    "\"courses_instructor\":\"grady, albert wayne\"},{\"courses_dept\":\"crwr\"," +
                    "\"courses_instructor\":\"maillard, keith\"},{\"courses_dept\":\"crwr\"," +
                    "\"courses_instructor\":\"maillard, keith\"}]");
            });
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
