/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function(query) {
    return new Promise(function(fulfill, reject) {
        // TODO: implement!
            let req = new XMLHttpRequest();
            req.open("POST","/query", true);
            req.setRequestHeader("Content-type", "application/json");
            req.send(JSON.stringify(query));
            req.onload = function() {
                let response = JSON.parse(req.responseText);
                if ("error" in response) {
                    reject(response.error);
                } else {
                    fulfill(response);
                }
            };
            req.onerror = function() {
                reject("Error on Fulfilling the request");
            };
    });
};
