$(document).ready(function() {

  // Format Twilio phone number
  document.getElementById('phoneNum').innerHTML = formatPhoneNum(document.getElementById('phoneNum').innerHTML);

  // Retrieves the emails from Cloudant
  $.ajax( {
    url: "/api/v1/db/get_emails",
    cache : false
  }).done(function(data) {
    if (!data.error) {
      console.log("Successfully retrieved emails");
      var emailArray = JSON.parse(data);

      // Create a list item for each email in the array
      for (var i=0; i < emailArray.length; i++) {
        var li = document.createElement("li")
        li.innerHTML =  "<a href='" + emailArray[i].catImageUrl + "' target='_blank'>" +
                          "<img src='" + emailArray[i].catImageUrl + "'>" +
                        "</a>" +
                        "<p>" +
                          "<span>" + emailArray[i].emailAddress + "</span>" +
                        "</p>";

        document.getElementById('email-list').appendChild(li);
      }
    }
    else {
      console.error("Error getting emails from Cloudant");
      console.error(data);
    }
  });

  // Retrieves the errors from Cloudant
  $.ajax( {
    url: "/api/v1/db/get_errors",
    cache : false
  }).done(function(data) {
    if (!data.error) {
      console.log("Successfully retrieved errors");
      var errorArray = JSON.parse(data);

      // If no errors, ignore
      if (errorArray.length > 0) {
        // Create a list item for each email in the array
        for (var i=0; i < errorArray.length; i++) {
          console.log(errorArray[i]);
          var li = document.createElement("li");
          li.innerHTML =  "<div class='row'>" +
                            "<div class='col-lg-5 col-md-5 col-sm-5 col-xs-6'>" +
                              "<p class='errorField'>" + formatPhoneNum(errorArray[i].phoneNum) + "</p>" +
                            "</div>" +
                            "<div class='col-lg-7 col-md-7 col-sm-7 col-xs-6'>" +
                              "<p class='errorField'>" + errorArray[i].messageBody + "</p>" +
                            "</div>" +
                          "</div>";

          document.getElementById('errors-row').style.display='block';
          document.getElementById('error-list').appendChild(li);
        }
      }
    }
    else {
      console.error("Error getting errors from Cloudant");
      console.error(data);
    }
  });
});

// Takes an unformatted US phone number and returns formatted
function formatPhoneNum(phoneNum) {
  return phoneNum.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '$1-$2-$3-$4');
}
