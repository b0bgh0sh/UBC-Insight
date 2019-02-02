/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
// import Log from "../../src/Util";

// import * as parse5 from "parse5";

CampusExplorer.buildQuery = function() {

    let datasetKey = ["audit", "avg", "dept", "instructor", "id", "title", "pass", "fail", "uuid", "year", "fullname",
        "shortname", "number", "name", "address", "lat", "lon", "seats", "type", "furniture", "href"];

    // query to modify
    let query = {};

    // forms - ask Bob
    let elements = document.forms;

    // leftContainer is where all the information are in
    let leftContainer = document.getElementById("left-container");
    // get the active tab (should be either courses or rooms
    let active = leftContainer.getElementsByClassName("tab-panel active")[0];

    // <form data-type="rooms">  or courses
    let form = active.getElementsByTagName("form")[0];

    // get dataset type (courses or rooms)
    // https://piazza.com/class/jllqzswlx9l1jg?cid=1510
    let datasetType = form.getAttribute("data-type");
    // console.log("Dataset type is " + datasetType);

    // get condition type
    let conditions = form.getElementsByClassName("control-group condition-type")[0];
    let conditionList = conditions.getElementsByTagName("input");
    // logic - AND, OR or NOT
    let logic;
    for (let cond of conditionList) {
        if (cond["checked"]) {
            logic = cond["value"];
        }
    }

    // store all conditions
    let conditionArray = [];
    // store the xxx_yyy of column values
    let columnsArray = [];
    // store all the keys that are to be ordered
    // order of the key doesnt matter
    let orderArray = [];
    // is the order in ascending or descending order - true (default) if ascending
    let ascend = true;

    //
    // console.log("It's courses")
    let conditionsCont = form.getElementsByClassName("control-group condition");

    // control-group condition is 1 condition
    // consists of (optional not), key, comparator and value

    // fill with objects

    for (let cond of conditionsCont) {
        // array to store keys - might need to be initialized outside

        // consists of (optional not), key, comparator and value
        // an object
        let notCounter  = false;
        let keyCounter  = "";
        let opCounter   = "";
        // need to type check
        let termCounter;

        // see whether a condtion has a not up front
        let not = cond.getElementsByClassName("control not")[0];
        let checked = not.getElementsByTagName("input")[0].checked;
        // console.log("check is " + checked);
        if (checked) {
            notCounter = true;
            // console.log("not is " + notCounter);
        }
        // keys container
        let fields = cond.getElementsByClassName("control fields");
        for (let field of fields) {
            let options = field.getElementsByTagName("option");
            // console.log(option.selected);
            for (let option of options) {
                // console.log(option);
                if (option.selected) {
                    // console.log(option.value);
                    keyCounter = option.value;
                    // can only have one key so break once found a key
                    break;
                }
            }

        }

        // operator (EQ, IS, etc)
        let operators = cond.getElementsByClassName("control operators");
        for (let op of operators) {
            let options = op.getElementsByTagName("option");
            // console.log(option.selected);
            for (let option of options) {
                // console.log(option);
                if (option.selected) {
                    // console.log(option.value);
                    opCounter = option.value;
                    // can only have one key so break once found a key
                    break;
                }
            }

        }
        // value
        let terms = cond.getElementsByClassName("control term");
        for (let t of terms) {
            let option = t.getElementsByTagName("input")[0];
            // console.log(option.value);
            // console.log(option.value.length > 0);
            if (option.value.length > 0) {
                // console.log(option.value);
                // number type
                if (opCounter == 'EQ' || opCounter == 'GT' || opCounter == 'LT') {
                    // TODO
                    termCounter = Number(option.value);
                } else if (opCounter == "IS") {
                    termCounter = option.value;
                }
                // can only have one value so break once found a key
                break;
            }
        }
        /*
        console.log(notCounter);
        console.log(keyCounter);
        console.log(opCounter);
        console.log(termCounter);
        */


        // push to condtionArray

        let termObject = {};
        let condObject = {};
        let notObject  = {}

        if (!notCounter) {
            // console.log("k1 is " + keyCounter);
            // console.log(datasetKey.includes(keyCounter));
            if(datasetKey.includes(keyCounter)) {
                termObject[datasetType + "_" + keyCounter] = termCounter;
            }
            // console.log(termObject);
            condObject[opCounter] = termObject;
            // console.log(condObject);
            conditionArray.push(condObject);

        } else  {
            // console.log("k2 is " + keyCounter);
            if(datasetKey.includes(keyCounter)) {
                termObject[datasetType + "_" + keyCounter] = termCounter;
            }
            condObject[opCounter] = termObject;
            notObject["NOT"] = condObject;
            // console.log("not object is" + notObject);

            conditionArray.push(notObject);
        }
    }

    // TODO - maybe modify this when doing group/transformation
    // getting COLUMNS
    let columns = form.getElementsByClassName("form-group columns")[0];
    // console.log(columns);
    let inputs = columns.getElementsByTagName("input");
    // console.log(inputs);
    for (let input of inputs) {
        // console.log(input);
        if (input.checked) {
            // safeguard
            if(datasetKey.includes(input.value)) {
                columnsArray.push(datasetType + "_" + input.value);
            }

            // console.log(dataKey);
        }
    }
    // TODO find dataset name (xxx of xxx_yyy) & write test using dataset type = courses with a different name

    // do ORDER - order by multiple keys is possible but not tested heavily
    let orders = form.getElementsByClassName("control order fields")[0];
    // console.log(orders)

    let options = orders.getElementsByTagName("option");
    for (let option of options) {
        // console.log(option);
        // console.log(option.value);
        // if a key is selected into ORDER,
        if (option.selected) {
            // console.log(option.value);
            if(datasetKey.includes(option.value)) {
                orderArray.push(datasetType + "_" + option.value);
            } else {
                orderArray.push(option.value);
            }
        }
    }

    // boolean - true if ascend
    // TODO check whether it's ascending or descending
    let controlDesc = form.getElementsByClassName("control descending");
    ascend = !controlDesc[0].getElementsByTagName("input")[0].checked;

    // contain elements
    let groupArray = []

    // store all new keys
    let applyKeyArray = [];
    let applyArray = [];

    let formGroupTrans = form.getElementsByClassName("form-group transformations")[0];

    let controlGroupTrans = formGroupTrans.getElementsByClassName("control-group transformation");
    // console.log(controlGroupTrans);
    /*
    let transCont = formGroupTrans.getElementsByClassName("transformations-container");
    console.log(transCont.length);
    console.log(transCont);
    let transControlGroup = transCont.getElementsByClassName("control-group transformation");
    console.log(transControlGroup.length);
    console.log(transControlGroup);
    // console.log(transControlGroup[0]);
    */
    if (controlGroupTrans.length > 0) {
        // GROUP
        let groups = form.getElementsByClassName("form-group groups")[0];

        // console.log(groups);



        let groupOptions = groups.getElementsByClassName("control field");
        // console.log(groupOptions);
        for (let group of groupOptions) {
            let input = group.getElementsByTagName("input")[0];
            // console.log(input)
            if (input.checked) {
                // console.log(input.value);
                groupArray.push(datasetType + "_" + input.value);
            }
        }

        // console.log(groupArray);


        // console.log("groupArray's length is " + groupArray.length);

        // TRANSFORMATION


        for (let t of controlGroupTrans) {
            // console.log(t);
            // initialize things
            let inputValue = "";
            let operation  = "";
            let controlField = "";
            let inputs = t.getElementsByTagName("input");
            // console.log(t);
            // console.log(inputs)
            for (let input of inputs) {
                if (input) {
                    // console.log(input.value);
                    applyKeyArray.push(input.value);
                    inputValue = input.value;
                }
            }

            let operator = t.getElementsByClassName("control operators");
            for (let op of operator) {
                let options = op.getElementsByTagName("option");
                for (let option of options) {
                    if (option.selected) {

                        operation = option.value;
                    }
                }
            }
            let field = t.getElementsByClassName("control fields");
            for (let f of field) {
                let options = f.getElementsByTagName("option");
                for (let option of options) {
                    if (option.selected) {
                        controlField = option.value;
                    }
                }
            }

            /*
            console.log(inputValue);
            console.log(operation);
            console.log(controlField);
            */

            let applyObject = {};
            let opObject = {};
            opObject[operation] = datasetType + "_" + controlField;
            applyObject[inputValue] = opObject;
            applyArray.push(applyObject);
        }
    }


    // console.log(applyKeyArray);

    // console.log(transCont);




    // add WHERE to Query
    if (conditionArray.length == 1){
        query["WHERE"] = conditionArray[0];
    } else {
        let logicObject = {};
        // since each condition in an AND, OR or NONE is in an array, \
        // create an object [logic] and assign the array to it
        for (let cond of conditionArray) {

            if (logic.toUpperCase() == "ALL") {
                logicObject["AND"] = conditionArray;
            } else if (logic.toUpperCase() == "ANY") {
                logicObject["OR"] = conditionArray;
            } else if (logic.toUpperCase() == "NONE") {
                // every condition is put in a NOT
                // AND every condition
                // console.log("condition is " +  conditionArray);
                let container = [];
                for (let condition of conditionArray) {
                    let notObject = {};
                    notObject["NOT"] = condition;
                    container.push(notObject);
                }
                logicObject["AND"] = container;
            }


        }
        // use
        query["WHERE"] = logicObject;

    }
    // OPTIONS object
    let optionsObject = {};
    // FOR D2 ORDER
    // DIR - UP & DOWN
    /*
    "ORDER": {
      "dir": "DOWN",
      "keys": [
        "courses_id"
      ]
    }
     */
    let dirObject = {};
    let orderObject = {};
    let keyObject = {};

    // add all the applyKey to columns
    for (let appKey of applyKeyArray) {
        if (typeof appKey == "string") {

        }
        columnsArray.push(appKey);
    }


    // add OPTIONS to query
    // no order
    if (orderArray.length == 0) {
        optionsObject["COLUMNS"] = columnsArray;
        query["OPTIONS"] = optionsObject;

    } else if (ascend == true && orderArray.length == 1) {  // simple (D1) order
        // simple case
        optionsObject["COLUMNS"] = columnsArray;
        optionsObject["ORDER"] = orderArray[0];
        query["OPTIONS"] = optionsObject;
    } else if (ascend == true) {                           // D2 order ascend
        optionsObject["COLUMNS"] = columnsArray;
        // FOR ORDER Object
        orderObject["dir"] = "UP";
        orderObject["keys"] = orderArray;

        optionsObject["ORDER"] = orderObject
        query["OPTIONS"] = optionsObject;
    } else if (ascend == false) {                           // D2 order ascend
        optionsObject["COLUMNS"] = columnsArray;
        // FOR ORDER Object
        orderObject["dir"] = "DOWN";
        orderObject["keys"] = orderArray;

        optionsObject["ORDER"] = orderObject
        query["OPTIONS"] = optionsObject;
    }

    // adding TRANSFORMATION- if there's any
    if (controlGroupTrans.length > 0) {
        let transObject = {};
        for (let group of groupArray) {
            transObject["GROUP"] = groupArray;
        }
        transObject["APPLY"] = applyArray;
        query["TRANSFORMATIONS"] = transObject;
    }



    // return query
    return query;
};
