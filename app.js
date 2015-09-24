//---Module Dependencies--------------------------------------------------------
var express = require('express'),
    bodyParser     = require("body-parser"),
    methodOverride = require("method-override"),
    app = express(),
    http = require("http"),
    dust = require("dustjs-linkedin"),
    consolidate = require("consolidate"),
    cfenv = require("cfenv");

//---Deployment Tracker---------------------------------------------------------
require("cf-deployment-tracker-client").track();

//---Routers and View Engine----------------------------------------------------
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(methodOverride());

app.engine("dust", consolidate.dust);
app.set("template_engine", "dust");
app.set("views", __dirname + '/views');
app.set("view engine", "dust");

//---Environment Vars-----------------------------------------------------------
var vcapLocal = null
try {
  vcapLocal = require("./vcap-local.json")
}
catch (e) {}

var appEnvOpts = vcapLocal ? {vcap:vcapLocal} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

//---Set up Cloudant------------------------------------------------------------
var cloudantCreds = getServiceCreds(appEnv, "email-collector-datastore"),
    nano = require("nano")(cloudantCreds.url),
    dbHelper = require("./lib/cloudantHelper.js"),
    dbName = "emails",
    db;

//Construct 'intercom' DB if it does not exist
dbHelper.dbExists(nano, dbName, function (err,res) {
  if (!err) {
    if (res) {
      db = nano.db.use(dbName);
      console.log("'" + dbName + "' found - using DB");
    }
    else {
      console.log("'" + dbName + "' not found - creating DB");
      nano.db.create(dbName, function(err, body) {
        if (err) {
          console.error('Error creating ' + dbName);
        }
        else {
          console.log("'" + dbName + "' DB created");
          db = nano.db.use(dbName);
          seedDB();
        }
      });
    }
  }
  else {
    console.error("Could not verify if DB exists. Issues may result");
  }
});

//---Set up Twilio--------------------------------------------------------------
var twilioCreds = getServiceCreds(appEnv, "email-collector-sms"),
    twilioClient = require('twilio')(twilioCreds.accountSID, twilioCreds.authToken),
    twilioHelper = require("./lib/twilioHelper.js"),
    twilioNumber = "15123611684";

//---Web Page HTTP Requests-----------------------------------------------------

// Splash screen
app.get("/", function (request, response) {
    response.render('index', {
      title : "Email Collector"
    });
});

//---DB HTTP Requests-----------------------------------------------------------

// Getting list of emails
app.get('/api/v1/db/get_emails', function(request, response) {
  dbHelper.getRecords(db, 'emails', 'emails_index', function(result) {
    response.send(result);
  });
});

// Saving an email record
app.get('/api/v1/db/save_email', function(request, response) {
  // Build an email record from the received request
  var emailRecord = {
    'type': "email",
  };
  if (request.query.email && request.query.phone) {
    emailRecord.email = request.query.email;
    emailRecord.phone = request.query.phone;
    saveEmailRecord(emailRecord.phone, emailRecord.email);
    response.send("Success");
  }
  else {
    response.send("Error");
  }
});

//---Twilio HTTP Requests-----------------------------------------------------------

// Getting list of all bttns
app.get('/api/v1/sms', function(request, response) {
  console.log("Received a text message: " + request.query.Body + " from " + request.query.From);

  // Check to make sure email is valid and save it to Cloudant
  var email = request.query.Body.trim();
  if (validateEmail(email)) {
    saveEmailRecord(request.query.From, email);
    receivedResponse(true, request.query.From);
  }
  // If email is invalid, write an error record
  else {
    console.log("Email from " + request.query.From + " contains an invalid email address");
    saveErrorRecord(request.query.From, email);
    receivedResponse(false, request.query.From);
  }

  response.send({"success":true});
});

//---Start HTTP Server----------------------------------------------------------
var server = app.listen(appEnv.port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('server listening at http://%s:%s', host, port);
});

//---Process Ending Handlers----------------------------------------------------
process.on("exit", function(code) {
  console.log("exiting with code: " + code);
})

process.on("uncaughtException", function(err) {
  console.log("exiting on uncaught exception: " + err.stack);
  process.exit(1);
})

//---Server Functions-----------------------------------------------------------
// Ensures an input service is found in VCAPS
// If found, returns the service credentials
function getServiceCreds(appEnv, serviceName) {
  var serviceCreds = appEnv.getServiceCreds(serviceName)
  if (!serviceCreds) {
    console.log("service " + serviceName + " not bound to this application");
    return null;
  }
  return serviceCreds;
}

// Returns whether the input email is valid (works for 99.9% emails)
function validateEmail(email) {
  var reg = /^[a-zA-Z0-9_\.\-]+\@[a-zA-Z0-9\.\-]+\.[a-zA-Z0-9]{2,6}$/;
  return reg.test(email);
}

// Respond to the attendee and let them if their submission was received
function receivedResponse(validEmail, phoneNum) {

  // Formulate a response based on if the texted email was valid
  var response;
  if (validEmail)
    response = "Your email was received, thank you!";
  else
    response = "Sorry, your email was invalid. Please try again or get help from a Bluemix SME."

  // Send message to rep if not locally testing
  if (!appEnv.isLocal)
    twilioHelper.sendTextMessage(twilioClient, twilioNumber, phoneNum, response);
}

// Save email record with the input values
function saveEmailRecord(phoneNum, email) {
  var emailRecord = {
    'type' : "email",
    'phone' : phoneNum,
    'email' : email
  };

  dbHelper.insertRecord(db, emailRecord, function(result) {});
}

// Save an error record with the input values
function saveErrorRecord(phoneNum, body) {
  var errorRecord = {
    'type' : "error",
    'phone' : phoneNum,
    'message' : body
  };

  dbHelper.insertRecord(db, errorRecord, function(result) {});
}

// Set up the DB to default status
function seedDB() {

  // Create design docs and insert them
  var designDocs = [
    {
      "_id": "_design/emails",
      views: {
        emails_index: {
          map: function(doc) {
            if (doc.type === 'email') {
              emit (doc._id, {
                uniqueId : doc._id,
                revNum : doc._rev,
                phoneNum : doc.phone,
                emailAddress : doc.email
              });
            }
          }
        }
      }
    },
    {
      "_id": "_design/errors",
      views: {
        errors_index: {
          map: function(doc) {
            if (doc.type === 'error') {
              emit (doc._id, {
                uniqueId : doc._id,
                revNum : doc._rev,
                phoneNum : doc.phone,
                messageBody : doc.message
              });
            }
          }
        }
      }
    }
  ];

  designDocs.forEach(function(doc) {
    db.insert(doc, doc._id, function(err, body) {
      if (!err)
        console.log(body);
    });
  });
}
