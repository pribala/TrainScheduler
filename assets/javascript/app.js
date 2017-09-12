jQuery.noConflict();
$(document).ready(function () {

  // Initialize Firebase

  var config = {
    apiKey: "AIzaSyCW8mnSkargRBI-0MKnf4YKu58BkB5GkaQ",
    authDomain: "trying-firebase-55eab.firebaseapp.com",
    databaseURL: "https://trying-firebase-55eab.firebaseio.com",
    projectId: "trying-firebase-55eab",
    storageBucket: "trying-firebase-55eab.appspot.com",
    messagingSenderId: "934854500134"
  };
  firebase.initializeApp(config);

  // declare global variables for different sections of code
  var database = firebase.database();
  var trainName = "";
  var destination = "";
  var firstTrainTime = "";
  var frequency = 0;
  var unixTime = 0;
  var nextTrain = 0;
  var tMinutesTillTrain = 0;
  var status = false;
  var myKey = "";
  
    
  // Function to capitalize the first letter of each category
  function capitalizeStr(str) {
    var strArray = str.split(" ");
    var newStr = "";
    strArray.forEach(function(item) {
      newStr += item.charAt(0).toUpperCase() + item.slice(1)+ " ";
    });
      return newStr;
  }

  // Call the validator plugin to validate the form
  $('#inputForm').validator();
       
  // Add new value to database when add train button is clicked
  $("#addTrain").on("click", function (event) {
    event.preventDefault();
    // Check if user is logged in before allowing to add to the database    
    if(status){
      trainName = capitalizeStr($("#trainName").val().trim());
      destination = capitalizeStr($("#destination").val().trim());
      firstTrainTime = moment($("#firstTrainTime").val().trim(),"HH:mm").format("HHmm");
      firstTrainTime = moment(firstTrainTime, "HHmm").subtract(1, "years");
      unixTime = moment(firstTrainTime, "HHmm").unix();
      frequency = $("#frequency").val().trim();
      if(trainName && destination && firstTrainTime && frequency){
        var myKey = firebase.database().ref().push().key;
                  
        database.ref().push({
          trainName: trainName,
          destination: destination,
          firstTrainTime: unixTime,
          frequency: frequency,
          id: myKey
        });
                                
        // Clear the input fields after data is added to database
        $("#message").text("");
        $("#welcomeMessage").text("");
        $("#trainName").val("");
        $("#destination").val("");
        $("#firstTrainTime").val("");
        $("#frequency").val("");
      }else {
        $("#message").text("All form fields are required.");
      }
     }else {
             //$("#message").text("Sign In to check train times!");
             $(this).popover('show');
          }
    });

  // Function checks for new child added to database and updates the html display    
  database.ref().on("child_added", function (snapshot) {
    // storing the snapshot.val() in a variable for convenience
    var sv = snapshot.val();
    renderTable(sv);

  // Handle the errors
  }, function (errorObject) {
      console.log("inside added");
      console.log("Errors handled: " + errorObject.code);
  });

  // Function refreshs table data to provide realtime train time every 60 secs  
  setInterval(function(){  
     
    database.ref().once('value', function(snapshot) {
        var trains = [];
       snapshot.forEach(function(childSnapshot) {
         var childKey = childSnapshot.key;
         var childData = childSnapshot.val();
         trains.push(childData);
       });
       $("#tableBody").empty(); 
       renderData(trains);
    });
}, 60000);
        
  //Google sign in functionality
  var provider = new firebase.auth.GoogleAuthProvider();
  $("#signIn").click(function() {
    if(!status){
      firebase.auth().signInWithRedirect(provider);
    }else {
      firebase.auth().signOut().then(function() {
        // Sign-out successful.
        status = false;
        $("#signIn").text("Google SignIn");
        console.log('Signout Succesfull')
      }).catch(function(error) {
        // An error happened.
        console.log('Signout Failed')  
      });
    }
  });

  firebase.auth().getRedirectResult().then(function(result) {
    if (result.credential) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = result.credential.accessToken;
      status = true;
      $("#signIn").text("Signout");
    }
    // The signed-in user info.
    var user = result.user;
    console.log(user.displayName);
    $("#welcomeMessage").text("Hello "+user.displayName);
  }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      console.log(errorCode);
      var errorMessage = error.message;
      console.log(errorMessage);
      // The email of the user's account used.
      var email = error.email;
      console.log(email);
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      console.log(credential);
  });

  // Function handles the deletion of records
  $("body").on("click", "#delete", function(e){
    e.preventDefault();
    if(status) {
      var key = $(this).attr("data-key");
      database.ref().orderByChild('id').equalTo(key).once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          //remove each child
          database.ref().child(childSnapshot.key).remove();
        });
      });
    }else {
       //$("#message").text("You have to be signed in to edit!"); 
       $(this).popover("show");
    }  
  });
  
  function renderTable(sv) {
      // Current Time
        var currentTime = moment();
        
        var diffTime =moment(currentTime,"X").diff(moment(sv.firstTrainTime,"X"), "minutes");
        
        var tRemainder = diffTime % sv.frequency;
        
        // Minute Until Train
        tMinutesTillTrain = sv.frequency - tRemainder;
         
        // Next Train
        nextTrain = moment().add(tMinutesTillTrain, "minutes");
        var tableRow = $("<tr>");
        var name = $("<td>").text(sv.trainName);
        var trainDestination = $("<td>").text(sv.destination);
        var trainFrequency = $("<td>").text(sv.frequency);
        var nextTrainTime = $("<td>").text(moment(nextTrain).format("HH:mm"));
        var trainInMinutes = $("<td>").text(tMinutesTillTrain);
        trainInMinutes.attr("id", "MinutesToTrain");
        var dataButtons = $("<td>");
        var btn = $("<button>");
        btn.attr("id", "delete");
        btn.html("<i class='fa fa-trash' aria-hidden='true'>");
        btn.addClass("btnClass");
        btn.attr("data-key", sv.id);
        btn.attr("data-toggle", "popover");
        btn.attr("data-content", "You have to be signed in to delete!");
        dataButtons.append(btn);
        tableRow.append(name).append(trainDestination).append(trainFrequency).append(nextTrainTime).append(trainInMinutes).append(dataButtons);
        $("#tableBody").append(tableRow);
  }

  function renderData(data) {
    
    $("#tableBody").empty();
    data.forEach(function(item){
        // Current Time
        var currentTime = moment();
        
        var diffTime =moment(currentTime,"X").diff(moment(item.firstTrainTime,"X"), "minutes");
        
        var tRemainder = diffTime % item.frequency;
        
        // Minute Until Train
        tMinutesTillTrain = item.frequency - tRemainder;
         
        // Next Train
        nextTrain = moment().add(tMinutesTillTrain, "minutes");
        var tableRow = $("<tr>");
        var name = $("<td>").text(item.trainName);
        var trainDestination = $("<td>").text(item.destination);
        var trainFrequency = $("<td>").text(item.frequency);
        var nextTrainTime = $("<td>").text(moment(nextTrain).format("HH:mm"));
        var trainInMinutes = $("<td>").text(tMinutesTillTrain);
        var dataButtons = $("<td>");
        var btn = $("<button>");
        btn.attr("id", "delete");
        btn.html("<i class='fa fa-trash' aria-hidden='true'>");
        btn.addClass("btnClass");
        btn.attr("data-key", item.id);
        btn.attr("data-toggle", "popover");
        btn.attr("data-content", "You have to be signed in to delete!");
        dataButtons.append(btn);
        tableRow.append(name).append(trainDestination).append(trainFrequency).append(nextTrainTime).append(trainInMinutes).append(dataButtons);
        $("#tableBody").append(tableRow);
    });  
  }
});

