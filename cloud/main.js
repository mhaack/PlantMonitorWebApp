Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

Parse.Cloud.beforeSave("Status", function(request, response) {
  var createdAt = new Date();
  if (createdAt.getHours() == 10) {
    request.object.set("daily", true);
  }
  response.success();
});
