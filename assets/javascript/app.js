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

    var database = firebase.database();
    var trainName = "";
    var destination = "";
    var firstTrainTime = "";
    var frequency = 0;
    // var minutesAway = 0;
    // var nextArrival = "";
    var unixTime = 0;
    var nextTrain = 0;
    var tMinutesTillTrain = 0;
    var status = false;
    

    // Function to capitalize the first letter of each category
    function capitalizeStr(str) {
        var strArray = str.split(" ");
        var newStr = "";
        strArray.forEach(function(item) {
            newStr += item.charAt(0).toUpperCase() + item.slice(1)+ " ";
        });
        return newStr;
    }

    $('#inputForm').validator();
    
    // Add new value to database when add train button is clicked
    $("#addTrain").on("click", function (event) {
        event.preventDefault();
        
          if(status){
            trainName = capitalizeStr($("#trainName").val().trim());
            destination = capitalizeStr($("#destination").val().trim());
            firstTrainTime = moment($("#firstTrainTime").val().trim(),"HH:mm").format("HHmm");
            unixTime = moment(firstTrainTime, "HHmm").unix();
            frequency = $("#frequency").val().trim();

            database.ref().push({
                  trainName: trainName,
                  destination: destination,
                  firstTrainTime: unixTime,
                  frequency: frequency
            })

            // Clear the input fields after data is added to database
            $("#message").text("");
            $("#welcomeMessage").text("");
            $("#trainName").val("");
            $("#destination").val("");
            $("#firstTrainTime").val("");
            $("#frequency").val("");
         }else {
             console.log("Sign In to check train times!");
             $("#message").text("Sign In to check train times!");
         }
    });

    // Function checks for new child added to database and updates the html display    
    database.ref().on("child_added", function (snapshot) {
        // storing the snapshot.val() in a variable for convenience
        var sv = snapshot.val();
        
        // Current Time
        var currentTime = moment();
        var diffTime =moment(currentTime,"X").diff(moment(sv.firstTrainTime,"X"), "minutes");
        //console.log("DIFFERENCE IN TIME: " + diffTime);
        var tRemainder = diffTime % sv.frequency;
        //console.log(tRemainder);

        // Minute Until Train
        tMinutesTillTrain = sv.frequency - tRemainder;
        //console.log("MINUTES TILL TRAIN: " + tMinutesTillTrain);
    
        // Next Train
        nextTrain = moment().add(tMinutesTillTrain, "minutes");
        //console.log("ARRIVAL TIME: " + moment(nextTrain).format("HH:mm"));
        
        var tableRow = $("<tr>");
        var name = $("<td>").text(sv.trainName);
        var trainDestination = $("<td>").text(sv.destination);
        var trainFrequency = $("<td>").text(sv.frequency);
        var nextTrainTime = $("<td>").text(moment(nextTrain).format("HH:mm"));
        var trainInMinutes = $("<td>").text(tMinutesTillTrain);
        var dataButtons = $("<td>").html('<span class="btnClass"><i class="fa fa-trash" aria-hidden="true"></i></span><span class="btnClass"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></span>');
       
        tableRow.append(name).append(trainDestination).append(trainFrequency).append(nextTrainTime).append(trainInMinutes).append(dataButtons);
        $("#tableBody").append(tableRow);
        // Handle the errors
    }, function (errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });

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
            // ...
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
          // ...
        });
        // $.validator.setDefaults( {
        //     submitHandler: function () {
        //         alert( "submitted!" );
        //     }
        // } );


        // $("#inputform").validate({

        //   rules: {
        //     // simple rule, converted to {required:true}
        //     trainName: "required",
        //     destination: "required",
        //     firstTrainTime: "required",
        //     frequency: "required"
        //   },
        //   messages: {
        //             trainName: "Please enter train name",
        //             destination: "Please enter destination",
        //             firstTrainTime: "Please enter train time",
        //             frequency: "Please enter frequency"
        //   }          

        // });

    });
