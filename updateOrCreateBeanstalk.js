#!/bin/env node

var argCount = 3;

var solutionStackName = "64bit Amazon Linux 2016.03 v2.1.2 running Ruby 2.3 (Puma)";


var usageArray = [
    "",
    "Usage:",
    "   " + process.argv[1] + " <region> <application-name> <environment-name>",
    "",
    "",
  ];




function printUsage(lines){
  lines.forEach(function (line){
    console.log(line);
  });
}

function executeCommand(command, data, error, done){

  var exec = require('child_process').exec;
  var child;

  child = exec(command);

  child.stdout.on('data', data);
  child.stderr.on('data', error);
  child.on('close', done);
}

function findOrCreateApplication(region, application, done){

  findApplication(region,applicationName,function (found){
    if (!found){
      createApplication(region, applicationName, function (application){
        done(application);
      });
    }
    else {
      done(found);
    }
  });
}

function findApplication(region, applicationName, done){
  var foundApplication = null;
  executeCommand("aws elasticbeanstalk describe-applications --region " + region,
      function (data){
        console.log("findA-data:" + data);
        applicationResults = JSON.parse(data);
        applicationResults.Applications.forEach(function(application){
          if (application.ApplicationName === applicationName){
            foundApplication = application;
          }
        });

      },
      function (err){
        console.log("err:" + err);
      },
      function (exitCode){
        console.log("Code:" + exitCode);
        done(foundApplication);
      });
}


function createApplication(region, applicationName, done){
  var application;
  console.log("Processell.argv.length = " + process.argv.length );


  executeCommand("aws elasticbeanstalk create-application --region " + region + " --application-name " + applicationName,
      function (data){
        console.log("createA-data:" + data);
        application = JSON.parse(data).Application;
      },
      function (err){
        console.log("err:" + err);
      },
      function (exitCode){
        console.log("Code:" + exitCode);
        done(application);
      });
}

function findOrCreateEnvironment(region, applicationName, environmentName, done){

  findEnvironment(region,applicationName, environmentName,function (found){
    if (!found){
      createEnvironment(region, applicationName, environmentName, function (){
        findOrCreateEnvironment(region, applicationName, environmentName, done);
      });
    }
    else {
      if (found.Status == "Launching"){
        setTimeout(function () {
          findOrCreateEnvironment(region,applicationName,environmentName,done);
        },5000);
      }
      else if (found.Status == "Ready"){
        done(found);
      }
    }
  });
}

function findEnvironment(region, applicationName, environmentName, done){
  var foundEnvironment = null;
  executeCommand("aws elasticbeanstalk describe-environments --application-name " + applicationName,
      function (data){
        console.log("findE-data:" + data);
        applicationResults = JSON.parse(data);
        applicationResults.Environments.forEach(function(environment){
          if (environment.EnvironmentName === environmentName && environment.Status != "Terminated"){

            foundEnvironment = environment;
          }
        });

      },
      function (err){
        console.log("findE-err:" + err);
      },
      function (exitCode){
        console.log("Code:" + exitCode);
        done(foundEnvironment);
      });
}

function createEnvironment(region, applicationName, environmentName, done){
  var environment = null;
  executeCommand("aws elasticbeanstalk create-environment --application-name " + applicationName + " --environment-name " + environmentName + " --solution-stack-name \"" + solutionStackName + "\"",
      function (data){
        console.log("createE-data:" + data);
        environment = JSON.parse(data).Environment;
      },
      function (err){
        console.log("createE-err:" + err);
      },
      function (exitCode){
        console.log("Code:" + exitCode);
        done(environment);
      });

}


function complete(err){
  if (err){
    console.log("ERROR:" + err);
  }
  console.log("Complete");
}


if (process.argv.length != argCount + 2){ // Handle for "node" "script.js"
  printUsage(usageArray);
}
else {
  
  var region = process.argv[2];
  var applicationName = process.argv[3];
  var environmentName = process.argv[4];
  findOrCreateApplication(region, applicationName, function (application){
    console.log("Found Application:" + application.ApplicationName);
    findOrCreateEnvironment(region, applicationName, environmentName, function (environment){
      console.log("EnvironmentId:" + environment.EnvironmentId);
    });
  });
}


