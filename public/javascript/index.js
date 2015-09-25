$(document).ready(function() {
  // Send dummy text message
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
          li.innerHTML = "<a href='" + emailArray[i].catImageUrl + "' target='_blank'><img src='" + emailArray[i].catImageUrl + "'></a><p><span>" + emailArray[i].emailAddress + "</span></p>";

          document.getElementById("email-list").appendChild(li);
        }
      }
      else {
        console.error("Error getting emails from Cloudant");
        console.error(data);
      }
    });
});
