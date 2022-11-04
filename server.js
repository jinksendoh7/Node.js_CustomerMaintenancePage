// create express object from express module
let express = require('express');
// create body parser object from body-parser package
let bodyParser = require('body-parser');

// call express constructor to create express application object
let app = express();
app.use(bodyParser.urlencoded({ extended: false }));

let fs = require('fs');

//usedto validate input fields if  not empty
const { Validator } = require('node-input-validator');
let validateData = (postBody) => {
    return new Validator(postBody, {
        cusID: 'required',
        FirstName: 'required',
        LastName: 'required',
        Address: 'required',
        City: 'required',
        Province: 'required',
        Postal: 'required',
    });
}


// create a handler (using an arrow function) for the HTTP GET request
// use the __dirname global value to create fully qualified url
app.get('/', (request, response) => response.sendFile(__dirname + "/index.html"));

// create a handler (using an arrow function) for the HTTP POST request
app.post('/api/data', (request, response) => {
    let postBody = request.body;
    let custFileId = postBody.cusID; //id number
    let path = __dirname + '/api/data/' + custFileId + '.txt'; //fulpath
    let v = validateData(postBody); //check validation

    if (postBody.btn == "Find") {
        fs.readFile(path, { encoding: "utf8" }, function (err, data) {
            if (err) {
                postBody.first = "Not found";
                postBody.last = "";
                postBody.address = "";
                postBody.city = "";
                postBody.province = "";
                postBody.postal = "";
                postBody.response = "No Data Retrieved";
                response.send(postBody);
                console.log(err);
            }
            else {
                let cusData = JSON.parse(data); //convert json string to object
                postBody.first = cusData.FirstName;
                postBody.last = cusData.LastName;
                postBody.address = cusData.Address;
                postBody.city = cusData.City;
                postBody.province = cusData.Province;
                postBody.postal = cusData.Postal;
                postBody.response = "Data Retrieved";
                response.send(postBody);
                console.log(postBody);
            }
        });
    }

    else if (postBody.btn == "Add" || postBody.btn == "Update") { //buttons for adding or updating are merged into 1
        //validate inputs
        v.check().then((matched) => {
            if (!matched) {
                console.log(val.errors);
                return response.send('All fields must have inputs');
            }
            else {
                if (fs.existsSync(path)) {
                    // path exists
                    if (postBody.btn == "Add") { //add request
                        console.log("Customer # " + custFileId + " exists:", path);
                        return response.send('Customer # ' + custFileId + ' has already existed.');
                    }
                    else { //update request
                        delete postBody.btn; //btn element was used to check which is which buttons
                        // customer exists
                        fs.writeFile(path, JSON.stringify(postBody, null, 2), function (err) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                console.log("Customer's data updated!");
                                return response.send('Customer # ' + custFileId + ' has been updated successfully');
                            }
                        })
                    }
                } else {
                    //data not existed
                    if (postBody.btn == "Add") { //add request
                        delete postBody.btn; //btn element was used to check which is which buttons
                        fs.writeFile(path, JSON.stringify(postBody, null, 2), function (err) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                console.log("New Customer added!");
                                return response.send('Customer # ' + custFileId + ' has been added successfully');
                            }
                        })
                    }
                    else { //update request
                        //customer not existed
                        console.log('No Customer # ' + custFileId + ' recorded.');
                        return response.send('No Customer # ' + custFileId + ' recorded.');
                    }
                }
            }
        })
    }

    else { //post request for delete function
        if (fs.existsSync(path)) {
            // path exists
            fs.unlinkSync(path);
            console.log("Customer's data deleted!");
            return response.send('Customer # ' + custFileId + ' has been deleted successfully');
        }
        else {
            console.log("Customer's data not deleted!");
            return response.send('No Customer # ' + custFileId + ' not deleted!');
        }
    }

});

let port = process.env.PORT || 1337;



// create the web server running on port 1337
let server = app.listen(port, function () {
    console.log("Server is running on port " + port);
});
